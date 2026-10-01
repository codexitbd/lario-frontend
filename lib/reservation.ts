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
 * two date helpers. Pure, so lib/reservation.test.ts covers it without a DOM.
 */

/** Riyadh. Fixed, never read from the device: a guest booking from London
    must not send 20:30 London time. Saudi has no DST. */
const RIYADH_OFFSET = '+03:00'
const NINETY_DAYS_MS = 90 * 86_400_000
const BRANCH_SLUGS = ['narjis', 'al-yasmin'] as const

type BranchSlug = (typeof BRANCH_SLUGS)[number]

export type BookState = {
  branch_slug: '' | BranchSlug
  date: string
  time: string
  party_size: number
  guest_name: string
  guest_email: string
  guest_phone: string
  whatsapp: string
  occasion: '' | (typeof OCCASIONS)[number]
  seating_preference: '' | (typeof SEATING_PREFERENCES)[number]
  notes: string
  consent: boolean
}

export type Chapter = 'room' | 'when' | 'details'
export const CHAPTERS: readonly Chapter[] = ['room', 'when', 'details']

/** Which payload fields each chapter owns. `reserved_for` is the When
    chapter's because date and time are its inputs. */
const CHAPTER_FIELDS: Record<Chapter, readonly string[]> = {
  room: ['branch_slug'],
  when: ['reserved_for', 'party_size'],
  details: [
    'guest_name',
    'guest_email',
    'guest_phone',
    'whatsapp',
    'occasion',
    'seating_preference',
    'notes',
    'consent',
  ],
}

export function initialState(branch: string | null): BookState {
  return {
    branch_slug: BRANCH_SLUGS.includes(branch as BranchSlug)
      ? (branch as BranchSlug)
      : '',
    date: '',
    time: '',
    party_size: 2,
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    whatsapp: '',
    occasion: '',
    seating_preference: '',
    notes: '',
    consent: false,
  }
}

export function toReservedFor(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null
  }
  return `${date}T${time}:00${RIYADH_OFFSET}`
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
    occasion: optional(state.occasion),
    seating_preference: optional(state.seating_preference),
    notes: optional(state.notes.trim()),
    consent: state.consent,
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

export function dateBounds(now: Date = new Date()): {
  min: string
  max: string
} {
  return {
    min: riyadhDate(now),
    // 89 days, not 90: the schema's rule is 90 x 24h from NOW, so the 90th
    // calendar day is only valid before the current time of day. Offering it
    // would reject most dinner times on the last date the picker allows.
    max: riyadhDate(new Date(now.getTime() + NINETY_DAYS_MS - 86_400_000)),
  }
}

export function hoursForDate(
  branch: Pick<Branch, 'opening_hours'>,
  date: string,
  locale: Locale,
): { open: true; hours: string } | { open: false } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  // Noon UTC: no offset on earth moves it to another calendar day.
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay()
  const row = branch.opening_hours.find((hour) => hour.day_of_week === dow)
  if (!row || row.is_closed || !row.opens_at || !row.closes_at) {
    return { open: false }
  }
  return {
    open: true,
    hours: formatTimeRange(row.opens_at, row.closes_at, locale),
  }
}
