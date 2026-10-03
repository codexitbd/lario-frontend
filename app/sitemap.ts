import type { MetadataRoute } from 'next'
import { cacheLife } from 'next/cache'
import { z } from 'zod'
import { SITE_URL } from '@/lario.config'
import { apiGet } from '@/lib/api/client'
import { LOCALES, localePath } from '@/lib/i18n/config'

const entrySchema = z.object({ type: z.string(), path: z.string(), lastmod: z.string().nullable() })

async function entries() {
  'use cache'
  cacheLife('max')

  return apiGet('/sitemap', z.array(entrySchema))
}

/**
 * Every public, indexable address in both languages, with hreflang alternates.
 * Which types appear, and whether anything appears at all, is the admin's call
 * (Settings → SEO).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const list = await entries().catch(() => [])
  const url = (locale: (typeof LOCALES)[number], path: string) => `${SITE_URL}${localePath(locale, path)}`

  return list.flatMap((entry) =>
    LOCALES.map((locale) => ({
      url: url(locale, entry.path),
      lastModified: entry.lastmod ?? undefined,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, url(l, entry.path)])) },
    })),
  )
}
