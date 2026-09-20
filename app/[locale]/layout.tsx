import type { Metadata } from 'next'
import { Archivo, Bodoni_Moda, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { getBranches } from '@/lib/api/branches'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  getDirection,
  isLocale,
} from '@/lib/i18n/config'
import '@/app/globals.css'

// Archivo, not Inter. Inter is the default every AI-built site reaches for and
// it reads as absence of a choice; Archivo is a grotesque with slightly
// condensed proportions and real texture at 13-16px, which is the size most of
// this site's copy actually lives at (dish descriptions, hours, addresses). It
// also pairs on a contrast axis with Bodoni rather than competing: Didone
// high-contrast display against an even-weight workhorse.
//
// The Arabic face stays IBM Plex Sans Arabic. Arabic display options are
// genuinely thin, it is a well-drawn face, and it is already the shipped
// identity for half the audience.
const latin = Archivo({
  subsets: ['latin'],
  variable: '--font-latin',
  display: 'swap',
})

// The display face. Bodoni's high contrast and vertical stress echo the
// logo's gold script without imitating it; the optical-size axis keeps the
// hairlines from disappearing at hero scale. Latin only — the Arabic swap
// lives in globals.css.
const display = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  metadataBase: new URL('https://lario.sa'),
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // This is the de facto ROOT layout — no app/layout.tsx sits above it, so it is
  // the only place <html> and <body> are emitted. Calling notFound() here would
  // stream a response WITHOUT those tags, and Next.js then discards our styled
  // not-found.tsx and serves its own generic, unlocalised 404 instead. ADR-006
  // requires lang and dir to be set ALWAYS, so the layout falls back rather than
  // bailing out, and app/[locale]/page.tsx owns the 404 decision. This mirrors
  // the official Next.js i18n guide, whose root layout performs no locale check.
  //
  // Reachable in production: proxy.ts excludes any path containing a dot from
  // locale normalisation, so /de/robots.txt arrives here with locale="de".
  const active: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE

  // The chrome's data, fetched once here for both the header and the footer.
  // All three are cached fetchers, so this costs one resolution per locale for
  // the whole site rather than one per page.
  const [branches, settings, dict] = await Promise.all([
    getBranches(active),
    getSettings(active),
    getDictionary(active),
  ])

  return (
    <html lang={active} dir={getDirection(active)}>
      <body
        className={`${latin.variable} ${arabic.variable} ${display.variable}`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
        >
          {dict.actions.skipToContent}
        </a>
        <SiteHeader
          branches={branches}
          settings={settings}
          locale={active}
          dict={dict}
        />
        {children}
        <SiteFooter
          branches={branches}
          settings={settings}
          locale={active}
          dict={dict}
        />
      </body>
    </html>
  )
}
