import type { MenuItemCard } from '@/lib/schemas'

/**
 * The menu page's filter rules, kept out of the component so they can be
 * tested without a DOM. The component owns the URL and the markup; this owns
 * what counts as a match.
 *
 * Bands, not a slider: three legible choices beat a control nobody drags.
 * Thresholds are in the menu's own currency units and are half-open — an item
 * priced exactly at a boundary belongs to the band above, so no dish can fall
 * into two bands or none.
 */
export const PRICE_BANDS = [
  { id: 'under', min: 0, max: 100 },
  { id: 'mid', min: 100, max: 200 },
  { id: 'over', min: 200, max: Number.POSITIVE_INFINITY },
] as const

export type BandId = (typeof PRICE_BANDS)[number]['id']

export type Filters = {
  query: string
  diet: string | null
  band: BandId | null
}

export const EMPTY_FILTERS: Filters = { query: '', diet: null, band: null }

export function parseFilters(params: URLSearchParams): Filters {
  const band = params.get('price')
  return {
    query: params.get('q') ?? '',
    diet: params.get('diet'),
    // An unknown ?price= is ignored rather than filtering everything away: a
    // mangled shared link should show the menu, not an empty state.
    band: PRICE_BANDS.some((b) => b.id === band) ? (band as BandId) : null,
  }
}

export function toSearchParams(filters: Filters): string {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.diet) params.set('diet', filters.diet)
  if (filters.band) params.set('price', filters.band)
  return params.toString()
}

export function hasAnyFilter(filters: Filters): boolean {
  return Boolean(filters.query || filters.diet || filters.band)
}

export function matchesFilters(
  item: MenuItemCard,
  filters: Filters,
): boolean {
  const needle = filters.query.trim().toLowerCase()
  if (needle) {
    const haystack =
      `${item.name} ${item.short_description ?? ''} ${item.category.name}`.toLowerCase()
    if (!haystack.includes(needle)) return false
  }

  if (filters.diet && !item.dietary_tags.includes(filters.diet as never)) {
    return false
  }

  const band = PRICE_BANDS.find((b) => b.id === filters.band)
  if (band) {
    // Prices are decimal strings and are never parsed for DISPLAY. This is a
    // comparison, not a rendered value, so Number() is safe here — and it is
    // nowhere near formatPrice, which is the rule that matters.
    const value = Number(item.price)
    if (value < band.min || value >= band.max) return false
  }

  return true
}
