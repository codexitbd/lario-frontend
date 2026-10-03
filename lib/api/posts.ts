import { cacheLife } from 'next/cache'
import { apiFind } from '@/lib/api/client'
import type { Locale } from '@/lib/i18n/config'
import { type Event, type Post, eventSchema, postSchema } from '@/lib/schemas'

export async function getPost(locale: Locale, slug: string, preview?: string): Promise<Post | null> {
  'use cache'
  cacheLife('max')

  return apiFind(`/posts/${encodeURIComponent(slug)}`, postSchema, { locale, preview })
}

export async function getEvent(locale: Locale, slug: string, preview?: string): Promise<Event | null> {
  'use cache'
  cacheLife('max')

  return apiFind(`/events/${encodeURIComponent(slug)}`, eventSchema, { locale, preview })
}
