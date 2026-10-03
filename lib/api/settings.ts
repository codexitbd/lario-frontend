import { cacheLife } from 'next/cache'
import { apiGet } from '@/lib/api/client'
import type { Locale } from '@/lib/i18n/config'
import { type Settings, settingsSchema } from '@/lib/schemas'

export async function getSettings(locale: Locale): Promise<Settings> {
  'use cache'
  cacheLife('max')

  return apiGet('/settings', settingsSchema, { locale })
}
