import pagesFixture from '@/content/pages.json'
import { buildSeo } from '@/content/seo-defaults'
import { resolveTranslation } from '@/lib/api/resolve'
import type { Locale } from '@/lib/i18n/config'
import type { Page } from '@/lib/schemas'

export function getPage(locale: Locale, slug: string): Page | null {
  const page = pagesFixture.find((p) => p.slug === slug)
  if (!page) return null

  const t = resolveTranslation(page.translations, locale)
  const path = `/${page.slug}`

  return {
    slug: page.slug,
    title: t.title,
    heading: t.heading,
    body: t.body,
    template: page.template as Page['template'],
    seo: buildSeo({
      title: t.title,
      description: t.heading,
      path,
      locale,
    }),
  }
}
