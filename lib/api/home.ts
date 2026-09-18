import { cacheLife, cacheTag } from 'next/cache'
import { getHome as getHomeImpl } from '@/lib/api/home.impl'
import { tags } from '@/lib/cache-tags'
import type { Locale } from '@/lib/i18n/config'
import type { Home } from '@/lib/schemas'

export async function getHome(locale: Locale): Promise<Home> {
  'use cache'
  cacheTag(tags.home())
  cacheLife('max')

  return getHomeImpl(locale)
}
