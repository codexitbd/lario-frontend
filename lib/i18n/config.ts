export const LOCALES = ['en', 'ar'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function localePath(locale: Locale, path: string): string {
  const [rawPath = '', suffix = ''] = splitSuffix(path)
  const withSlash = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const trimmed = withSlash.replace(/\/+$/, '')
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  const joined = `${prefix}${trimmed}`
  return (joined === '' ? '/' : joined) + suffix
}

function splitSuffix(path: string): [string, string] {
  const marker = path.search(/[?#]/)
  return marker === -1
    ? [path, '']
    : [path.slice(0, marker), path.slice(marker)]
}

/**
 * Each language's name in ITSELF, not translated. A switcher that offers
 * "Arabic" to an Arabic reader is offering them a word they may not read; the
 * endonym is the one label that works regardless of which side you are on.
 * Not in `messages/` because it is identical in every dictionary.
 */
export const LOCALE_ENDONYMS: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
}

/**
 * Drops a locale prefix from a path, so the same page can be re-addressed in
 * the other language. `/ar/menu/cold-mezze` -> `/menu/cold-mezze`.
 *
 * The match is SEGMENT-anchored. A plain `startsWith('/ar')` also eats the
 * first three characters of `/arabica-blend` and sends the reader to a 404,
 * which is the whole reason this is a tested function and not an inline slice.
 *
 * The default locale carries no prefix, so an unprefixed path is returned
 * unchanged and is already correct.
 */
export function stripLocalePrefix(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`
  for (const locale of LOCALES) {
    if (withSlash === `/${locale}`) return '/'
    if (withSlash.startsWith(`/${locale}/`)) return withSlash.slice(locale.length + 1)
  }
  return withSlash
}
