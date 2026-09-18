import type { Locale } from '@/lib/i18n/config'
import { localePath } from '@/lib/i18n/config'
import type { Seo } from '@/lib/schemas'

export const SITE_ORIGIN = 'https://lario.sa'
export const TITLE_SUFFIX = ' | La Rio Riyadh'

// No default social-card image exists yet: the client has not supplied brand
// social artwork (content-gap item 10). Emitting a URL that 404s is worse than
// emitting none — crawlers cache the failure and the card renders broken. Set
// this to an absolute URL once the asset ships.
export const DEFAULT_OG_IMAGE: string | null = null

// imageUrlSchema permits EITHER an absolute URL or a root-relative path, so the
// prefix must be conditional. Prefixing an already-absolute URL yields
// "https://lario.sahttps://api.lario.sa/..." — which new URL() parses without
// throwing, so z.url() would NOT reject it. That is a silent corruption.
export function absoluteImage(image: string | null | undefined): string | null {
  if (!image) return DEFAULT_OG_IMAGE
  return /^https?:\/\//.test(image) ? image : `${SITE_ORIGIN}${image}`
}

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
  const image = absoluteImage(input.image)
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
