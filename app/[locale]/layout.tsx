import type { Metadata } from 'next'
import { Bodoni_Moda, IBM_Plex_Sans_Arabic, Inter } from 'next/font/google'
import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  getDirection,
  isLocale,
} from '@/lib/i18n/config'
import '@/app/globals.css'

const inter = Inter({
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

  return (
    <html lang={active} dir={getDirection(active)}>
      <body
        className={`${inter.variable} ${arabic.variable} ${display.variable}`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
