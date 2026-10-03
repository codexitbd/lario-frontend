import { cacheLife } from 'next/cache'
import { z } from 'zod'
import { apiGet } from '@/lib/api/client'
import { getDishTags } from '@/lib/api/menu'
import en from '@/messages/en.json'
import ar from '@/messages/ar.json'
import type { Locale } from '@/lib/i18n/config'

export type Dictionary = typeof en

const DICTIONARIES = { en, ar } satisfies Record<Locale, Dictionary>

type Tree = { [key: string]: string | Tree }

/** Writes "a.b.c" = value into a nested copy, only where the bundled key exists. */
function setPath(target: Tree, path: string, value: string): void {
  const keys = path.split('.')
  let node: Tree = target
  for (const key of keys.slice(0, -1)) {
    const next = node[key]
    if (typeof next !== 'object') return
    node = next
  }
  const last = keys.at(-1)!
  if (typeof node[last] === 'string' || !(last in node)) node[last] = value
}

/**
 * UI strings: the bundled messages/{locale}.json is the fallback and the type;
 * the admin's "Site texts" (and dish tag labels) are layered over it. A key the
 * admin hasn't touched, or an API outage, simply leaves the bundled wording.
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  'use cache'
  cacheLife('max')

  const dictionary = structuredClone(DICTIONARIES[locale]) as unknown as Tree

  const [strings, tags] = await Promise.all([
    apiGet('/ui-strings', z.record(z.string(), z.record(z.string(), z.string().nullable())), { locale }).catch(() => ({})),
    getDishTags(locale).catch(() => []),
  ])

  for (const [group, entries] of Object.entries(strings)) {
    for (const [key, value] of Object.entries(entries)) {
      if (value) setPath(dictionary, `${group}.${key}`, value)
    }
  }

  const menu = dictionary.menu as Tree
  for (const tag of tags) {
    if (!tag.label) continue
    const bucket = (tag.type === 'dietary' ? menu.tags : menu.allergenNames) as Tree
    bucket[tag.slug] = tag.label
  }

  return dictionary as unknown as Dictionary
}

export { interpolate } from '@/lib/i18n/interpolate'
