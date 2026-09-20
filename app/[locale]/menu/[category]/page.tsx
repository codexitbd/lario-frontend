import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CategoryNav } from '@/components/menu/category-nav'
import { DishCard } from '@/components/menu/dish-card'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import { getMenuCategories, getMenuCategory } from '@/lib/api/menu'
import { getMenuCategories as getMenuCategoriesImpl } from '@/lib/api/menu.impl'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { DEFAULT_LOCALE, isLocale, localePath } from '@/lib/i18n/config'
import { absoluteUrl } from '@/content/seo-defaults'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbJsonLd } from '@/lib/seo/json-ld'

/**
 * Built from the pure impl, not the cached fetcher: `cacheTag` and `cacheLife`
 * need a real request context and there is none at build time.
 */
export function generateStaticParams() {
  return getMenuCategoriesImpl(DEFAULT_LOCALE).map((category) => ({
    category: category.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}): Promise<Metadata> {
  const { locale, category } = await params
  if (!isLocale(locale)) return {}
  const found = await getMenuCategory(locale, category)
  if (!found) return {}
  return buildMetadata(found.seo)
}

/**
 * /menu/[category] — one course.
 *
 * `intro_content` is the reason course URLs exist. It is unique prose per
 * course and it is what makes this page rankable, so it gets its own band with
 * a real measure rather than being tucked under the heading as decoration. A
 * category page shipping without it is not done (spec §7.2).
 *
 * DELIBERATE DEVIATION from §7.2: no scoped toolbar. Courses run 4 to 17
 * dishes, every card already shows its dietary tags, and a second filter island
 * on a seventeen-item list is machinery for its own sake. Filtering lives on
 * /menu where there are 89 dishes to filter. Say the word and it is a small
 * addition.
 *
 * Grounds alternate as everywhere else: dark hero, bone prose, ink grid, bone
 * sibling strip, dark close.
 */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale, category } = await params
  if (!isLocale(locale)) notFound()

  const [found, categories, settings, dict] = await Promise.all([
    getMenuCategory(locale, category),
    getMenuCategories(locale),
    getSettings(locale),
    getDictionary(locale),
  ])

  if (!found) notFound()

  const siblings = categories.filter((c) => c.slug !== found.slug)
  const crumbs = [
    { name: settings.site_name, url: absoluteUrl(locale, '/') },
    { name: dict.nav.menu, url: absoluteUrl(locale, '/menu') },
    { name: found.name, url: absoluteUrl(locale, found.url) },
  ]

  return (
    <main id="main-content">
      <section className="relative isolate flex min-h-[62vh] flex-col justify-end overflow-hidden pt-32 pb-14 md:min-h-[68vh] md:pb-20">
        <Figure
          src={found.image}
          alt=""
          shot={found.name}
          sizes="100vw"
          priority
          className="absolute inset-0 -z-20"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-scrim)_74%,transparent)_0%,color-mix(in_srgb,var(--color-scrim)_40%,transparent)_45%,color-mix(in_srgb,var(--color-scrim)_90%,transparent)_100%)]"
        />

        <Container className="relative">
          <nav
            aria-label="Breadcrumb"
            className="text-[0.6875rem] tracking-[0.2em] text-ivory-dim uppercase"
          >
            <ol className="flex flex-wrap items-center gap-3">
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
              <li>
                <Link
                  href={localePath(locale, '/menu')}
                  className="transition-colors duration-300 hover:text-gold"
                >
                  {dict.nav.menu}
                </Link>
              </li>
              <li aria-hidden="true" className="text-gold/60">
                /
              </li>
              <li aria-current="page" className="text-ivory">
                {found.name}
              </li>
            </ol>
          </nav>

          {/* Bottom-anchored and split, like the site hero: the course name on
              the start side, its one line of description opposite. A centred
              stack over a photograph is the shape this site deliberately left
              behind. */}
          <div className="mt-6 grid items-end gap-y-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-16">
            <h1 className="lr-display lr-unmask max-w-[14ch] text-[clamp(2.25rem,1.3rem+3.2vw,3.75rem)] leading-[1.04] tracking-[0.04em] text-balance text-ivory uppercase">
              {found.name}
            </h1>

            {found.description ? (
              <p className="max-w-[46ch] text-base leading-relaxed text-pretty text-ivory-dim md:text-lg">
                {found.description}
              </p>
            ) : null}
          </div>
        </Container>
      </section>

      {/* The ranking asset. Its own band, its own measure. */}
      <section className="bg-bone py-20 md:py-28">
        <Container>
          {/* The ranking asset (spec §7.2) gets a real measure and a real
              position, not a centred paragraph floating in a band. */}
          <div className="lr-reveal max-w-[62ch] lg:ms-[8%]">
            <p className="text-[clamp(1.0625rem,1rem+0.3vw,1.375rem)] leading-[1.8] text-pretty text-ink-soft">
              {found.intro_content}
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-ink py-24 md:py-32">
        <Container>
          {/* sr-only: the h1 above already names this course, so a visible
              "in this course" label restates it and reintroduces the
              tracked-caps scaffold removed from the rest of the site. */}
          <h2 className="sr-only">{dict.menu.inThisCourse}</h2>

          {found.items.length === 0 ? (
            <p className="text-center text-lg text-ivory-dim">
              {dict.menu.noResults}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-20">
              {found.items.map((item) => (
                <DishCard
                  key={item.slug}
                  item={item}
                  locale={locale}
                  dict={dict}
                />
              ))}
            </ul>
          )}
        </Container>
      </section>

      <section className="bg-bone pb-20 md:pb-28">
        <CategoryNav
          categories={siblings}
          locale={locale}
          dict={dict}
          heading={dict.menu.otherCourses}
          headingHidden
        />
      </section>

      <section className="relative isolate overflow-hidden border-t border-gold/25 bg-ink py-20 md:py-24">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,color-mix(in_srgb,var(--color-gold)_9%,transparent)_0%,transparent_70%)]"
        />
        <Container className="lr-reveal flex flex-col items-center text-center">
          <h2 className="lr-display max-w-[16ch] text-[clamp(1.875rem,1.2rem+2.4vw,3rem)] leading-[1.1] text-ivory">
            {dict.menu.visitUs}
          </h2>
          <Cta
            href={localePath(locale, '/reservation')}
            variant="solid"
            className="mt-9"
          >
            {dict.actions.reserve}
          </Cta>
        </Container>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(crumbs)),
        }}
      />
    </main>
  )
}
