import { describe, expect, it } from 'vitest'
import { getOpenState, riyadhNow } from '@/lib/hours'
import branches from '@/content/branches.json'
import type { Branch } from '@/lib/schemas'

const narjis = branches.find((b) => b.slug === 'narjis')!
  .opening_hours as Branch['opening_hours']

// Riyadh is UTC+3 and observes no DST, so a UTC instant maps to a fixed local
// clock. These are written in UTC and asserted against the Riyadh wall time.
const utc = (iso: string) => new Date(iso)

describe('riyadhNow', () => {
  it('resolves the restaurant timezone, not the runner timezone', () => {
    // 2026-09-20 is a Sunday. 09:00 UTC is 12:00 in Riyadh.
    expect(riyadhNow(utc('2026-09-20T09:00:00Z'))).toEqual({
      dow: 0,
      minutes: 12 * 60,
    })
  })

  it('rolls the weekday over when UTC and Riyadh are on different dates', () => {
    // 22:30 UTC Saturday is 01:30 Sunday in Riyadh.
    const { dow, minutes } = riyadhNow(utc('2026-09-19T22:30:00Z'))
    expect(dow).toBe(0)
    expect(minutes).toBe(90)
  })
})

describe('getOpenState', () => {
  // Narjis: Sun-Thu 12:00-23:30, Fri-Sat 13:00-01:00.
  it('is open during service', () => {
    const s = getOpenState(narjis, 'en', utc('2026-09-20T15:00:00Z')) // Sun 18:00
    expect(s.open).toBe(true)
  })

  it('is closed before the doors open, and names today', () => {
    const s = getOpenState(narjis, 'en', utc('2026-09-20T06:00:00Z')) // Sun 09:00
    expect(s.open).toBe(false)
    if (!s.open) expect(s.opensAt).toBeTruthy()
  })

  it('STAYS OPEN past midnight on a wrapping row', () => {
    // Friday runs 13:00 to 01:00. 21:30 UTC Friday is 00:30 SATURDAY in Riyadh,
    // which belongs to Friday's row. Reading Saturday's row here would report
    // the restaurant shut during service.
    const s = getOpenState(narjis, 'en', utc('2026-09-25T21:30:00Z'))
    expect(s.open).toBe(true)
  })

  it('is closed in the gap after a wrapping row ends', () => {
    // 23:00 UTC Friday is 02:00 Saturday: past the 01:00 close, before 13:00.
    const s = getOpenState(narjis, 'en', utc('2026-09-25T23:00:00Z'))
    expect(s.open).toBe(false)
  })

  it('never reports a branch as permanently unopenable', () => {
    // Every fixture branch opens at some point in the week, so the exhausted
    // fallback must not be reachable for real data.
    for (const branch of branches) {
      const s = getOpenState(
        branch.opening_hours as Branch['opening_hours'],
        'en',
        utc('2026-09-20T06:00:00Z'),
      )
      if (!s.open) expect(s.opensDay).not.toBeNull()
    }
  })

  it('reports closed with no reopening when every day is closed', () => {
    const shut = narjis.map((h) => ({ ...h, is_closed: true }))
    const s = getOpenState(shut, 'en', utc('2026-09-20T15:00:00Z'))
    expect(s).toEqual({ open: false, opensDay: null, opensAt: null })
  })
})
