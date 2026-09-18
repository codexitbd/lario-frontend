import type { Locale } from '@/lib/i18n/config'
import { localePath } from '@/lib/i18n/config'
import type { Seo } from '@/lib/schemas'

export const SITE_ORIGIN = 'https://lario.sa'
export const TITLE_SUFFIX = ' | La Rio Riyadh'
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/og/default.jpg`

export function absoluteUrl(locale: Locale, path: string): string {
  return `${SITE_ORIGIN}${localePath(locale, path)}`
}

export function buildSeo(input: {
  title: string
  description: string
  path: string
  locale: Locale
  image?: string | null
  type?: string
  robots?: string
}): Seo {
  const canonical = absoluteUrl(input.locale, input.path)
  const image = input.image
    ? `${SITE_ORIGIN}${input.image}`
    : DEFAULT_OG_IMAGE
  return {
    title: `${input.title}${TITLE_SUFFIX}`,
    description: input.description,
    canonical,
    robots: input.robots ?? 'index,follow',
    og: {
      title: input.title,
      description: input.description,
      image,
      type: input.type ?? 'website',
    },
    twitter: { card: 'summary_large_image' },
    alternates: {
      en: absoluteUrl('en', input.path),
      ar: absoluteUrl('ar', input.path),
    },
    schema_enabled: true,
  }
}
