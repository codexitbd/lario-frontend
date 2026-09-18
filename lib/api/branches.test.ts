import { describe, expect, it } from 'vitest'
// Cached wrappers in `@/lib/api/branches` throw under Vitest (no real Next.js
// render context for cacheTag()/cacheLife()) — see lib/api/menu.test.ts and
// task-11-report.md. This exercises the pure mapping directly.
import { getBranch, getBranches, toSchemaOpeningHours } from '@/lib/api/branches.impl'
import { branchSchema } from '@/lib/schemas'

describe('getBranches', () => {
  it('returns both branches satisfying the contract shape', () => {
    const branches = getBranches('en')
    expect(branches).toHaveLength(2)
    for (const branch of branches) {
      expect(() => branchSchema.parse(branch)).not.toThrow()
    }
  })

  it('maps flat lat/lng into nested coordinates', () => {
    const [narjis] = getBranches('en')
    expect(narjis.coordinates).toEqual({ latitude: 24.8305, longitude: 46.6362 })
  })

  it('maps facility slugs to {slug, label} pairs using the locale label map', () => {
    const [narjis] = getBranches('en')
    expect(narjis.facilities).toContainEqual({
      slug: 'valet',
      label: 'Valet parking',
    })
    const [narjisAr] = getBranches('ar')
    expect(narjisAr.facilities).toContainEqual({
      slug: 'valet',
      label: 'خدمة صف السيارات',
    })
  })

  it('resolves popular_dish_slugs into full MenuItemCards from the menu fixture', () => {
    const [narjis] = getBranches('en')
    expect(narjis.popular_dishes.map((d) => d.slug)).toEqual([
      'assado-argentina-style',
      'pizza-la-rio-signature',
      'urfa-kebab',
    ])
    for (const dish of narjis.popular_dishes) {
      expect(dish.name.length).toBeGreaterThan(0)
      expect(dish.price).toMatch(/^\d+\.\d{2}$/)
    }
  })

  it('computes an authoritative branch url', () => {
    const [narjis] = getBranches('en')
    expect(narjis.url).toBe('/branches/narjis')
  })
})

describe('getBranch', () => {
  it('returns null for an unknown slug', () => {
    expect(getBranch('en', 'no-such-branch')).toBeNull()
  })

  it('returns the matching branch detail', () => {
    const branch = getBranch('en', 'al-yasmin')
    expect(branch).not.toBeNull()
    expect(branch!.name).toBe('La Rio Al Yasmin')
  })
})

describe('toSchemaOpeningHours', () => {
  it('formats open days and drops closed ones', () => {
    const hours = [
      { day_of_week: 0, opens_at: '12:00', closes_at: '23:30', is_closed: false },
      { day_of_week: 1, opens_at: null, closes_at: null, is_closed: true },
    ]
    expect(toSchemaOpeningHours(hours)).toEqual(['Su 12:00-23:30'])
  })
})
