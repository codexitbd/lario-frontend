import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowUpRightIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  WhatsappLogoIcon,
} from '@phosphor-icons/react/ssr'
import type { Icon } from '@phosphor-icons/react'
import { ContactForm } from '@/components/contact/contact-form'
import { OpenNow } from '@/components/layout/open-now'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { SectionHeader } from '@/components/ui/section-header'
import { getBranches } from '@/lib/api/branches'
import { getPage } from '@/lib/api/pages'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { formatPhone } from '@/lib/format'
import { groupOpeningHours } from '@/lib/hours'
import { absoluteUrl } from '@/content/seo-defaults'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbJsonLd } from '@/lib/seo/json-ld'
import type { Branch } from '@/lib/schemas'

const PAGE_SLUG = 'contact'

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
 * /contact. Three bands, three layouts, built 2026-10-01.
 *
 * 1. THE SWITCHBOARD. A dark hero with the page heading on the start side and
 *    the three direct channels (call, WhatsApp, email) as large ruled rows on
 *    the end side. Someone who opens a restaurant's contact page wants a
 *    number to tap, so the numbers are the hero, not a form.
 * 2. THE ROOMS. A bone band with both branches side by side: photograph,
 *    name, whether it is serving right now, address and directions, the
 *    week's hours, facilities and the room's own phone, WhatsApp and email.
 *    Every line is fixture data; nothing here is decorative copy.
 * 3. THE LETTER. A dark band with the message form beside a sticky
 *    introduction, and one line sending table bookings to /reservation so the
 *    form does not become a second, slower booking path.
 *
 * Statically prerendered like every other page. Spec §4.1 marks this route
 * "NOT cached" because it carries a form, but the form is a client island
 * posting to /api/contacts, exactly like the newsletter in the footer of every
 * cached page; the page itself reads only cached fetchers.
 */
export default async function ContactPage({
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
    { name: page.heading, url: absoluteUrl(locale, '/contact') },
  ]

  const channels: {
    key: string
    label: string
    value: string
    href: string
    icon: Icon
    external?: boolean
  }[] = [
    {
      key: 'call',
      label: dict.footer.callUs,
      value: formatPhone(settings.contact.phone),
      href: `tel:${settings.contact.phone}`,
      icon: PhoneIcon,
    },
    {
      key: 'whatsapp',
      label: dict.footer.whatsapp,
      value: formatPhone(settings.contact.whatsapp),
      href: `https://wa.me/${(settings.contact.whatsapp ?? '').replace(/\D/g, '')}`,
      icon: WhatsappLogoIcon,
      external: true,
    },
    {
      key: 'email',
      label: dict.footer.emailUs,
      value: settings.contact.email ?? '',
      href: `mailto:${settings.contact.email}`,
      icon: EnvelopeSimpleIcon,
    },
  ].filter((channel) => channel.value)

  return (
    <main id="main-content">
      <section className="relative isolate flex min-h-[72vh] flex-col justify-end overflow-hidden pt-32 pb-16 md:pb-24">
        <Figure
          src={null}
          slot="contact.hero"
          alt=""
          shot="The entrance at dusk, lights on, doors open."
          sizes="100vw"
          priority
          labelPosition="bottom"
          className="absolute inset-0 -z-20"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-scrim)_70%,transparent)_0%,color-mix(in_srgb,var(--color-scrim)_40%,transparent)_40%,color-mix(in_srgb,var(--color-scrim)_92%,transparent)_100%)]"
        />

        <Container className="grid gap-12 lg:grid-cols-[7fr_5fr] lg:items-end lg:gap-20">
          <div>
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

            <h1 className="lr-display lr-unmask mt-6 text-[clamp(2.5rem,1.4rem+4.4vw,4.75rem)] leading-[1.05] tracking-[0.06em] text-ivory uppercase">
              {page.heading}
            </h1>

            {/* The fixture's body copy is sanitised HTML from the CMS. */}
            <div
              className="lr-reveal mt-6 max-w-[44ch] text-base leading-relaxed text-pretty text-ivory-dim md:text-lg"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          </div>

          {/* The channels. Each row is one tap target the height of the row,
              with a gold rule that draws in from the start edge on hover. */}
          <ul
            className="lr-reveal border-t border-ivory/20"
            style={{ '--i': 1 } as React.CSSProperties}
          >
            {channels.map((channel) => (
              <li key={channel.key} className="border-b border-ivory/20">
                <a
                  href={channel.href}
                  target={channel.external ? '_blank' : undefined}
                  rel={channel.external ? 'noreferrer' : undefined}
                  className="group relative flex items-center gap-5 py-5 transition-colors duration-300 ease-brand hover:text-gold-pale"
                >
                  <channel.icon
                    aria-hidden="true"
                    weight="light"
                    className="size-6 shrink-0 text-gold"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[0.8125rem] text-ivory-dim">
                      {channel.label}
                    </span>
                    <bdi
                      dir="ltr"
                      className="lr-display mt-1 truncate text-xl text-ivory transition-colors duration-300 ease-brand group-hover:text-gold-pale md:text-2xl"
                    >
                      {channel.value}
                    </bdi>
                  </span>
                  <ArrowUpRightIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-gold/60 transition-[transform,color] duration-300 ease-brand group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-gold transition-transform duration-500 ease-brand group-hover:scale-x-100 rtl:origin-right"
                  />
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-bone py-20 md:py-28">
        <Container>
          <SectionHeader
            heading={dict.contact.findUs}
            subheading={dict.contact.findUsBody}
            tone="light"
            align="start"
          />

          {/* Two rooms, one hairline between them. Stacked on a phone with the
              hairline turned horizontal. */}
          <div className="mt-14 grid md:mt-20 md:grid-cols-2">
            {branches.map((branch, index) => (
              <Room
                key={branch.slug}
                branch={branch}
                locale={locale}
                dict={dict}
                className={
                  index > 0
                    ? 'mt-16 border-t border-gold-ink/20 pt-16 md:mt-0 md:border-t-0 md:border-s md:border-s-gold-ink/20 md:ps-12 md:pt-0 lg:ps-20'
                    : 'md:pe-12 lg:pe-20'
                }
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink py-20 md:py-28">
        <Container className="grid gap-14 lg:grid-cols-[5fr_7fr] lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <h2 className="lr-display lr-unmask text-[clamp(2rem,1.3rem+2.4vw,3.25rem)] leading-[1.1] text-ivory">
              {dict.contact.writeHeading}
            </h2>
            <p className="lr-reveal mt-5 max-w-[40ch] text-base leading-relaxed text-pretty text-ivory-dim">
              {dict.contact.writeBody}
            </p>
            <p
              className="lr-reveal mt-10 text-sm text-ivory-dim"
              style={{ '--i': 1 } as React.CSSProperties}
            >
              {dict.contact.forTable}
              <Link
                href={localePath(locale, '/reservation')}
                className="ms-3 inline-flex min-h-6 items-center border-b border-gold/40 pb-0.5 text-gold transition-colors duration-300 ease-brand hover:border-gold hover:text-gold-pale"
              >
                {dict.actions.reserve}
              </Link>
            </p>
          </div>

          <ContactForm branches={branches} locale={locale} dict={dict} />
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

const QUIET =
  'inline-flex min-h-6 items-center border-b border-gold-ink/40 pb-0.5 text-gold-ink transition-colors duration-300 ease-brand hover:border-gold-ink hover:text-ink'

function Room({
  branch,
  locale,
  dict,
  className = '',
}: {
  branch: Branch
  locale: Locale
  dict: Dictionary
  className?: string
}) {
  const schedule = groupOpeningHours(
    branch.opening_hours,
    locale,
    dict.branch.closed,
  )

  return (
    <article className={className}>
      {/* The arch, the site's one photographic mask, with the house inset
          frame. Reuses the branch frame the homepage panels show on hover. */}
      <div className="lr-focus relative">
        <Figure
          src={branch.hero_image}
          slot={`branch.${branch.slug}`}
          alt=""
          shot={`${branch.name}. Entrance or exterior.`}
          sizes="(min-width: 768px) 45vw, 100vw"
          className="relative aspect-[5/4] w-full [border-radius:999px_999px_0_0]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 border border-gold-ink/30 [border-radius:999px_999px_0_0]"
        />
      </div>

      {/* pb-1 and the loosened leading keep the italic's descenders clear of
          the name beneath. */}
      <p className="lr-display mt-8 pb-1 text-lg leading-[1.15] text-gold-ink italic">
        {branch.tagline}
      </p>
      <h3 className="lr-display text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] leading-[1.1] text-ink">
        <Link
          href={localePath(locale, branch.url)}
          className="transition-colors duration-300 ease-brand hover:text-gold-ink"
        >
          {branch.name}
        </Link>
      </h3>
      <div className="mt-3">
        <OpenNow branch={branch} locale={locale} dict={dict} tone="light" />
      </div>

      <p className="mt-5 max-w-[40ch] text-base leading-relaxed text-pretty text-ink">
        {branch.address}
      </p>
      {branch.directions_note ? (
        <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-pretty text-ink-soft">
          {branch.directions_note}
        </p>
      ) : null}
      {branch.google_maps_url ? (
        <a
          href={branch.google_maps_url}
          target="_blank"
          rel="noreferrer"
          className={`${QUIET} mt-4 gap-2 text-[0.75rem] tracking-[0.16em] uppercase`}
        >
          {dict.branch.getDirections}
          <ArrowUpRightIcon
            aria-hidden="true"
            className="size-3.5 rtl:-scale-x-100"
          />
        </a>
      ) : null}

      <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-t border-gold-ink/20 pt-6 text-sm">
        {schedule.map((group) => (
          <div key={group.days} className="contents">
            <dt className="text-ink">{group.days}</dt>
            <dd className="text-ink-soft">{group.hours}</dd>
          </div>
        ))}
      </dl>

      {branch.facilities.length > 0 ? (
        <p className="mt-5 text-sm leading-relaxed text-ink-soft">
          {branch.facilities.map((facility) => facility.label).join(', ')}
        </p>
      ) : null}

      <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-2 text-sm">
        <li>
          <a href={`tel:${branch.phone}`} className={QUIET}>
            <bdi dir="ltr">{formatPhone(branch.phone)}</bdi>
          </a>
        </li>
        {branch.whatsapp ? (
          <li>
            <a
              href={`https://wa.me/${branch.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className={QUIET}
            >
              {dict.footer.whatsapp}
            </a>
          </li>
        ) : null}
        <li>
          <a href={`mailto:${branch.email}`} className={QUIET}>
            <bdi dir="ltr">{branch.email}</bdi>
          </a>
        </li>
      </ul>
    </article>
  )
}
