import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

export function resolveTranslation<T>(
  translations: Partial<Record<Locale, T>>,
  locale: Locale,
): T {
  const value = translations[locale] ?? translations[DEFAULT_LOCALE]
  if (!value) {
    throw new Error(`No translation available for locale "${locale}"`)
  }
  return value
}
