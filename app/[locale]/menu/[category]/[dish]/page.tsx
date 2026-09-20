import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DishCard } from '@/components/menu/dish-card'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import { getMenuItem } from '@/lib/api/menu'
import { getMenuItems as getMenuItemsImpl } from '@/lib/api/menu.impl'
import { getSettings } from '@/lib/api/settings'
import { getDictionary, interpolate } from '@/lib/i18n/dictionaries'
import { DEFAULT_LOCALE, isLocale, localePath } from '@/lib/i18n/config'
import { formatCalories, formatPrice } from '@/lib/format'
import { absoluteUrl } from '@/content/seo-defaults'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbJsonLd, menuItemJsonLd } from '@/lib/seo/json-ld'
import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * All 89, from the pure impl: `cacheTag` and `cacheLife` need a real request
 * context and there is none at build time.
 */
export function generateStaticParams() {
  return getMenuItemsImpl(DEFAULT_LOCALE).map((item) => ({
    category: item.category.slug,
    dish: item.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; dish: string }>
}): Promise<Metadata> {
  const { locale, dish } = await params
  if (!isLocale(locale)) return {}
  const item = await getMenuItem(locale, dish)
  if (!item) return {}
  return buildMetadata(item.seo)
}

/**
 * /menu/[category]/[dish] — one dish.
 *
 * Split hero: the plate on one side, everything a diner decides on the other.
 * `name_alt` prints the dish's name in the other script beneath the heading,
 * because half this menu is known in Riyadh by its Arabic or Turkish name.
 *
 * `ingredients_note` and `preparation_note` are null on all 89 dishes today
 * (content gap), and 35 of 89 carry no allergens. Every one of those blocks is
 * conditional, and the whole "about" band disappears rather than rendering an
 * empty frame. Do not substitute the long description into them.
 *
 * `MenuItem` + `BreadcrumbList` JSON-LD. The MenuItem builder gates `offers`
 * and `nutrition` behind MENU_DATA_IS_VERIFIED, which is false while prices are
 * placeholder — do not flip it here.
 */
function Detail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-[0.6875rem] tracking-[0.24em] text-gold-ink uppercase">
        {label}
      </dt>
      <dd className="mt-4 text-base leading-relaxed text-ink-soft">
        {children}
      </dd>
    </div>
  )
}

export default async function DishPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; dish: string }>
}) {
  const { locale, category, dish } = await params
  if (!isLocale(locale)) notFound()

  const [item, settings, dict] = await Promise.all([
    getMenuItem(locale, dish),
    getSettings(locale),
    getDictionary(locale),
  ])

  // A dish reached through the wrong course is a different URL for the same
  // content. 404 rather than serve it twice and split the ranking.
  if (!item || item.category.slug !== category) notFound()

  const allergenNames: Record<string, string> = dict.menu.allergenNames

  // PROSE ONLY. Allergens used to qualify a dish for this band, which meant a
  // 389px bone section with a display heading delivering four words: "About
  // this dish / Allergens / Dairy / Egg", in a two-column grid holding one
  // item. A ceremonial band has to be earned by something worth reading.
  // Allergens now sit beside the dietary tags in the hero, which is where a
  // reader who just saw "Vegetarian" actually wants them. Both notes are null
  // on all 89 dishes today (content gap 12), so this band correctly renders on
  // nothing until the client supplies copy.
  const hasAbout = Boolean(item.ingredients_note || item.preparation_note)

  const crumbs = [
    { name: settings.site_name, url: absoluteUrl(locale, '/') },
    { name: dict.nav.menu, url: absoluteUrl(locale, '/menu') },
    { name: item.category.name, url: absoluteUrl(locale, `/menu/${category}`) },
    { name: item.name, url: absoluteUrl(locale, item.url) },
  ]

  return (
    <main id="main-content">
      <section className="bg-ink pt-32 pb-20 md:pt-36 md:pb-28">
        <Container>
          <nav
            aria-label="Breadcrumb"
            className="text-[0.6875rem] tracking-[0.2em] text-ivory-dim uppercase"
          >
            <ol className="flex flex-wrap items-center gap-3">
              <li>
                <Link
                  href={localePath(locale, '/menu')}
                  className="transition-colors duration-300 hover:text-gold"
                >
                  {dict.menu.backToMenu}
                </Link>
              </li>
              <li aria-hidden="true" className="text-gold/60">
                /
              </li>
              <li>
                <Link
                  href={localePath(locale, `/menu/${category}`)}
                  className="transition-colors duration-300 hover:text-gold"
                >
                  {item.category.name}
                </Link>
              </li>
              <li aria-hidden="true" className="text-gold/60">
                /
              </li>
              <li aria-current="page" className="text-ivory">
                {item.name}
              </li>
            </ol>
          </nav>

          {/* NAMED AREAS, because the reading ORDER has to change with the
              breakpoint. Stacked, the square plate is taller than the viewport,
              so an image-then-text column put the dish's name, price and
              description entirely below the fold: a diner landing here from
              search could not see what the dish was or what it cost without
              scrolling. Identity now comes first on narrow screens and sits
              beside the plate on wide ones, with no duplicated heading. */}
          <div className="mt-12 grid items-start gap-x-20 gap-y-8 [grid-template-areas:'identity''plate''detail'] lg:grid-cols-[5fr_6fr] lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'plate_identity''plate_detail']">
            <div className="lr-focus relative [grid-area:plate]">
              <Figure
                src={item.image}
                alt={item.name}
                shot={item.name}
                sizes="(min-width: 1024px) 42vw, 100vw"
                priority
                className="relative aspect-square w-full"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-3 border border-ivory/20"
              />
            </div>

            <div className="lr-reveal [grid-area:identity]">
              <Link
                href={localePath(locale, `/menu/${category}`)}
                className="inline-flex min-h-6 items-center text-[0.6875rem] tracking-[0.24em] text-gold uppercase transition-colors duration-300 ease-brand hover:text-gold-pale"
              >
                {item.category.name}
              </Link>

              <h1 className="lr-display mt-5 text-[clamp(2rem,1.3rem+2.8vw,3.5rem)] leading-[1.1] text-ivory">
                {item.name}
              </h1>

              {/* The same dish, in the other script.
                  <bdi>, not dir on the paragraph: dir on a block makes its text
                  align to ITS OWN start edge, which threw the Arabic name to
                  the far side of the column. bdi isolates the run for the bidi
                  algorithm while the paragraph keeps the page's alignment, and
                  lang still tells a screen reader to switch voice. */}
              {item.name_alt ? (
                <p className="mt-3 text-xl text-ivory-dim">
                  <bdi
                    lang={locale === 'ar' ? 'en' : 'ar'}
                    dir={locale === 'ar' ? 'ltr' : 'rtl'}
                  >
                    {item.name_alt}
                  </bdi>
                </p>
              ) : null}

              <p className="mt-8 flex items-center gap-4">
                <span className="lr-display text-2xl text-gold">
                  {formatPrice(item.price, item.currency, locale)}
                </span>
                {item.calories !== null ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="block h-5 w-px bg-gold/25"
                    />
                    <span className="text-[0.75rem] tracking-[0.12em] text-ivory-dim uppercase">
                      {formatCalories(item.calories, locale)}{' '}
                      {dict.menu.calories}
                    </span>
                  </>
                ) : null}
              </p>

            </div>

            <div className="lr-reveal [grid-area:detail]">
              <p className="max-w-[54ch] text-base leading-[1.9] text-pretty text-ivory-dim md:text-lg">
                {item.description}
              </p>

              {item.dietary_tags.length > 0 ? (
                <ul className="mt-8 flex flex-wrap gap-2">
                  {item.dietary_tags.map((tag) => (
                    <li
                      key={tag}
                      className="border border-gold/30 px-3 py-1.5 text-[0.625rem] tracking-[0.16em] text-gold/90 uppercase"
                    >
                      {dict.menu.tags[
                        tag as keyof Dictionary['menu']['tags']
                      ] ?? tag}
                    </li>
                  ))}
                </ul>
              ) : null}

              {/* Allergens read as a caution, not a feature, so they are a
                  plain line rather than more pills: pill soup next to the
                  dietary tags would flatten the difference between "this dish
                  IS vegetarian" and "this dish CONTAINS dairy". */}
              {item.allergens.length > 0 ? (
                <p className="mt-5 text-sm text-ivory-dim/80">
                  <span className="text-ivory-dim/60">
                    {dict.menu.contains}:{' '}
                  </span>
                  {item.allergens
                    .map((a) => allergenNames[a] ?? a)
                    .join(', ')}
                </p>
              ) : null}

              {!item.is_available ? (
                <p className="mt-8 border border-gold/40 bg-gold/10 px-5 py-3 text-[0.75rem] tracking-[0.18em] text-gold-pale uppercase">
                  {dict.menu.unavailable}
                </p>
              ) : null}

              <Cta
                href={localePath(locale, '/reservation')}
                variant="solid"
                className="mt-10"
              >
                {dict.actions.reserve}
              </Cta>
            </div>
          </div>
        </Container>
      </section>

      {hasAbout ? (
        <section className="bg-bone py-20 md:py-28">
          <Container>
            <h2 className="lr-display text-center text-[clamp(1.75rem,1.2rem+1.8vw,2.5rem)] leading-[1.15] text-ink">
              {dict.menu.aboutThisDish}
            </h2>

            {/* auto-fit, so one note fills the measure instead of sitting in
                half a two-column grid with the other half empty. */}
            <dl className="mx-auto mt-14 grid max-w-4xl gap-12 [grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]">
              {item.ingredients_note ? (
                <Detail label={dict.menu.ingredients}>
                  {item.ingredients_note}
                </Detail>
              ) : null}

              {item.preparation_note ? (
                <Detail label={dict.menu.preparation}>
                  {item.preparation_note}
                </Detail>
              ) : null}
            </dl>
          </Container>
        </section>
      ) : null}

      {item.related.length > 0 ? (
        <section className="bg-ink py-24 md:py-32">
          <Container>
            {/* Names where these came from and links back, instead of a
                tracked-caps "you might also like" that says nothing. */}
            <h2 className="lr-display lr-unmask text-[clamp(1.5rem,1.2rem+0.9vw,2rem)] leading-tight text-ivory">
              {interpolate(dict.menu.moreFromCourse, {
                course: item.category.name,
              })}
            </h2>

            <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
              {item.related.map((related) => (
                <DishCard
                  key={related.slug}
                  item={related}
                  locale={locale}
                  dict={dict}
                />
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(menuItemJsonLd(item, locale)),
        }}
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
