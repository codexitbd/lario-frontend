import Image from 'next/image'
import Link from 'next/link'
import {
  FacebookLogoIcon,
  GlobeIcon,
  GoogleLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  SnapchatLogoIcon,
  TiktokLogoIcon,
  WhatsappLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react/ssr'
import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import goldenLogo from '@/public/golden-logo.png'
import { NewsletterForm } from '@/components/layout/newsletter-form'
import { OpenNow } from '@/components/layout/open-now'
import { Container } from '@/components/ui/container'
import type { ApiMenuItem } from '@/lib/api/menus'
import { LEGAL_NAV, PRIMARY_NAV, type NavItem, toNavItems } from '@/lib/nav'
import { formatPhone } from '@/lib/format'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Branch, Settings } from '@/lib/schemas'

/**
 * The site footer, rebuilt 2026-09-30 at client request from a 21st.dev
 * "large name footer" reference, then compressed the same day to roughly half
 * a desktop viewport.
 *
 * Two bands. The first is the working footer in one row: the newsletter, then
 * Explore, Get in touch and Visit us. The second is the name: the real gold
 * logo (golden-logo.png, per the rule in wordmark.tsx) set wide at the start
 * edge and SINKING through the bottom of the page, cropped by its band and
 * dissolving into the ground, with the fine print at the end edge on its
 * baseline. The first full-height version spent ~470px on the logo alone;
 * cropping it is what buys the height back without shrinking the mark.
 *
 * Not taken from the reference: its shadcn Button, its icon sheet, its grey
 * text ramp and its gradient-clipped text. The site has its own tokens and
 * phosphor icons, and a gradient on a raster logo is a CSS mask.
 *
 * The 2026-09-20 rules still hold. NO CONTAINERS: not one box, tile, panel or
 * card. NO RESERVE BUTTON: the section above is the reservation CTA. NO
 * "COMING SOON" LIST: spec §3 is satisfied by the mobile drawer. NO YEAR in the
 * copyright: pages are prerendered and revalidated by webhook, so `new Date()`
 * would bake the build year and then be quietly wrong.
 *
 * Each room still reports whether it is serving RIGHT NOW (open-now.tsx). The
 * address and the per-day hours table live on the branch page the room's name
 * links to; the footer keeps the live state, the phone and directions.
 */
// Platforms the admin can pick (Settings → General → Social media); any other
// falls back to a globe.
const SOCIALS: Record<string, { icon: Icon; name: string }> = {
  instagram: { icon: InstagramLogoIcon, name: 'Instagram' },
  tiktok: { icon: TiktokLogoIcon, name: 'TikTok' },
  snapchat: { icon: SnapchatLogoIcon, name: 'Snapchat' },
  x: { icon: XLogoIcon, name: 'X' },
  facebook: { icon: FacebookLogoIcon, name: 'Facebook' },
  youtube: { icon: YoutubeLogoIcon, name: 'YouTube' },
  linkedin: { icon: LinkedinLogoIcon, name: 'LinkedIn' },
  tripadvisor: { icon: GlobeIcon, name: 'Tripadvisor' },
  google: { icon: GoogleLogoIcon, name: 'Google' },
  whatsapp: { icon: WhatsappLogoIcon, name: 'WhatsApp' },
}

const LINK =
  'inline-flex min-h-6 items-center transition-colors duration-300 ease-brand hover:text-gold'
const DIM = `${LINK} text-ivory-dim`

function Column({
  title,
  className = '',
  children,
}: {
  title: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <h2 className="lr-display text-lg text-gold italic">{title}</h2>
      <div className="mt-3 text-sm">{children}</div>
    </div>
  )
}

export function SiteFooter({
  branches,
  settings,
  menus,
  locale,
  dict,
}: {
  branches: Branch[]
  settings: Settings
  /** Admin menus by handle; "footer_explore" and "footer_legal" are used here. */
  menus: Record<string, ApiMenuItem[]>
  locale: Locale
  dict: Dictionary
}) {
  const fallback = (list: readonly { key: string; href: string }[], labels: Record<string, string>): NavItem[] =>
    list.map((item) => ({ id: item.key, label: labels[item.key], href: localePath(locale, item.href), newTab: false, comingSoon: false, exact: false, children: [] }))
  const explore = (menus.footer_explore ? toNavItems(menus.footer_explore, locale, 'explore') : fallback(PRIMARY_NAV, dict.nav)).filter((item) => item.href)
  const legal = (menus.footer_legal ? toNavItems(menus.footer_legal, locale, 'legal') : fallback(LEGAL_NAV, dict.footer)).filter((item) => item.href)

  return (
    <footer className="overflow-hidden border-t border-gold/20 bg-ink text-ivory">
      <Container>
        {/* Mobile: newsletter, then Explore and Get in touch two-up, then
            Visit us full width. md: newsletter across, three columns under.
            lg: one row. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 pt-12 pb-6 md:grid-cols-3 lg:grid-cols-[1.5fr_0.7fr_0.9fr_1.1fr] lg:gap-x-12">
          <section
            aria-labelledby="lr-newsletter"
            className="col-span-2 md:col-span-3 lg:col-span-1"
          >
            <h2
              id="lr-newsletter"
              className="lr-display text-[clamp(1.375rem,1.1rem+0.7vw,1.75rem)] leading-tight text-ivory"
            >
              {dict.footer.newsletterTitle}
            </h2>
            <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-pretty text-ivory-dim">
              {dict.footer.newsletterBody}
            </p>
            <NewsletterForm locale={locale} dict={dict} />
          </section>

          <Column title={dict.footer.explore}>
            <nav aria-label={dict.footer.explore}>
              <ul className="space-y-1">
                {explore.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href!} className={DIM} {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Column>

          <Column title={dict.footer.getInTouch}>
            <ul className="space-y-1">
              <li>
                <a href={`tel:${settings.contact.phone}`} className={DIM}>
                  <bdi dir="ltr">{formatPhone(settings.contact.phone)}</bdi>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${(settings.contact.whatsapp ?? '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className={DIM}
                >
                  {dict.footer.whatsapp}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${settings.contact.email}`}
                  className={`${DIM} break-all`}
                >
                  <bdi dir="ltr">{settings.contact.email}</bdi>
                </a>
              </li>
            </ul>
            <ul
              aria-label={dict.footer.followUs}
              className="mt-2 -ms-2 flex items-center"
            >
              {settings.socials.map(
                ({ platform: network, url }) => {
                  const { icon: SocialIcon, name } = SOCIALS[network] ?? { icon: GlobeIcon, name: network }
                  return (
                    <li key={`${network}-${url}`}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex size-10 items-center justify-center text-ivory-dim transition-colors duration-300 ease-brand hover:text-gold"
                      >
                        <span className="sr-only">{name}</span>
                        <SocialIcon aria-hidden="true" className="size-5" />
                      </a>
                    </li>
                  )
                },
              )}
            </ul>
          </Column>

          <Column
            title={dict.footer.visitUs}
            className="col-span-2 md:col-span-1"
          >
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-x-10 md:grid-cols-1">
              {branches.map((branch) => (
                <li key={branch.slug}>
                  {/* Two lines a room: who and how to call, then whether
                      they are serving and how to get there. */}
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <Link
                      href={localePath(locale, branch.url)}
                      className="lr-display text-lg leading-tight text-ivory transition-colors duration-300 ease-brand hover:text-gold"
                    >
                      {branch.name}
                    </Link>
                    <a
                      href={`tel:${branch.phone}`}
                      className="inline-flex min-h-6 items-center text-gold transition-colors duration-300 ease-brand hover:text-gold-pale"
                    >
                      <bdi dir="ltr">{formatPhone(branch.phone)}</bdi>
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4">
                    <OpenNow branch={branch} locale={locale} dict={dict} />
                    {branch.google_maps_url ? (
                      <a
                        href={branch.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`${DIM} text-[0.8125rem]`}
                      >
                        {dict.branch.getDirections}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Column>
        </div>

        {/* The name, sinking. The band's height is the whole budget; the image
            is 1.8x that tall and lifted by its own transparent top padding
            (10.7% of the canvas), so the band shows the top ~70% of the
            artwork, enough for "Rio" to read, and the rest is below the page. The mask dissolves it
            before the cut so the crop reads as depth, not as clipping.
            Decorative: the brand is named by the header mark and the
            copyright line, so it is hidden rather than announced a third
            time. On a phone the fine print comes first so the name is still
            the last thing on the page. */}
        <div className="flex flex-col-reverse gap-8 border-t border-ivory/10 pt-5 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="h-[clamp(5rem,9vw,8.5rem)] shrink-0 overflow-hidden">
            <Image
              src={settings.branding.logo_light ?? goldenLogo}
              {...(settings.branding.logo_light ? { width: 1300, height: 635 } : {})}
              alt=""
              aria-hidden="true"
              sizes="44rem"
              draggable={false}
              className="pointer-events-none h-[180%] w-auto max-w-none -translate-y-[10.7%] select-none [mask-image:linear-gradient(to_bottom,#000_42%,transparent_66%)]"
            />
          </div>

          <div className="flex flex-col gap-3 md:items-end md:pb-6">
            <ul className="flex flex-wrap items-center gap-x-6">
              {legal.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href!}
                    className={`${LINK} text-[0.6875rem] tracking-[0.14em] text-ivory-dim/70 uppercase`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-[0.6875rem] tracking-[0.14em] text-ivory-dim/60 uppercase">
              {settings.copyright ?? <>&copy; {settings.site_name}. {dict.footer.rights}</>}
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
