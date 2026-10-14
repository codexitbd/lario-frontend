import { cacheLife } from 'next/cache'
import { z } from 'zod'
import { apiFind, apiGet } from '@/lib/api/client'
import type { Locale } from '@/lib/i18n/config'
import { type Event, type GalleryAlbum, type Post, type PostCard, eventSchema, galleryAlbumSchema, postCardSchema, postSchema } from '@/lib/schemas'

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

/** The newest posts, one page of up to 48 (the API's maximum); /blog renders them all statically. */
export async function getPosts(locale: Locale): Promise<PostCard[]> {
  'use cache'
  cacheLife('max')

  return apiGet('/posts?per_page=48', z.array(postCardSchema), { locale })
}

export async function getGalleries(locale: Locale): Promise<GalleryAlbum[]> {
  'use cache'
  cacheLife('max')

  return apiGet('/galleries', z.array(galleryAlbumSchema), { locale })
}
