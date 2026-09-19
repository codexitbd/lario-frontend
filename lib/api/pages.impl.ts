import pagesFixture from '@/content/pages.json'
import { buildSeo } from '@/content/seo-defaults'
import { resolveTranslation } from '@/lib/api/resolve'
import type { Locale } from '@/lib/i18n/config'
import type { Page } from '@/lib/schemas'

type PageTranslation = {
  title: string
  heading: string
  body: string
  /** Optional: falls back to `heading` when an editor has not written one. */
  description?: string
}

export function getPage(locale: Locale, slug: string): Page | null {
  const page = pagesFixture.find((p) => p.slug === slug)
  if (!page) return null

  // `description` is optional and only some rows carry it, so the fixture's
  // `translations` infers as a union of per-row shapes where the others have
  // `description?: undefined`. Widen to the common shape at the call site,
  // the same way branches.impl.ts handles its per-branch facility maps.
  const t = resolveTranslation(
    page.translations as Partial<Record<Locale, PageTranslation>>,
    locale,
  )
  const path = `/${page.slug}`

  return {
    slug: page.slug,
    title: t.title,
    heading: t.heading,
    body: t.body,
    template: page.template as Page['template'],
    seo: buildSeo({
      title: t.title,
      // A heading is written to sit above the page; a meta description is
      // written to be read in a result listing. Falling back to the heading
      // gave "Our Menu" as the description of the page this project is most
      // paid to get found — so an editor can now write a real one, and the
      // fallback stays for rows that have not been given one yet.
      description: t.description ?? t.heading,
      path,
      locale,
    }),
  }
}
