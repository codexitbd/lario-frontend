import type { Metadata } from 'next'
import { SectionList } from '@/components/sections/section-list'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowUpRightIcon,
  CarIcon,
  CheckIcon,
  DoorOpenIcon,
  TreeIcon,
  UsersThreeIcon,
  WheelchairIcon,
} from '@phosphor-icons/react/ssr'
import type { Icon } from '@phosphor-icons/react'
import { OpenNow } from '@/components/layout/open-now'
import { DishCard } from '@/components/menu/dish-card'
import { Faq } from '@/components/sections/faq'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import { SectionHeader } from '@/components/ui/section-header'
import { getBranch } from '@/lib/api/branches'
import { apiSlugs } from '@/lib/api/client'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, localePath } from '@/lib/i18n/config'
import { formatPhone } from '@/lib/format'
import { groupOpeningHours } from '@/lib/hours'
import { absoluteUrl } from '@/content/seo-defaults'
import { buildMetadata } from '@/lib/seo/metadata'
import {
  breadcrumbJsonLd,
  faqJsonLd,
  localBusinessJsonLd,
} from '@/lib/seo/json-ld'

/** Every visible branch is prerendered; one added later renders on first visit. */
export async function generateStaticParams() {
  const slugs = await apiSlugs('/branches')
  return (slugs.length > 0 ? slugs : ['__none__']).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const branch = await getBranch(locale, slug)
  if (!branch) return {}
  return buildMetadata(branch.seo)
}

/** The facility slugs the fixture uses, each with a glyph. Anything an editor
    adds later still renders, with a plain check. */
const FACILITY_ICONS: Record<string, Icon> = {
  valet: CarIcon,
  'outdoor-seating': TreeIcon,
  'family-section': UsersThreeIcon,
  'private-room': DoorOpenIcon,
  'wheelchair-access': WheelchairIcon,
}

const QUIET_DARK =
  'inline-flex min-h-6 items-center gap-2 border-b border-gold/40 pb-1 text-[0.8125rem] font-medium tracking-[0.16em] text-gold uppercase transition-colors duration-300 ease-brand hover:border-gold hover:text-gold-pale'
const QUIET_LIGHT =
  'inline-flex min-h-6 items-center gap-2 border-b border-gold-ink/40 pb-1 text-[0.8125rem] font-medium tracking-[0.16em] text-gold-ink uppercase transition-colors duration-300 ease-brand hover:border-gold-ink hover:text-ink'

/**
 * /branches/[slug] (spec §8.2). One room, as a destination page.
 *
 * 1. HERO. The room's photograph full-bleed, sinking on scroll (`.lr-room-media`
 *    in globals.css, scroll-driven CSS). Breadcrumb, the tagline as an italic
 *    kicker, the name, whether it is serving right now, and the two things a
 *    guest came for: reserve, and directions.
 * 2. THE STORY, on bone. The fixture's story set large on the start side, the
 *    second photograph of the room in the house arch on the end side.
 * 3. POPULAR CHOICES, on ink. Three dishes from `popular_dishes` in the menu's
 *    own cards, and a line to the full menu.
 * 4. INSIDE THE ROOM, only once `gallery[]` carries frames (D14). Both are
 *    empty today, so nothing renders and nothing claims a photograph that
 *    does not exist. The lightbox is a shared-layer gap, so the frames link
 *    to themselves for now.
 * 5. VISIT, on bone. Address and directions note on the start side; the week's
 *    hours set large and the facilities with glyphs on the end side.
 * 6. FAQ, the homepage accordion fed this room's own questions.
 *
 * NOT built, by client decision 2026-10-01: §8.2's closing reservation band
 * (the hero's Reserve button already preselects this room) and the /branches
 * index, which the header's Branches menu replaces. §8.2's long-form copy
 * block has no field in the contract beyond `story`, which the story section
 * already shows (content gap 5). The map is a link, not an embed, for the
 * reason /contact gives.
 */
export default async function BranchPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const [branch, settings, dict] = await Promise.all([
    getBranch(locale, slug),
    getSettings(locale),
    getDictionary(locale),
  ])
  if (!branch) notFound()

  const reserveHref = localePath(locale, `/reservation?branch=${branch.slug}`)
  const schedule = groupOpeningHours(
    branch.opening_hours,
    locale,
    dict.branch.closed,
  )
  // Two crumbs, not three: there is no /branches index to point at.
  const crumbs = [
    { name: settings.site_name, url: absoluteUrl(locale, '/') },
    { name: branch.name, url: absoluteUrl(locale, branch.url) },
  ]

  return (
    <main id="main-content">
      {/* 1. Hero */}
      <section className="relative isolate flex min-h-[82vh] flex-col justify-end overflow-hidden pt-32 pb-16 md:min-h-[88vh] md:pb-24">
        <Figure
          src={branch.hero_image}
          slot={`branch.${branch.slug}`}
          alt=""
          shot={`${branch.name}. The room in evening light.`}
          sizes="100vw"
          priority
          labelPosition="bottom"
          className="absolute inset-0 -z-20"
          imageClassName="lr-room-media"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-scrim)_64%,transparent)_0%,color-mix(in_srgb,var(--color-scrim)_28%,transparent)_40%,color-mix(in_srgb,var(--color-scrim)_90%,transparent)_100%)]"
        />

        <Container>
          <nav
            aria-label="Breadcrumb"
            className="lr-hero-in text-[0.6875rem] tracking-[0.2em] text-ivory-dim uppercase"
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
              <li aria-current="page" className="text-ivory">
                {branch.name}
              </li>
            </ol>
          </nav>

          {/* pb-1 and the loosened leading keep the italic's descenders off
              the name beneath. */}
          <p
            className="lr-display lr-hero-in mt-10 pb-1 text-xl leading-[1.15] text-gold italic md:text-2xl"
            style={{ '--d': 120 } as React.CSSProperties}
          >
            {branch.tagline}
          </p>
          <h1
            className="lr-display lr-hero-title mt-3 max-w-[14ch] text-[clamp(2.75rem,1.4rem+5vw,5.5rem)] leading-[1.02] text-ivory"
            style={{ '--d': 200 } as React.CSSProperties}
          >
            {branch.name}
          </h1>
          <div
            className="lr-hero-in mt-6 text-base"
            style={{ '--d': 360 } as React.CSSProperties}
          >
            <OpenNow branch={branch} locale={locale} dict={dict} />
          </div>

          <div
            className="lr-hero-in mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8"
            style={{ '--d': 460 } as React.CSSProperties}
          >
            <Cta href={reserveHref} variant="solid">
              {dict.actions.reserve}
            </Cta>
            {branch.google_maps_url ? (
              <a
                href={branch.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className={QUIET_DARK}
              >
                {dict.branch.getDirections}
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="size-3.5 rtl:-scale-x-100"
                />
              </a>
            ) : null}
          </div>
        </Container>
      </section>

      {/* 2. The story */}
      <section className="bg-bone py-20 md:py-28">
        <Container className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-20">
          <div className="lg:col-span-6">
            <SectionHeader
              heading={dict.branches.story}
              tone="light"
              align="start"
            />
            <p className="lr-display lr-reveal mt-8 max-w-[34ch] text-[clamp(1.375rem,1rem+1.2vw,1.875rem)] leading-[1.35] text-pretty text-ink">
              {branch.story}
            </p>
          </div>
          <div
            className="lr-focus relative lg:col-span-6"
            style={{ '--i': 1 } as React.CSSProperties}
          >
            <Figure
              src={null}
              slot={`branch.${branch.slug}.story`}
              alt=""
              shot={`${branch.name}. A second frame of the room: the entrance or the terrace.`}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="relative aspect-[4/5] w-full [border-radius:999px_999px_0_0]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-3 border border-gold-ink/30 [border-radius:999px_999px_0_0]"
            />
          </div>
        </Container>
      </section>

      {/* 3. Popular choices */}
      {branch.popular_dishes.length > 0 ? (
        <section className="bg-ink py-20 md:py-28">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
              <SectionHeader heading={dict.branch.popularDishes} align="start" />
              <Link
                href={localePath(locale, '/menu')}
                className={`${QUIET_DARK} lr-reveal`}
              >
                {dict.branches.viewFullMenu}
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="size-3.5 rtl:-scale-x-100"
                />
              </Link>
            </div>
            <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {branch.popular_dishes.map((item) => (
                <DishCard
                  key={item.slug}
                  item={item}
                  locale={locale}
                  dict={dict}
                />
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* 4. Inside the room (D14). Nothing renders while gallery[] is empty. */}
      {branch.gallery.length > 0 ? (
        <section className="bg-ink pb-20 md:pb-28">
          <Container>
            <SectionHeader heading={dict.branches.gallery} align="start" />
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branch.gallery.map((image, index) => (
                <li key={image} className={index % 5 === 0 ? 'sm:col-span-2' : ''}>
                  <a href={image} target="_blank" rel="noreferrer">
                    <Figure
                      src={image}
                      alt=""
                      shot={branch.name}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                      className="lr-plate relative aspect-[4/3] w-full"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* 5. Visit */}
      <section className="border-b border-ink/10 bg-bone py-20 md:py-28">
        <Container>
          <SectionHeader heading={dict.menu.visitUs} tone="light" align="start" />
          <div className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lr-reveal lg:col-span-5">
              <p className="text-[0.6875rem] tracking-[0.24em] text-gold-ink uppercase">
                {dict.branches.address}
              </p>
              <p className="lr-display mt-3 max-w-[22ch] text-2xl leading-[1.2] text-ink">
                {branch.address}
              </p>
              {branch.directions_note ? (
                <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-pretty text-ink-soft">
                  {branch.directions_note}
                </p>
              ) : null}
              {branch.google_maps_url ? (
                <a
                  href={branch.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className={`${QUIET_LIGHT} mt-6`}
                >
                  {dict.branch.getDirections}
                  <ArrowUpRightIcon
                    aria-hidden="true"
                    className="size-3.5 rtl:-scale-x-100"
                  />
                </a>
              ) : null}

              <ul className="mt-10 flex flex-col gap-2 text-base">
                <li>
                  <a
                    href={`tel:${branch.phone}`}
                    className="text-ink transition-colors duration-300 hover:text-gold-ink"
                  >
                    <bdi dir="ltr">{formatPhone(branch.phone)}</bdi>
                  </a>
                </li>
                {branch.whatsapp ? (
                  <li>
                    <a
                      href={`https://wa.me/${branch.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink-soft transition-colors duration-300 hover:text-gold-ink"
                    >
                      {dict.footer.whatsapp}
                    </a>
                  </li>
                ) : null}
                <li>
                  <a
                    href={`mailto:${branch.email}`}
                    className="text-ink-soft transition-colors duration-300 hover:text-gold-ink"
                  >
                    <bdi dir="ltr">{branch.email}</bdi>
                  </a>
                </li>
              </ul>
            </div>

            <div
              className="lr-reveal lg:col-span-7"
              style={{ '--i': 1 } as React.CSSProperties}
            >
              <p className="text-[0.6875rem] tracking-[0.24em] text-gold-ink uppercase">
                {dict.branch.openingHours}
              </p>
              <dl className="mt-3 flex flex-col divide-y divide-ink/10">
                {schedule.map((group) => (
                  <div
                    key={group.days}
                    className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 py-4"
                  >
                    <dt className="lr-display text-2xl text-ink">
                      {group.days}
                    </dt>
                    <dd className="text-base text-ink-soft tabular-nums">
                      {group.hours}
                    </dd>
                  </div>
                ))}
              </dl>

              {branch.facilities.length > 0 ? (
                <>
                  <p className="mt-12 text-[0.6875rem] tracking-[0.24em] text-gold-ink uppercase">
                    {dict.branch.facilities}
                  </p>
                  <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {branch.facilities.map((facility) => {
                      const Glyph = FACILITY_ICONS[facility.slug] ?? CheckIcon
                      return (
                        <li
                          key={facility.slug}
                          className="flex items-center gap-3 text-base text-ink"
                        >
                          <Glyph
                            aria-hidden="true"
                            weight="light"
                            className="size-5 shrink-0 text-gold-ink"
                          />
                          {facility.label}
                        </li>
                      )
                    })}
                  </ul>
                </>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      {/* 6. FAQ */}
      <Faq
        section={{
          content: {
            eyebrow: dict.branches.faqEyebrow,
            heading: dict.branches.faqHeading,
            subheading: dict.branches.faqBody,
            items: branch.faq,
          },
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(crumbs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd(branch)),
        }}
      />
      {branch.faq.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd(branch.faq)),
          }}
        />
      ) : null}
      <SectionList sections={branch.sections} locale={locale} dict={dict} settings={settings} />
    </main>
  )
}
