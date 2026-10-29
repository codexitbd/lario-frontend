import { TIME_ZONE, formatTimeRange } from '@/lib/format'
import type { Locale } from '@/lib/i18n/config'
import type { Branch } from '@/lib/schemas'
import {
  OCCASIONS,
  SEATING_PREFERENCES,
  localiseIssues,
  reservationSchema,
} from '@/lib/schemas/reservation'

/**
 * Everything about the reservation book that is not React: the state shape,
 * the payload the contract wants, which chapter owns which field, and the
 * dates and time slots on offer. Pure, so lib/reservation.test.ts covers it
 * without a DOM.
 */

/** Riyadh. Fixed, never read from the device: a guest booking from London
    must not send 20:30 London time. Saudi has no DST. */
const RIYADH_OFFSET = '+03:00'
const DAY_MS = 86_400_000
export type BookState = {
  branch_slug: string
  date: string
  time: string
  party_size: number
  guest_name: string
  guest_email: string
  guest_phone: string
  whatsapp: string
  /** "Please let us know if you have": each box opens its own question. */
  has_allergies: boolean
  allergies: string
  has_occasion: boolean
  occasion: '' | (typeof OCCASIONS)[number]
  seating_preference: '' | (typeof SEATING_PREFERENCES)[number]
  birth_month: string
  birth_day: string
  notes: string
  consent: boolean
  captcha_token: string
}

export type Chapter = 'room' | 'when' | 'details' | 'extras'
export const CHAPTERS: readonly Chapter[] = [
  'room',
  'when',
  'details',
  'extras',
]

/** Which payload fields each chapter owns. `reserved_for` is the When
    chapter's because date and time are its inputs. */
const CHAPTER_FIELDS: Record<Chapter, readonly string[]> = {
  room: ['branch_slug'],
  when: ['reserved_for', 'party_size'],
  details: ['guest_name', 'guest_email', 'guest_phone', 'whatsapp', 'consent'],
  extras: [
    'allergies',
    'occasion',
    'seating_preference',
    'birth_month',
    'birth_day',
    'notes',
  ],
}

/** `slugs`: the branches on offer. A `?branch=` deep link preselects only a
    real one, and a lone branch is simply chosen: there is nothing to ask. */
export function initialState(
  branch: string | null,
  slugs: readonly string[] = [],
): BookState {
  return {
    branch_slug:
      slugs.length === 1
        ? slugs[0]
        : branch && slugs.includes(branch)
          ? branch
          : '',
    date: '',
    time: '',
    party_size: 2,
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    whatsapp: '',
    has_allergies: false,
    allergies: '',
    has_occasion: false,
    occasion: '',
    seating_preference: '',
    birth_month: '',
    birth_day: '',
    notes: '',
    consent: false,
    captcha_token: '',
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** `time` may run past midnight ("24:30"): a slot in a service that closes
    after midnight, which lands on the next calendar day. */
export function toReservedFor(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null
  }
  const [hours, minutes] = time.split(':').map(Number)
  const day =
    hours >= 24
      ? new Date(Date.parse(`${date}T12:00:00Z`) + DAY_MS)
          .toISOString()
          .slice(0, 10)
      : date
  return `${day}T${pad(hours % 24)}:${pad(minutes)}:00${RIYADH_OFFSET}`
}

const phone = (value: string) => value.replace(/[\s-]/g, '')
const optional = (value: string) => (value ? value : undefined)

export function toPayload(
  state: BookState,
  locale: Locale,
): Record<string, unknown> {
  return {
    branch_slug: state.branch_slug,
    guest_name: state.guest_name.trim(),
    guest_email: state.guest_email.trim(),
    guest_phone: phone(state.guest_phone),
    whatsapp: optional(phone(state.whatsapp)),
    party_size: state.party_size,
    // '' rather than undefined when unassembled, so Zod reports the field
    // instead of a missing key.
    reserved_for: toReservedFor(state.date, state.time) ?? '',
    occasion: state.has_occasion ? optional(state.occasion) : undefined,
    seating_preference: optional(state.seating_preference),
    allergies: state.has_allergies
      ? optional(state.allergies.trim())
      : undefined,
    birth_month: state.birth_month ? Number(state.birth_month) : undefined,
    birth_day: state.birth_day ? Number(state.birth_day) : undefined,
    notes: optional(state.notes.trim()),
    consent: state.consent,
    captcha_token: optional(state.captcha_token),
    locale,
  }
}

export function allIssues(
  state: BookState,
  locale: Locale,
): Record<string, string[]> {
  const parsed = reservationSchema.safeParse(toPayload(state, locale))
  return parsed.success ? {} : localiseIssues(parsed.error.issues, locale)
}

export function chapterIssues(
  state: BookState,
  chapter: Chapter,
  locale: Locale,
): Record<string, string[]> {
  const own = CHAPTER_FIELDS[chapter]
  return Object.fromEntries(
    Object.entries(allIssues(state, locale)).filter(([field]) =>
      own.includes(field),
    ),
  )
}

export function firstChapterWithIssues(
  issues: Record<string, string[]>,
): Chapter | null {
  const fields = Object.keys(issues)
  return (
    CHAPTERS.find((chapter) =>
      CHAPTER_FIELDS[chapter].some((field) => fields.includes(field)),
    ) ?? null
  )
}

/** YYYY-MM-DD of an instant, as Riyadh sees it. `en-CA` is the one locale
    whose default date pattern is ISO order. */
function riyadhDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

/** The dates a guest may pick: `days` of them, today first, in Riyadh
    (Settings → Reservations → Dates offered). Saudi has no DST, so a day is
    always 24h. */
export function bookableDates(days: number, now: Date = new Date()): string[] {
  return Array.from({ length: Math.max(0, days) }, (_, i) =>
    riyadhDate(new Date(now.getTime() + i * DAY_MS)),
  )
}

function openingRow(branch: Pick<Branch, 'opening_hours'>, date: string) {
  // Noon UTC: no offset on earth moves it to another calendar day.
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay()
  const row = branch.opening_hours.find((hour) => hour.day_of_week === dow)
  return row && !row.is_closed && row.opens_at && row.closes_at
    ? { opens: row.opens_at, closes: row.closes_at }
    : null
}

const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * The times on offer that day, `every` minutes apart from opening up to (not
 * at) closing. A service that closes after midnight runs on as "24:30" and so
 * on (see toReservedFor). Slots inside the minimum notice are left out, so a
 * late visit to the page simply offers fewer of today's times. These are the
 * hours the branch keeps, not free tables: staff still confirm every request.
 */
export function timeSlots(
  branch: Pick<Branch, 'opening_hours'> | null,
  date: string,
  every: number,
  noticeMinutes: number,
  now: Date = new Date(),
): string[] {
  const row =
    branch && /^\d{4}-\d{2}-\d{2}$/.test(date) ? openingRow(branch, date) : null
  if (!row) return []
  const opens = toMinutes(row.opens)
  let closes = toMinutes(row.closes)
  if (closes <= opens) closes += 24 * 60
  const earliest = now.getTime() + noticeMinutes * 60_000
  const slots: string[] = []
  for (let t = opens; t < closes; t += Math.max(5, every)) {
    const time = `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
    if (Date.parse(toReservedFor(date, time)!) >= earliest) slots.push(time)
  }
  return slots
}

export function hoursForDate(
  branch: Pick<Branch, 'opening_hours'>,
  date: string,
  locale: Locale,
): { open: true; hours: string } | { open: false } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const row = openingRow(branch, date)
  if (!row) return { open: false }
  return {
    open: true,
    hours: formatTimeRange(row.opens, row.closes, locale),
  }
}
