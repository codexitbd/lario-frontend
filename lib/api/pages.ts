import { cacheLife } from 'next/cache'
import { z } from 'zod'
import { apiFind, apiGet } from '@/lib/api/client'
import type { Locale } from '@/lib/i18n/config'
import { type Page, type PageSection, pageSectionSchema, seoSchema } from '@/lib/schemas'

const apiPageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  is_home: z.boolean(),
  url: z.string(),
  sections: z.array(pageSectionSchema),
  seo: seoSchema,
})

const text = (section: PageSection | undefined, key: string): string => {
  const value = section?.content[key]
  return typeof value === 'string' ? value : ''
}

/**
 * A CMS page. `heading`, `body` and `image` are lifted from its first "Page header" and
 * "Text" components, so the purpose-built pages (/menu, /contact,
 * /reservation) keep their designed layouts while the admin edits the words.
 */
export async function getPage(
  locale: Locale,
  slug: string,
  preview?: string,
): Promise<Page | null> {
  'use cache'
  cacheLife('max')

  const page = await apiFind(`/pages/${encodeURIComponent(slug)}`, apiPageSchema, { locale, preview })
  if (!page) return null

  const hero = page.sections.find((s) => s.type === 'page_hero')
  const body = page.sections.find((s) => s.type === 'rich_text')

  return {
    ...page,
    heading: text(hero, 'heading') || page.title,
    body: text(body, 'body'),
    image: typeof hero?.payload.image === 'string' ? hero.payload.image : null,
  }
}

/** Every published page address, for generateStaticParams and the sitemap. */
export async function getPageSlugs(): Promise<{ slug: string; is_home: boolean; url: string }[]> {
  'use cache'
  cacheLife('max')

  return apiGet('/pages', z.array(z.object({ slug: z.string(), is_home: z.boolean(), url: z.string() })))
}
