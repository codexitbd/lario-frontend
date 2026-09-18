import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { IBM_Plex_Sans_Arabic, Inter } from 'next/font/google'
import { LOCALES, getDirection, isLocale } from '@/lib/i18n/config'
import '@/app/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-latin',
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
  if (!isLocale(locale)) notFound()

  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body className={`${inter.variable} ${arabic.variable}`}>
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
