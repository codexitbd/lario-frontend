import { cacheLife } from 'next/cache'
import { apiGet } from '@/lib/api/client'
import type { Locale } from '@/lib/i18n/config'
import { type Home, homeSchema } from '@/lib/schemas'

export async function getHome(locale: Locale): Promise<Home> {
  'use cache'
  cacheLife('max')

  return apiGet('/home', homeSchema, { locale })
}
