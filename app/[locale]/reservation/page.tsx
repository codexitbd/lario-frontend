import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ReservationBook } from '@/components/reservation/reservation-book'
import { Container } from '@/components/ui/container'
import { getBranches } from '@/lib/api/branches'
import { getPage } from '@/lib/api/pages'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, localePath } from '@/lib/i18n/config'
import { absoluteUrl } from '@/content/seo-defaults'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbJsonLd, restaurantJsonLd } from '@/lib/seo/json-ld'

const PAGE_SLUG = 'reservation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const page = await getPage(locale, PAGE_SLUG)
  if (!page) return {}
  return buildMetadata(page.seo)
}

/**
 * /reservation. A scrolling book: opening band here, then the four chapters
 * and the progress rail in the island. Design:
 * docs/superpowers/specs/2026-10-01-reservation-page-design.md.
 *
 * Statically prerendered. The island reads `?branch=` with useSearchParams,
 * which is why it sits in Suspense: the server renders the fallback and the
 * route never goes dynamic. Spec §4.1's "NOT cached" is satisfied the same
 * way /contact and the footer newsletter satisfy it.
 *
 * JSON-LD is Restaurant + ReserveAction, never a Reservation entity (spec
 * 2026-10-01 R4).
 */
export default async function ReservationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [page, branches, settings, dict] = await Promise.all([
    getPage(locale, PAGE_SLUG),
    getBranches(locale),
    getSettings(locale),
    getDictionary(locale),
  ])
  if (!page) notFound()

  const crumbs = [
    { name: settings.site_name, url: absoluteUrl(locale, '/') },
    { name: page.heading, url: absoluteUrl(locale, '/reservation') },
  ]

  return (
    <main id="main-content" className="bg-ink text-ivory">
      {/* Opening band. Short on purpose: the book is the page. */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <Container>
          <nav
            aria-label="Breadcrumb"
            className="text-[0.6875rem] tracking-[0.2em] text-ivory-dim uppercase"
          >
            <ol className="flex items-center gap-3">
              <li>
                <Link
                  href={localePath(locale, '/')}
                  className="transition-colors duration-300 hover:text-gold"
                >
                  {settings.site_name}
                </Link>
              </li>
              <li aria-hidden="true" className="text-gold/60">
                /
              </li>
              <li aria-current="page" className="text-ivory">
                {page.heading}
              </li>
            </ol>
          </nav>
          <h1 className="lr-display lr-unmask mt-6 text-[clamp(2.5rem,1.4rem+4.4vw,4.75rem)] leading-[1.05] tracking-[0.06em] uppercase">
            {page.heading}
          </h1>
          {/* Sanitised HTML from the CMS, as every page body is. */}
          <div
            className="lr-reveal mt-6 max-w-[44ch] text-base leading-relaxed text-pretty text-ivory-dim md:text-lg [&_p]:mt-3 [&_p:first-child]:mt-0"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        </Container>
      </section>

      {/* The fallback holds the book's rough height so the footer does not
          jump up on the server render. */}
      <Suspense fallback={<div aria-hidden="true" className="min-h-[60vh]" />}>
        <ReservationBook branches={branches} locale={locale} dict={dict} />
      </Suspense>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(crumbs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            restaurantJsonLd({
              name: settings.site_name,
              description: page.seo.description,
              url: absoluteUrl(locale, '/'),
              image: page.seo.og.image,
              branches,
              reserveUrl: page.seo.canonical,
            }),
          ),
        }}
      />
    </main>
  )
}
