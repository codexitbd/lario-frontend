import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SectionList } from '@/components/sections/section-list'
import { apiGet } from '@/lib/api/client'
import { getPage } from '@/lib/api/pages'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale } from '@/lib/i18n/config'
import { previewToken } from '@/lib/preview'
import { absoluteUrl } from '@/content/seo-defaults'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { z } from 'zod'

/**
 * Any page the admin builds (Pages → New page) lives here, at /{slug}.
 * /menu, /contact and /reservation keep their purpose-built routes; the
 * homepage is app/[locale]/page.tsx.
 */
const OWN_ROUTES = new Set(['menu', 'contact', 'reservation'])

type Params = Promise<{ locale: string; slug: string[] }>

export async function generateStaticParams() {
  const pages = await apiGet('/pages', z.array(z.object({ slug: z.string(), is_home: z.boolean() })), { untagged: true }).catch(() => [])
  const slugs = pages.filter((p) => !p.is_home && !OWN_ROUTES.has(p.slug)).map((p) => ({ slug: [p.slug] }))
  return slugs.length > 0 ? slugs : [{ slug: ['__none__'] }]
}

async function load(locale: string, segments: string[]) {
  if (!isLocale(locale) || segments.length !== 1 || OWN_ROUTES.has(segments[0])) return null
  return getPage(locale, segments[0], await previewToken())
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const page = await load(locale, slug)
  return page ? buildMetadata(page.seo) : {}
}

export default async function CmsPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  const page = await load(locale, slug)
  if (!page || !isLocale(locale) || page.is_home) notFound()

  const [settings, dict] = await Promise.all([getSettings(locale), getDictionary(locale)])
  const opensWithHeading = ['page_hero', 'hero'].includes(page.sections[0]?.type ?? '')

  return (
    <main id="main-content">
      {/* Every page keeps exactly one h1, even when the admin starts it with another component. */}
      {opensWithHeading ? null : <h1 className="sr-only">{page.title}</h1>}
      <SectionList sections={page.sections} locale={locale} dict={dict} settings={settings} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: settings.site_name, url: absoluteUrl(locale, '/') },
            { name: page.title, url: page.seo.canonical },
          ])),
        }}
      />
    </main>
  )
}
