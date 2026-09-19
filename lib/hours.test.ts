import { describe, expect, it } from 'vitest'
import { groupOpeningHours } from '@/lib/hours'
import type { Branch } from '@/lib/schemas'

type Hours = Branch['opening_hours']

function week(
  overrides: Partial<Record<number, Partial<Hours[number]>>> = {},
): Hours {
  return Array.from({ length: 7 }, (_, day) => ({
    day_of_week: day,
    opens_at: '12:00',
    closes_at: '23:30',
    is_closed: false,
    ...overrides[day],
  }))
}

describe('groupOpeningHours', () => {
  it('collapses an identical week into one line', () => {
    const groups = groupOpeningHours(week(), 'en', 'Closed')
    expect(groups).toHaveLength(1)
    expect(groups[0].days).toBe('Sun - Sat')
  })

  it('splits where the times change, as both branches do at the weekend', () => {
    const groups = groupOpeningHours(
      week({
        5: { opens_at: '13:00', closes_at: '01:00' },
        6: { opens_at: '13:00', closes_at: '01:00' },
      }),
      'en',
      'Closed',
    )
    expect(groups.map((group) => group.days)).toEqual(['Sun - Thu', 'Fri - Sat'])
  })

  it('names a single day rather than a range of one', () => {
    const groups = groupOpeningHours(
      week({ 3: { is_closed: true } }),
      'en',
      'Closed',
    )
    expect(groups.map((group) => group.days)).toEqual([
      'Sun - Tue',
      'Wed',
      'Thu - Sat',
    ])
    expect(groups[1].hours).toBe('Closed')
  })

  it('does not merge a matching day that is not adjacent', () => {
    // Monday and Wednesday share hours but Tuesday does not, so they must stay
    // three groups. Keying on the time alone would report "Mon - Wed".
    const groups = groupOpeningHours(
      week({ 2: { opens_at: '16:00', closes_at: '22:00' } }),
      'en',
      'Closed',
    )
    expect(groups).toHaveLength(3)
    expect(groups[1].days).toBe('Tue')
  })

  it('emits no en dash or em dash in either locale', () => {
    for (const locale of ['en', 'ar'] as const) {
      const groups = groupOpeningHours(
        week({ 5: { opens_at: '13:00', closes_at: '01:00' } }),
        locale,
        'Closed',
      )
      for (const group of groups) {
        expect(`${group.days} ${group.hours}`).not.toMatch(/[–—]/)
      }
    }
  })
})
