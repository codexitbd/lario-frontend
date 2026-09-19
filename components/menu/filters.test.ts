import { describe, expect, it } from 'vitest'
import {
  EMPTY_FILTERS,
  hasAnyFilter,
  matchesFilters,
  parseFilters,
  toSearchParams,
  type Filters,
} from '@/components/menu/filters'
import type { MenuItemCard } from '@/lib/schemas'

function dish(overrides: Partial<MenuItemCard> = {}): MenuItemCard {
  return {
    slug: 'urfa-kebab',
    name: 'Urfa Kebab',
    short_description: 'Charcoal-grilled lamb with sumac onions.',
    price: '98.00',
    currency: 'SAR',
    calories: 640,
    image: null,
    dietary_tags: ['halal'],
    is_available: true,
    category: { slug: 'kebabs-and-skewers', name: 'Kebabs & Skewers' },
    url: '/menu/kebabs-and-skewers/urfa-kebab',
    ...overrides,
  }
}

function filters(overrides: Partial<Filters> = {}): Filters {
  return { ...EMPTY_FILTERS, ...overrides }
}

describe('parseFilters', () => {
  it('reads all three filters off the query string', () => {
    const parsed = parseFilters(
      new URLSearchParams('q=kebab&diet=halal&price=mid'),
    )
    expect(parsed).toEqual({ query: 'kebab', diet: 'halal', band: 'mid' })
  })

  // A mangled shared link should show the menu, not an empty state.
  it('ignores an unknown price band rather than filtering everything away', () => {
    expect(parseFilters(new URLSearchParams('price=cheap')).band).toBeNull()
  })

  it('round-trips through toSearchParams', () => {
    const original = filters({ query: 'asado', diet: 'halal', band: 'over' })
    expect(parseFilters(new URLSearchParams(toSearchParams(original)))).toEqual(
      original,
    )
  })

  it('serialises an empty filter set to an empty string', () => {
    expect(toSearchParams(EMPTY_FILTERS)).toBe('')
    expect(hasAnyFilter(EMPTY_FILTERS)).toBe(false)
  })
})

describe('matchesFilters', () => {
  it('keeps everything when nothing is filtered', () => {
    expect(matchesFilters(dish(), EMPTY_FILTERS)).toBe(true)
  })

  it('searches name, description and course, case-insensitively', () => {
    expect(matchesFilters(dish(), filters({ query: 'URFA' }))).toBe(true)
    expect(matchesFilters(dish(), filters({ query: 'sumac' }))).toBe(true)
    expect(matchesFilters(dish(), filters({ query: 'skewers' }))).toBe(true)
    expect(matchesFilters(dish(), filters({ query: 'tiramisu' }))).toBe(false)
  })

  it('ignores surrounding whitespace in the query', () => {
    expect(matchesFilters(dish(), filters({ query: '  kebab  ' }))).toBe(true)
  })

  it('survives a dish with no short description', () => {
    const bare = dish({ short_description: null })
    expect(matchesFilters(bare, filters({ query: 'urfa' }))).toBe(true)
    expect(matchesFilters(bare, filters({ query: 'sumac' }))).toBe(false)
  })

  it('filters on a dietary tag', () => {
    expect(matchesFilters(dish(), filters({ diet: 'halal' }))).toBe(true)
    expect(matchesFilters(dish(), filters({ diet: 'vegan' }))).toBe(false)
  })

  // Half-open bands: a dish priced exactly on a boundary must land in exactly
  // one band, never both and never neither.
  it('puts a boundary price in the band above, not below', () => {
    const boundary = dish({ price: '100.00' })
    expect(matchesFilters(boundary, filters({ band: 'under' }))).toBe(false)
    expect(matchesFilters(boundary, filters({ band: 'mid' }))).toBe(true)
  })

  it('assigns every band exactly once across a price sweep', () => {
    for (const price of ['0.00', '99.99', '100.00', '199.99', '200.00', '990.00']) {
      const item = dish({ price })
      const hits = (['under', 'mid', 'over'] as const).filter((band) =>
        matchesFilters(item, filters({ band })),
      )
      expect(hits, `price ${price} matched ${hits.length} bands`).toHaveLength(1)
    }
  })

  it('requires every active filter to pass, not any', () => {
    expect(
      matchesFilters(dish(), filters({ query: 'urfa', diet: 'vegan' })),
    ).toBe(false)
    expect(
      matchesFilters(dish(), filters({ query: 'urfa', band: 'over' })),
    ).toBe(false)
    expect(
      matchesFilters(
        dish(),
        filters({ query: 'urfa', diet: 'halal', band: 'under' }),
      ),
    ).toBe(true)
  })
})
