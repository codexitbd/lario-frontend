import Link from 'next/link'
import {
  EnvelopeSimpleIcon,
  MapPinIcon,
  PhoneIcon,
} from '@phosphor-icons/react/ssr'
import { LocaleSwitch } from '@/components/layout/locale-switch'
import { SiteNav } from '@/components/layout/site-nav'
import { Wordmark } from '@/components/layout/wordmark'
import { Container } from '@/components/ui/container'
import { formatPhone } from '@/lib/format'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Branch, Settings } from '@/lib/schemas'

/**
 * The site header, from design/references/shared/header-mobile.png (which is
 * the DESKTOP drawing, despite the filename) and header.png (the condensed
 * state).
 *
 * Two decks, as the reference draws them: a hairline utility strip carrying
 * where-we-are and how-to-reach-us, and the main bar with the wordmark, the
 * nav and the reserve button.
 *
 * FIXED, not sticky. Every page in this site opens on a dark band and already
 * reserves `pt-32` for chrome, so the header overlays rather than displacing —
 * which is what lets it sit transparent over the hero film the way the
 * reference shows. `position: sticky` would push all of that down and reserve
 * the space twice.
 *
 * It takes its ground ON SCROLL, and that transition is a native
 * scroll-progress timeline in globals.css (`.lr-chrome-*`) — no scroll
 * listener, no client component, nothing added to the 95+ mobile budget. The
 * utility strip collapses in the same range, which is the "condenses on scroll"
 * of spec §10. Read the CSS before changing this: the SOLID state is the base
 * and the transparent one is the enhancement, so a browser without
 * animation-timeline (or a reader on reduced motion) gets a header that is
 * always legible instead of one that is never visible.
 */
export function SiteHeader({
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
  const reserveHref = localePath(locale, '/reservation')

  return (
    <header className="fixed inset-x-0 top-0 z-50 text-ivory">
      {/* The ground, as its own layer: opacity is cheap to animate and does not
          interpolate a colour through muddy intermediate values the way
          transparent -> ink would. `-z-10` needs the header's own stacking
          context, which `fixed` + `z-50` already establishes. */}
      <span
        aria-hidden="true"
        className="lr-chrome-ground absolute inset-0 -z-10 border-b border-gold/20 bg-ink/95 backdrop-blur-sm"
      />

      {/* Fixed height rather than auto: the strip is one line at every width
          (it is hidden below lg), and a keyframe cannot animate height from
          `auto` to zero. */}
      <div className="lr-chrome-strip hidden overflow-hidden border-b border-ivory/10 lg:block">
        <Container className="flex h-full items-center justify-between text-[0.6875rem] tracking-[0.14em] text-ivory-dim uppercase">
          <p className="flex items-center gap-2">
            <MapPinIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-gold"
              weight="light"
            />
            {branches.map((branch, index) => (
              <span key={branch.slug}>
                {index > 0 ? (
                  <span aria-hidden="true" className="me-2 text-gold/50">
                    &middot;
                  </span>
                ) : null}
                {/* min-h fills the 44px strip: these were 13px tall, under
                    the WCAG 2.2 AA 24px target-size floor. No visual change. */}
                <Link
                  href={localePath(locale, branch.url)}
                  className="inline-flex min-h-11 items-center transition-colors duration-300 hover:text-gold"
                >
                  {branch.name}
                </Link>
              </span>
            ))}
          </p>

          <p className="flex items-center gap-7">
            <a
              href={`tel:${settings.contact.phone}`}
              className="inline-flex min-h-11 items-center gap-2 transition-colors duration-300 hover:text-gold"
            >
              <PhoneIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-gold"
                weight="light"
              />
              <bdi dir="ltr">{formatPhone(settings.contact.phone)}</bdi>
            </a>
            <a
              href={`mailto:${settings.contact.email}`}
              className="inline-flex min-h-11 items-center gap-2 normal-case transition-colors duration-300 hover:text-gold"
            >
              <EnvelopeSimpleIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-gold"
                weight="light"
              />
              <bdi dir="ltr">{settings.contact.email}</bdi>
            </a>
          </p>
        </Container>
      </div>

      {/* Three columns on desktop so the nav is genuinely centred rather than
          nearly so. It works because the header's other interactive parts are
          `display: none` at this width and contribute no grid items: the
          hamburger is `lg:hidden`, and a closed <dialog> is hidden by the UA
          stylesheet. */}
      <Container className="flex h-20 items-center justify-between gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Wordmark
          locale={locale}
          siteName={settings.site_name}
          priority
          className="h-12 md:h-[3.25rem]"
        />

        <SiteNav
          locale={locale}
          dict={dict}
          siteName={settings.site_name}
          reserveHref={reserveHref}
        />

        {/* The switcher rides with the Reserve button in the end column, NOT in
            the utility strip: that strip collapses on scroll and would take the
            language away with it. */}
        <div className="hidden lg:flex lg:items-center lg:gap-7 lg:justify-self-end">
          <LocaleSwitch
            locale={locale}
            className="text-[0.75rem] tracking-[0.14em] text-ivory-dim uppercase"
          />
          <Link
            href={reserveHref}
            className="inline-flex border border-gold/60 px-7 py-3 text-[0.75rem] font-medium tracking-[0.16em] text-gold uppercase transition-[background-color,border-color,color] duration-300 ease-brand hover:border-gold hover:bg-gold hover:text-ink"
          >
            {dict.actions.reserve}
          </Link>
        </div>
      </Container>
    </header>
  )
}
