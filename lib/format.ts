import type { Locale } from '@/lib/i18n/config'

export const NUMERAL_SYSTEM: 'latn' | 'arab' = 'latn'

export const TIME_ZONE = 'Asia/Riyadh'

function intlLocale(locale: Locale): string {
  return locale === 'ar'
    ? `ar-SA-u-nu-${NUMERAL_SYSTEM}-ca-gregory`
    : 'en-SA-u-ca-gregory'
}

export function formatPrice(
  amount: string,
  currency: string,
  locale: Locale,
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    // `amount` is a decimal string such as "189.00", already validated by
    // priceSchema. Intl.NumberFormat.format() accepts numeric strings at
    // runtime and formats them exactly; TypeScript types the parameter as
    // Intl.StringNumericLiteral, so this assertion states what the schema
    // already guarantees. It is a type-level cast with no runtime conversion.
    // NEVER change this to Number(amount) — that reintroduces float drift and
    // is the precise bug this whole approach exists to prevent.
  }).format(amount as Intl.StringNumericLiteral)
}

export function formatCalories(calories: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(calories)
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatTimeRange(
  opens: string,
  closes: string,
  locale: Locale,
): string {
  return `${formatClock(opens, locale)} – ${formatClock(closes, locale)}`
}

function formatClock(time: string, locale: Locale): string {
  const [hours = '0', minutes = '0'] = time.split(':')
  const date = new Date(Date.UTC(2000, 0, 1, Number(hours), Number(minutes)))
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
