import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { renderSection } from '@/components/sections'
import { faqItemSchema, readList } from '@/components/sections/content'
import { getBranches } from '@/lib/api/branches'
import { getHome } from '@/lib/api/home'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale } from '@/lib/i18n/config'
import { buildMetadata } from '@/lib/seo/metadata'
import { faqJsonLd, restaurantJsonLd } from '@/lib/seo/json-ld'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const home = await getHome(locale)
  // Verbatim from the API's seo object. No client-side fallback logic — the
  // server already applied the fallback chain.
  return buildMetadata(home.seo)
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [home, branches, settings, dict] = await Promise.all([
    getHome(locale),
    // Fetched rather than lifted out of the branch_cards section, so the
    // closing CTA's branch links do not break if an editor removes that
    // section — and so the branch cache tags are carried by the fetcher that
    // owns them.
    getBranches(locale),
    getSettings(locale),
    getDictionary(locale),
  ])

  const faqItems = home.sections
    .filter((section) => section.type === 'faq')
    .flatMap((section) => readList(section.content, 'items', faqItemSchema))

  return (
    <main id="main-content">
      {home.sections.map((section) => (
        <div key={`${section.type}-${section.sort_order}`}>
          {renderSection(section, { locale, dict, branches })}
        </div>
      ))}

      <script
        type="application/ld+json"
        // Phase 1 JSON-LD: Restaurant on the page, FAQPage from section 9.
        // Nothing is emitted for testimonials — see lib/seo/json-ld.ts.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            restaurantJsonLd({
              name: settings.site_name,
              description: home.seo.description,
              url: home.seo.canonical,
              image: home.seo.og.image,
              branches,
            }),
          ),
        }}
      />
      {faqItems.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd(faqItems)),
          }}
        />
      ) : null}
    </main>
  )
}
