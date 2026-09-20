import { TIME_ZONE, formatClock, formatTimeRange, formatWeekday } from '@/lib/format'
import type { Locale } from '@/lib/i18n/config'
import type { Branch } from '@/lib/schemas'

export type HoursGroup = {
  /** "Sun - Thu", or a single day name when the group is one day. */
  days: string
  /** A time range, or the caller's localised "Closed" label. */
  hours: string
}

/**
 * Collapses seven rows of opening hours into the two or three lines a card can
 * actually show, by merging runs of consecutive days that share a time.
 *
 * Both branches currently run one weekday pattern and one weekend pattern, but
 * these are CMS rows — an editor can give Friday its own hours at any point,
 * and this splits the run rather than misreporting the week. Used by the
 * homepage branch cards now and by /branches/[slug] later.
 *
 * `day_of_week` is 0-6 with 0 = Sunday, matching `toSchemaOpeningHours` and the
 * Riyadh week, so plain ascending order is the display order.
 */
export function groupOpeningHours(
  hours: Branch['opening_hours'],
  locale: Locale,
  closedLabel: string,
): HoursGroup[] {
  const runs: { start: number; end: number; key: string }[] = []

  for (const hour of [...hours].sort((a, b) => a.day_of_week - b.day_of_week)) {
    const key =
      hour.is_closed || !hour.opens_at || !hour.closes_at
        ? 'closed'
        : `${hour.opens_at}|${hour.closes_at}`
    const last = runs.at(-1)

    if (last && last.key === key && last.end === hour.day_of_week - 1) {
      last.end = hour.day_of_week
    } else {
      runs.push({ start: hour.day_of_week, end: hour.day_of_week, key })
    }
  }

  return runs.map((run) => {
    const [opens, closes] = run.key.split('|')
    return {
      days:
        run.start === run.end
          ? formatWeekday(run.start, locale)
          : `${formatWeekday(run.start, locale)} - ${formatWeekday(run.end, locale)}`,
      hours:
        run.key === 'closed' || !opens || !closes
          ? closedLabel
          : formatTimeRange(opens, closes, locale),
    }
  })
}

export type OpenState =
  | { open: true; closesAt: string }
  | { open: false; opensDay: string; opensAt: string }
  | { open: false; opensDay: null; opensAt: null }

/**
 * Riyadh's current weekday (0 = Sunday) and minutes since local midnight.
 *
 * The site is statically prerendered and served worldwide, so "now" has to be
 * resolved in the restaurant's timezone, not the reader's. Intl does the
 * offset and the DST question (Saudi has none, but hard-coding +03:00 would
 * quietly rot if that ever changed).
 */
export function riyadhNow(now: Date): { dow: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  // Intl can emit "24" for midnight under hour12:false; normalise it.
  const hour = Number(get('hour')) % 24
  return {
    dow: Math.max(0, days.indexOf(get('weekday'))),
    minutes: hour * 60 + Number(get('minute')),
  }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Whether a branch is serving RIGHT NOW, and until when. Pure, so it can be
 * tested against fixed clocks rather than whatever time the suite happens to
 * run at.
 *
 * The wrap case is the whole difficulty. Both branches close at 01:00, which is
 * the NEXT calendar day, so a row reading 13:00 to 01:00 covers two dates. At
 * 00:30 on Saturday the guest is inside FRIDAY's row, not Saturday's, so
 * yesterday is checked before today. Treating `closes_at < opens_at` as a typo
 * and clamping it would report the restaurant shut during its busiest hour.
 */
export function getOpenState(
  hours: Branch['opening_hours'],
  locale: Locale,
  now: Date = new Date(),
): OpenState {
  const { dow, minutes } = riyadhNow(now)
  const rowFor = (d: number) =>
    hours.find((h) => h.day_of_week === ((d % 7) + 7) % 7)

  // Yesterday's service may still be running past midnight.
  const yesterday = rowFor(dow - 1)
  if (yesterday && !yesterday.is_closed && yesterday.opens_at && yesterday.closes_at) {
    const opens = toMinutes(yesterday.opens_at)
    const closes = toMinutes(yesterday.closes_at)
    if (closes <= opens && minutes < closes) {
      return { open: true, closesAt: formatClock(yesterday.closes_at, locale) }
    }
  }

  const today = rowFor(dow)
  if (today && !today.is_closed && today.opens_at && today.closes_at) {
    const opens = toMinutes(today.opens_at)
    const closes = toMinutes(today.closes_at)
    const wraps = closes <= opens
    if (minutes >= opens && (wraps || minutes < closes)) {
      return { open: true, closesAt: formatClock(today.closes_at, locale) }
    }
    if (minutes < opens) {
      return {
        open: false,
        opensDay: formatWeekday(dow, locale),
        opensAt: formatClock(today.opens_at, locale),
      }
    }
  }

  // Walk forward for the next day that actually opens.
  for (let step = 1; step <= 7; step += 1) {
    const row = rowFor(dow + step)
    if (row && !row.is_closed && row.opens_at) {
      return {
        open: false,
        opensDay: formatWeekday(((dow + step) % 7 + 7) % 7, locale),
        opensAt: formatClock(row.opens_at, locale),
      }
    }
  }
  return { open: false, opensDay: null, opensAt: null }
}
