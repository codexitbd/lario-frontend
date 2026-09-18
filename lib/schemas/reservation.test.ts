import { describe, expect, it } from 'vitest'
import { reservationSchema } from '@/lib/schemas/reservation'

function inFuture(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

const valid = {
  branch_slug: 'narjis',
  guest_name: 'Nouf Alharbi',
  guest_email: 'nouf@example.com',
  guest_phone: '+966512345678',
  whatsapp: '+966512345678',
  party_size: 4,
  reserved_for: inFuture(7),
  occasion: 'anniversary',
  seating_preference: 'indoor',
  notes: 'Window table if possible.',
  consent: true,
  locale: 'en',
}

describe('reservationSchema', () => {
  it('accepts a complete valid request', () => {
    expect(() => reservationSchema.parse(valid)).not.toThrow()
  })

  it('rejects an unknown branch', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, branch_slug: 'jeddah' }),
    ).toThrow()
  })

  it('rejects a past date', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, reserved_for: inFuture(-1) }),
    ).toThrow()
  })

  it('rejects a date beyond 90 days', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, reserved_for: inFuture(91) }),
    ).toThrow()
  })

  it('bounds party size to 1-20', () => {
    expect(() => reservationSchema.parse({ ...valid, party_size: 0 })).toThrow()
    expect(() => reservationSchema.parse({ ...valid, party_size: 21 })).toThrow()
  })

  it('requires E.164 phone format', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, guest_phone: '0512345678' }),
    ).toThrow()
  })

  it('requires consent to be true', () => {
    expect(() => reservationSchema.parse({ ...valid, consent: false })).toThrow()
  })

  it('allows whatsapp and notes to be omitted', () => {
    const { whatsapp: _w, notes: _n, ...rest } = valid
    expect(() => reservationSchema.parse(rest)).not.toThrow()
  })
})
