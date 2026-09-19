import { formatTimeRange, formatWeekday } from '@/lib/format'
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
