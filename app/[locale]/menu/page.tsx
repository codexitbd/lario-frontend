import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CategoryNav } from '@/components/menu/category-nav'
import { MenuBrowser } from '@/components/menu/menu-browser'
import { VisitBlock } from '@/components/menu/visit-block'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { getBranches } from '@/lib/api/branches'
import { getMenuCategories, getMenuItems } from '@/lib/api/menu'
import { getPage } from '@/lib/api/pages'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, localePath } from '@/lib/i18n/config'
import { absoluteUrl } from '@/content/seo-defaults'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbJsonLd } from '@/lib/seo/json-ld'

const PAGE_SLUG = 'menu'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const page = await getPage(locale, PAGE_SLUG)
  if (!page) return {}
  // Verbatim from the API's seo object, like every other page.
  return buildMetadata(page.seo)
}

/**
 * /menu — the whole card, filterable in place.
 *
 * Statically rendered with every dish in the HTML. The search and filter
 * controls are a client island (components/menu/menu-browser.tsx) so the route
 * never reads searchParams and never goes dynamic; see that file for why.
 *
 * Course links navigate to /menu/[category] rather than filtering here (D10).
 * Those pages do not exist yet, so the links currently 404 — they are the next
 * route to build, and the alternative (not linking at all) would cost the
 * internal linking the whole course taxonomy exists for.
 *
 * No Menu or ItemList JSON-LD: MENU_DATA_IS_VERIFIED is false because every
 * price on this page is invented placeholder data, and menu markup is a
 * machine-readable price assertion. BreadcrumbList carries no commercial claim,
 * so it ships.
 */
export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [page, items, categories, branches, settings, dict] = await Promise.all([
    getPage(locale, PAGE_SLUG),
    getMenuItems(locale),
    getMenuCategories(locale),
    getBranches(locale),
    getSettings(locale),
    getDictionary(locale),
  ])

  if (!page) notFound()

  const crumbs = [
    { name: settings.site_name, url: absoluteUrl(locale, '/') },
    { name: page.heading, url: absoluteUrl(locale, '/menu') },
  ]

  return (
    <main id="main-content">
      {/* Hero band. Shorter than the homepage's full-viewport opening on
          purpose: someone who reached /menu came to read the card, and a
          second 100dvh curtain in front of it is a toll, not a welcome. */}
      <section className="relative isolate flex min-h-[58vh] flex-col justify-end overflow-hidden pt-32 pb-16 md:min-h-[64vh] md:pb-20">
        <Figure
          src={null}
          slot="menu.hero"
          alt=""
          shot="Wide appetite shot. One dish, close, in service light."
          sizes="100vw"
          priority
          labelPosition="bottom"
          className="absolute inset-0 -z-20"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-scrim)_72%,transparent)_0%,color-mix(in_srgb,var(--color-scrim)_34%,transparent)_45%,color-mix(in_srgb,var(--color-scrim)_88%,transparent)_100%)]"
        />

        <Container className="relative flex flex-col items-center text-center">
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

          <h1 className="lr-display mt-6 text-[clamp(2.5rem,1.4rem+4.4vw,4.75rem)] leading-[1.05] tracking-[0.06em] text-ivory uppercase">
            {page.heading}
          </h1>
        </Container>
      </section>

      {/* Bone band: intro copy, the course list and the filter control. It ends
          inside MenuBrowser, which carries the same ground through its toolbar
          before switching to ink for the grid. Dark hero, light browse, dark
          food — the page needs the light band to breathe between the hero and
          89 photographs. */}
      <div className="bg-bone pt-16 md:pt-20">
        <Container>
          {/* The fixture's body copy is sanitised HTML from the CMS. */}
          <div
            className="mx-auto max-w-[62ch] text-center text-base leading-relaxed text-ink-soft md:text-lg [&_p]:mt-4 [&_p:first-child]:mt-0"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        </Container>

        <CategoryNav categories={categories} locale={locale} dict={dict} />
      </div>

      <MenuBrowser
        items={items}
        categories={categories}
        locale={locale}
        dict={dict}
      />

      {/* Full-bleed break, as the reference sets between the card and the
          closing block. Decorative: it carries no information the page needs. */}
      <Figure
        src={null}
        slot="menu.band"
        alt=""
        shot="Cinematic wide. The kitchen mid-service."
        sizes="100vw"
        className="relative h-[38vh] w-full md:h-[46vh]"
      />

      <VisitBlock
        branches={branches}
        settings={settings}
        locale={locale}
        dict={dict}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(crumbs)),
        }}
      />
    </main>
  )
}
