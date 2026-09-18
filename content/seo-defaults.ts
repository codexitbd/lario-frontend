import settingsFixture from '@/content/settings.json'
import { resolveTranslation } from '@/lib/api/resolve'
import type { Locale } from '@/lib/i18n/config'
import { localePath } from '@/lib/i18n/config'
import type { Seo } from '@/lib/schemas'

// MUST become environment-sourced before a staging site exists.
// 00-project-brief.md names the approved prototype — hosted on an unrelated
// domain while declaring `canonical: https://lario.sa/` — as a defect this
// project fixes. A staging deploy that compiles this constant in reproduces
// exactly that defect: every canonical and every hreflang on staging.lario.sa
// would point at production. Read it from the environment (validated in
// lib/env.ts alongside the other vars) the day staging is stood up.
export const SITE_ORIGIN = 'https://lario.sa'

// The title suffix and the default social-card image live in the settings
// fixture, which stands in for GET /settings — NOT in constants here.
// They were previously both, and the two copies had already drifted: the
// constant said "no default OG image exists" (correct — content-gap item 10)
// while settings advertised https://lario.sa/images/og/default.jpg, an asset
// nobody has ever produced. One source of truth, and it is the one an editor
// will eventually be able to change in the admin.
const SEO_DEFAULTS = settingsFixture.seo_defaults

// content/settings.json is SOURCE shape: title_suffix carries every locale and
// the server resolves one per `?locale=`, the same as any other translated
// field. The wire shape (settingsSchema) is the resolved string.
//
// Per-locale because a single Latin suffix put "المقبلات الباردة | La Rio
// Riyadh" — two scripts in one <title> — on every Arabic page.
export function titleSuffix(locale: Locale): string {
  return resolveTranslation(SEO_DEFAULTS.title_suffix, locale)
}

// imageUrlSchema permits EITHER an absolute URL or a root-relative path, so the
// prefix must be conditional. Prefixing an already-absolute URL yields
// "https://lario.sahttps://api.lario.sa/..." — which new URL() parses without
// throwing, so z.url() would NOT reject it. That is a silent corruption.
// The scheme test is case-INSENSITIVE: schemes are case-insensitive per RFC
// 3986, so "HTTPS://cdn.example/x.jpg" is a perfectly valid absolute URL and a
// case-sensitive test would prefix it — reproducing the corruption above.
export function absoluteImage(image: string | null | undefined): string | null {
  if (!image) return SEO_DEFAULTS.og_image
  return /^https?:\/\//i.test(image) ? image : `${SITE_ORIGIN}${image}`
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
    // `input.title` is the descriptor ONLY. The brand comes from the suffix,
    // exactly once — fixtures must not carry it too.
    title: `${input.title}${titleSuffix(input.locale)}`,
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
