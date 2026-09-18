import en from '@/messages/en.json'
import ar from '@/messages/ar.json'
import type { Locale } from '@/lib/i18n/config'

export type Dictionary = typeof en

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar: ar as Dictionary }

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return DICTIONARIES[locale]
}

export function interpolate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  )
}
