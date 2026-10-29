import { describe, expect, it } from 'vitest'
import {
  bookableDates,
  chapterIssues,
  firstChapterWithIssues,
  hoursForDate,
  initialState,
  timeSlots,
  toPayload,
  toReservedFor,
  type BookState,
} from '@/lib/reservation'
import type { Branch } from '@/lib/schemas'

const SLUGS = ['narjis', 'al-yasmin']

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

/** A date 10 days from now, as the inputs produce it. */
function soon(): string {
  return new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10)
}

function filled(): BookState {
  return {
    ...initialState('narjis', SLUGS),
    date: soon(),
    time: '20:30',
    party_size: 4,
    guest_name: 'Noor Al-Harbi',
    guest_email: 'noor@example.com',
    guest_phone: '+966 51 234 5678',
    consent: true,
  }
}

describe('toReservedFor', () => {
  it('joins date and time with the Riyadh offset, never the device offset', () => {
    expect(toReservedFor('2026-10-04', '20:30')).toBe(
      '2026-10-04T20:30:00+03:00',
    )
  })

  it('returns null for anything that is not a date and a time', () => {
    expect(toReservedFor('', '20:30')).toBeNull()
    expect(toReservedFor('2026-10-04', '')).toBeNull()
    expect(toReservedFor('04/10/2026', '20:30')).toBeNull()
  })
})

describe('initialState', () => {
  it('preselects a known branch from the deep link', () => {
    expect(initialState('al-yasmin', SLUGS).branch_slug).toBe('al-yasmin')
  })

  it('chooses a lone branch: there is nothing to ask', () => {
    expect(initialState(null, ['narjis']).branch_slug).toBe('narjis')
  })

  it('ignores an unknown or missing branch', () => {
    expect(initialState('foo', SLUGS).branch_slug).toBe('')
    expect(initialState(null).branch_slug).toBe('')
  })

  it('starts with two guests and nothing else filled', () => {
    const state = initialState(null)
    expect(state.party_size).toBe(2)
    expect(state.consent).toBe(false)
    expect(state.occasion).toBe('')
  })
})

describe('toPayload', () => {
  it('strips spaces and dashes from phone numbers', () => {
    const payload = toPayload(
      {
        ...filled(),
        guest_phone: '+966 51-234 5678',
        whatsapp: '+966 51 234 5678',
      },
      'en',
    )
    expect(payload.guest_phone).toBe('+966512345678')
    expect(payload.whatsapp).toBe('+966512345678')
  })

  it('sends allergies and the occasion only while their box is ticked, and the birthday as numbers', () => {
    const extras = {
      ...filled(),
      allergies: ' Peanuts ',
      occasion: 'birthday' as const,
      birth_month: '3',
      birth_day: '14',
      captcha_token: 'tok',
    }
    expect(toPayload(extras, 'en')).toMatchObject({
      allergies: undefined,
      occasion: undefined,
      birth_month: 3,
      birth_day: 14,
      captcha_token: 'tok',
    })
    expect(
      toPayload({ ...extras, has_allergies: true, has_occasion: true }, 'en'),
    ).toMatchObject({ allergies: 'Peanuts', occasion: 'birthday' })
  })

  it('sends optional fields as undefined when empty, and the locale', () => {
    const payload = toPayload(filled(), 'ar')
    expect(payload.whatsapp).toBeUndefined()
    expect(payload.occasion).toBeUndefined()
    expect(payload.seating_preference).toBeUndefined()
    expect(payload.notes).toBeUndefined()
    expect(payload.locale).toBe('ar')
  })

  it('assembles reserved_for and sends an empty string when it cannot', () => {
    expect(toPayload(filled(), 'en').reserved_for).toMatch(/T20:30:00\+03:00$/)
    expect(toPayload({ ...filled(), time: '' }, 'en').reserved_for).toBe('')
  })
})

describe('chapterIssues', () => {
  it("reports only the chapter's own fields, in the request locale", () => {
    const empty = initialState(null)
    expect(Object.keys(chapterIssues(empty, 'room', 'en'))).toEqual([
      'branch_slug',
    ])
    expect(chapterIssues(empty, 'room', 'ar').branch_slug[0]).toBe(
      'اختر أحد فروعنا.',
    )
    expect(chapterIssues(filled(), 'room', 'en')).toEqual({})
  })

  it('puts a past time on reserved_for, which the When chapter owns, in words a guest can act on', () => {
    const today = new Date().toISOString().slice(0, 10)
    const past = { ...filled(), date: today, time: '00:01' }
    const issues = chapterIssues(past, 'when', 'en')
    expect(Object.keys(issues)).toEqual(['reserved_for'])
    expect(issues.reserved_for[0]).toBe(
      'Choose one of the dates and times offered.',
    )
    expect(chapterIssues(past, 'details', 'en')).toEqual({})
  })

  it('accepts a late dinner on the last date the picker offers', () => {
    const last = {
      ...filled(),
      date: bookableDates(10).at(-1)!,
      time: '23:30',
    }
    expect(chapterIssues(last, 'when', 'en')).toEqual({})
  })

  it('wants a whole birthday that exists, and owns it in the extras chapter', () => {
    const half = { ...filled(), birth_month: '2' }
    expect(Object.keys(chapterIssues(half, 'extras', 'en'))).toEqual([
      'birth_day',
    ])
    expect(
      chapterIssues({ ...half, birth_day: '30' }, 'extras', 'en').birth_day,
    ).toBeDefined()
    expect(chapterIssues({ ...half, birth_day: '29' }, 'extras', 'en')).toEqual(
      {},
    )
  })

  it('a complete state has no issues in any chapter', () => {
    for (const chapter of ['room', 'when', 'details', 'extras'] as const) {
      expect(chapterIssues(filled(), chapter, 'en')).toEqual({})
    }
  })
})

describe('firstChapterWithIssues', () => {
  it('walks the chapters in page order', () => {
    expect(
      firstChapterWithIssues({ guest_name: ['x'], reserved_for: ['y'] }),
    ).toBe('when')
    expect(firstChapterWithIssues({ consent: ['x'] })).toBe('details')
    expect(firstChapterWithIssues({})).toBeNull()
  })
})

describe('bookableDates', () => {
  it('offers the set number of days, today first, in Riyadh', () => {
    // 2026-10-01T22:30Z is already 2026-10-02 in Riyadh (UTC+3).
    const dates = bookableDates(10, new Date('2026-10-01T22:30:00Z'))
    expect(dates).toHaveLength(10)
    expect(dates[0]).toBe('2026-10-02')
    expect(dates.at(-1)).toBe('2026-10-11')
  })
})

describe('timeSlots', () => {
  const branch = {
    opening_hours: week({
      5: { opens_at: '13:00', closes_at: '01:00' },
      2: { opens_at: null, closes_at: null, is_closed: true },
    }),
  }
  // Riyadh 2026-10-04 09:00, a Sunday morning.
  const morning = new Date('2026-10-04T06:00:00Z')

  it('runs from opening up to, not at, closing, every n minutes', () => {
    const slots = timeSlots(branch, '2026-10-04', 30, 60, morning)
    expect(slots[0]).toBe('12:00')
    expect(slots.at(-1)).toBe('23:00')
    expect(slots).toHaveLength(23)
    expect(timeSlots(branch, '2026-10-04', 15, 60, morning).at(-1)).toBe(
      '23:15',
    )
  })

  it('runs past midnight for a late service, onto the next day', () => {
    // 2026-10-09 is a Friday, 13:00 to 01:00.
    const slots = timeSlots(branch, '2026-10-09', 30, 60, morning)
    expect(slots.at(-1)).toBe('24:30')
    expect(toReservedFor('2026-10-09', '24:30')).toBe(
      '2026-10-10T00:30:00+03:00',
    )
  })

  it('drops what is inside the minimum notice, and offers nothing on a closed day', () => {
    // Riyadh 19:10: with an hour's notice, 20:30 is the first slot.
    const evening = new Date('2026-10-04T16:10:00Z')
    expect(timeSlots(branch, '2026-10-04', 30, 60, evening)[0]).toBe('20:30')
    expect(timeSlots(branch, '2026-10-06', 30, 60, morning)).toEqual([])
    expect(timeSlots(null, '2026-10-04', 30, 60, morning)).toEqual([])
  })
})

describe('hoursForDate', () => {
  const branch = {
    opening_hours: week({
      5: { opens_at: '13:00', closes_at: '01:00' },
      6: { opens_at: '13:00', closes_at: '01:00' },
      2: { opens_at: null, closes_at: null, is_closed: true },
    }),
  }

  it('reads the weekday from the date and formats the range', () => {
    // 2026-10-04 is a Sunday.
    expect(hoursForDate(branch, '2026-10-04', 'en')).toEqual({
      open: true,
      hours: '12:00 PM - 11:30 PM',
    })
  })

  it('keeps a service that closes after midnight open', () => {
    // 2026-10-09 is a Friday.
    expect(hoursForDate(branch, '2026-10-09', 'en')).toEqual({
      open: true,
      hours: '01:00 PM - 01:00 AM',
    })
  })

  it('reports a closed day and gives up on a bad date', () => {
    // 2026-10-06 is a Tuesday.
    expect(hoursForDate(branch, '2026-10-06', 'en')).toEqual({ open: false })
    expect(hoursForDate(branch, '', 'en')).toBeNull()
  })

  it('formats in Arabic with Latin digits', () => {
    const hint = hoursForDate(branch, '2026-10-04', 'ar')
    expect(hint && hint.open && hint.hours).toMatch(/12:00/)
  })
})
