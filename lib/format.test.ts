import { describe, expect, it } from 'vitest'
import {
  formatCalories,
  formatDateTime,
  formatPrice,
  formatTimeRange,
} from '@/lib/format'

// ICU separates a currency marker from its amount with a NON-BREAKING space
// (U+00A0) and wraps Arabic currency in directional marks (U+200E/U+200F).
// Both are correct output — an NBSP stops a price wrapping across lines. These
// assertions are about digits and amounts, not glyph spacing, so normalise the
// invisibles rather than hardcoding them and making the tests brittle across
// ICU versions.
const norm = (value: string): string =>
  value.replace(/ /g, ' ').replace(/[‎‏]/g, '').trim()

describe('formatPrice', () => {
  it('formats SAR in English', () => {
    expect(norm(formatPrice('189.00', 'SAR', 'en'))).toBe('SAR 189')
  })

  it('uses Latin digits in Arabic', () => {
    const result = formatPrice('189.00', 'SAR', 'ar')
    expect(result).toContain('189')
    expect(result).not.toContain('١٨٩')
  })

  it('keeps meaningful decimals', () => {
    expect(norm(formatPrice('189.50', 'SAR', 'en'))).toBe('SAR 189.5')
  })

  it('never loses precision on large decimal strings', () => {
    expect(norm(formatPrice('12345678901234567890.99', 'SAR', 'en'))).toBe(
      'SAR 12,345,678,901,234,567,890.99',
    )
  })
})

describe('formatCalories', () => {
  it('formats with a thousands separator in both locales', () => {
    expect(formatCalories(1820, 'en')).toBe('1,820')
    expect(formatCalories(1820, 'ar')).toContain('1,820')
  })
})

describe('formatDateTime', () => {
  it('renders in Asia/Riyadh regardless of the input offset', () => {
    expect(formatDateTime('2026-10-04T17:30:00Z', 'en')).toContain('8:30')
  })

  it('uses Latin digits and the Gregorian calendar in Arabic', () => {
    const result = formatDateTime('2026-10-04T17:30:00+00:00', 'ar')
    expect(result).toContain('2026')
    expect(result).not.toContain('٢٠٢٦')
  })
})

describe('formatTimeRange', () => {
  it('joins two times with an en dash', () => {
    expect(formatTimeRange('12:00', '23:30', 'en')).toBe('12:00 PM – 11:30 PM')
  })
})
