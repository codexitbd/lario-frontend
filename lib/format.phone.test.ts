import { describe, expect, it } from 'vitest'
import { formatPhone } from '@/lib/format'
import settings from '@/content/settings.json'
import branches from '@/content/branches.json'

describe('formatPhone', () => {
  it('groups a Saudi landline 2-3-4', () => {
    expect(formatPhone('+966112345678')).toBe('+966 11 234 5678')
  })

  it('groups a Saudi mobile the same way', () => {
    expect(formatPhone('+966512345678')).toBe('+966 51 234 5678')
  })

  it('tolerates separators already present in the input', () => {
    expect(formatPhone('+966 11 234 5678')).toBe('+966 11 234 5678')
  })

  it('returns anything it does not recognise untouched', () => {
    // Better an unformatted number than one grouped by the wrong country's
    // rules, which would read as a different number.
    expect(formatPhone('+14155550123')).toBe('+14155550123')
    expect(formatPhone('+96611')).toBe('+96611')
    expect(formatPhone('')).toBe('')
  })

  it('formats every number the fixtures actually carry', () => {
    const numbers = [
      settings.contact.phone,
      settings.contact.whatsapp,
      ...branches.flatMap((b) => [b.phone, b.whatsapp]),
    ].filter((n): n is string => Boolean(n))

    expect(numbers.length).toBeGreaterThan(0)
    for (const n of numbers) {
      expect(formatPhone(n), n).toMatch(/^\+966 \d{2} \d{3} \d{4}$/)
    }
  })
})
