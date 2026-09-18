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
