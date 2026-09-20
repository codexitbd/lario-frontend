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
  // A plain hyphen, not an en dash. Opening hours render beside Arabic text on
  // branch cards and branch pages, where a dash glyph that does not exist in
  // the Arabic face falls back to a different font mid-string. The hyphen is
  // also the house rule for every range on the site, so date and price ranges
  // match this without a second decision.
  return `${formatClock(opens, locale)} - ${formatClock(closes, locale)}`
}

const WEEKDAY_REFERENCE_SUNDAY = Date.UTC(2024, 0, 7)

/**
 * `day_of_week` is 0-6 with 0 = Sunday, matching `toSchemaOpeningHours`.
 * Anchored to a known Sunday in UTC so the name never drifts by a day when the
 * server sits in a different zone from Riyadh.
 */
export function formatWeekday(
  dayOfWeek: number,
  locale: Locale,
  width: 'short' | 'long' = 'short',
): string {
  const date = new Date(WEEKDAY_REFERENCE_SUNDAY + dayOfWeek * 86_400_000)
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: 'UTC',
    weekday: width,
  }).format(date)
}

export function formatClock(time: string, locale: Locale): string {
  const [hours = '0', minutes = '0'] = time.split(':')
  const date = new Date(Date.UTC(2000, 0, 1, Number(hours), Number(minutes)))
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * A phone number for DISPLAY. The fixtures store E.164 ("+966112345678")
 * because that is what `tel:` links and the backend want; printed raw it is a
 * twelve-digit run that nobody can read, which matters most in the footer where
 * the number is set large as the anchor of its column.
 *
 * Saudi national numbers are nine digits after the country code and group 2-3-4
 * for both landline (11) and mobile (5X) prefixes. Anything that is not a
 * recognised +966 number is returned untouched rather than mangled into a
 * grouping that does not apply to it.
 *
 * Latin digits throughout, matching D16 and `NUMERAL_SYSTEM`. The caller is
 * responsible for bidi isolation: this returns a left-to-right string, so print
 * it inside a <bdi dir="ltr"> when the page may be RTL.
 */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '')
  if (!digits.startsWith('966') || digits.length !== 12) return e164
  const national = digits.slice(3)
  return `+966 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`
}
