import { cacheLife, cacheTag } from 'next/cache'
import { getSettings as getSettingsImpl } from '@/lib/api/settings.impl'
import { tags } from '@/lib/cache-tags'
import type { Locale } from '@/lib/i18n/config'
import type { Settings } from '@/lib/schemas'

export async function getSettings(locale: Locale): Promise<Settings> {
  'use cache'
  cacheTag(tags.settings())
  cacheLife('max')

  return getSettingsImpl(locale)
}
