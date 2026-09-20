import Link from 'next/link'
import {
  InstagramLogoIcon,
  SnapchatLogoIcon,
  TiktokLogoIcon,
} from '@phosphor-icons/react/ssr'
import type { Icon } from '@phosphor-icons/react'
import { NewsletterForm } from '@/components/layout/newsletter-form'
import { OpenNow } from '@/components/layout/open-now'
import { Wordmark } from '@/components/layout/wordmark'
import { Container } from '@/components/ui/container'
import { LEGAL_NAV, PRIMARY_NAV } from '@/lib/nav'
import { formatPhone } from '@/lib/format'
import { groupOpeningHours } from '@/lib/hours'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Branch, Settings } from '@/lib/schemas'

/**
 * The site footer. NO CONTAINERS: not one box, tile, panel or card.
 *
 * Earlier passes were built from design/references/shared/footer.png, a
 * lab-automation SaaS footer whose entire vocabulary is boxes. Copying its
 * composition faithfully produced ten of them here, and boxed single words are
 * what made it read as a product footer rather than a restaurant's. That
 * reference is retired for this component; do not reintroduce tiles.
 *
 * The composition is an ASYMMETRIC TOP BAND: the invitation on the start side,
 * the two rooms stacked on the end side, split 5fr/6fr so neither reads as a
 * column in a three-up grid. Beneath it a quiet wayfinding line, then fine
 * print. Three bands, each a different shape.
 *
 * WHAT MAKES IT INFORMATIVE rather than a sitemap: each room reports whether it
 * is serving RIGHT NOW (components/layout/open-now.tsx), which is the one thing
 * a person reading a restaurant footer at 11pm actually wants. That is also the
 * only justified coloured status dot on the site, because it reports real state
 * that changes rather than decorating a list.
 *
 * NO RESERVE BUTTON. The section immediately above the footer is the
 * reservation CTA, so a second large action inches below it was duplicate
 * intent. The per-branch phone numbers are the footer's booking path.
 *
 * NO "COMING SOON" LIST. Announcing six unbuilt pages at the bottom of every
 * page made the site read as unfinished. Spec §3 wants the Phase-4 items
 * rendered disabled where the prototype nav had them, which is the header; the
 * mobile drawer still does that, so §3 still holds.
 *
 * NO YEAR in the copyright. Pages are statically prerendered and revalidated by
 * content webhook rather than on a schedule, so `new Date()` would bake the
 * build year and then be quietly wrong.
 */
const SOCIAL_ICONS: Record<keyof Settings['social'], Icon> = {
  instagram: InstagramLogoIcon,
  tiktok: TiktokLogoIcon,
  snapchat: SnapchatLogoIcon,
}

const QUIET_LINK =
  'inline-flex min-h-6 items-center transition-colors duration-300 ease-brand hover:text-gold'

export function SiteFooter({
  branches,
  settings,
  locale,
  dict,
}: {
  branches: Branch[]
  settings: Settings
  locale: Locale
  dict: Dictionary
}) {
  return (
    <footer className="border-t border-gold/20 bg-ink text-ivory">
      <Container>
        {/* items-center, not the default start: the invitation is a third the
            height of the two rooms beside it, and top-aligning left a void
            under it that read as a missing block rather than as space. */}
        <div className="grid gap-16 py-16 lg:grid-cols-[5fr_6fr] lg:items-center lg:gap-24 lg:py-20">
          {/* The invitation. */}
          <section aria-labelledby="lr-newsletter">
            <h2
              id="lr-newsletter"
              className="lr-display text-[clamp(1.5rem,1.2rem+0.9vw,2rem)] leading-tight text-ivory"
            >
              {dict.footer.newsletterTitle}
            </h2>
            <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-pretty text-ivory-dim">
              {dict.footer.newsletterBody}
            </p>
            <NewsletterForm locale={locale} dict={dict} />
          </section>

          {/* The two rooms, stacked and divided by one hairline that separates
              real content rather than decorating. */}
          <ul className="flex flex-col">
            {branches.map((branch, index) => (
              <li
                key={branch.slug}
                className={
                  index > 0 ? 'mt-10 border-t border-ivory/10 pt-10' : undefined
                }
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <Link
                    href={localePath(locale, branch.url)}
                    className="lr-display text-xl leading-tight text-ivory transition-colors duration-300 ease-brand hover:text-gold"
                  >
                    {branch.name}
                  </Link>
                  <OpenNow branch={branch} locale={locale} dict={dict} />
                </div>

                <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-pretty text-ivory-dim">
                  {branch.address}
                </p>

                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
                  {groupOpeningHours(
                    branch.opening_hours,
                    locale,
                    dict.branch.closed,
                  ).map((group) => (
                    <div key={group.days} className="contents">
                      <dt className="text-ivory-dim/60">{group.days}</dt>
                      <dd className="text-ivory-dim">{group.hours}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm">
                  <a
                    href={`tel:${branch.phone}`}
                    className={`${QUIET_LINK} text-gold hover:text-gold-pale`}
                  >
                    <bdi dir="ltr">{formatPhone(branch.phone)}</bdi>
                  </a>
                  {branch.google_maps_url ? (
                    <a
                      href={branch.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className={`${QUIET_LINK} text-ivory-dim`}
                    >
                      {dict.branch.getDirections}
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* The brand, and the way around the site. */}
      <div className="border-t border-ivory/10">
        <Container className="flex flex-col gap-8 py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <Wordmark
            locale={locale}
            siteName={settings.site_name}
            className="h-12 shrink-0"
          />

          <nav aria-label={dict.footer.explore}>
            <ul className="flex flex-wrap items-center gap-x-9 gap-y-3">
              {PRIMARY_NAV.map((item) => (
                <li key={item.key}>
                  <Link
                    href={localePath(locale, item.href)}
                    className={`${QUIET_LINK} text-[0.8125rem] tracking-[0.1em] text-ivory-dim uppercase`}
                  >
                    {dict.nav[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-x-8 text-sm">
            <a
              href={`mailto:${settings.contact.email}`}
              className={`${QUIET_LINK} text-ivory-dim`}
            >
              <bdi dir="ltr">{settings.contact.email}</bdi>
            </a>
            <a
              href={`https://wa.me/${settings.contact.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className={`${QUIET_LINK} text-ivory-dim`}
            >
              {dict.footer.whatsapp}
            </a>
          </div>
        </Container>
      </div>

      {/* Fine print. Social glyphs are bare, not tiles: the padding gives them a
          target without drawing a box around a logo. */}
      <div className="border-t border-ivory/10">
        <Container className="flex flex-col-reverse items-center gap-5 py-6 md:flex-row md:justify-between">
          <p className="text-center text-[0.6875rem] tracking-[0.14em] text-ivory-dim/60 uppercase">
            &copy; {settings.site_name}. {dict.footer.rights}
          </p>

          <div className="flex items-center gap-x-7">
            <ul
              aria-label={dict.footer.followUs}
              className="flex items-center gap-x-4"
            >
              {(Object.keys(SOCIAL_ICONS) as (keyof Settings['social'])[]).map(
                (network) => {
                  const SocialIcon = SOCIAL_ICONS[network]
                  return (
                    <li key={network}>
                      <a
                        href={settings.social[network]}
                        target="_blank"
                        rel="noreferrer"
                        className="flex size-8 items-center justify-center text-ivory-dim transition-colors duration-300 ease-brand hover:text-gold"
                      >
                        <span className="sr-only">{network}</span>
                        <SocialIcon aria-hidden="true" className="size-5" />
                      </a>
                    </li>
                  )
                },
              )}
            </ul>

            <ul className="flex items-center gap-x-6">
              {LEGAL_NAV.map((item) => (
                <li key={item.key}>
                  <Link
                    href={localePath(locale, item.href)}
                    className={`${QUIET_LINK} text-[0.6875rem] tracking-[0.14em] text-ivory-dim/70 uppercase`}
                  >
                    {dict.footer[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>
    </footer>
  )
}
