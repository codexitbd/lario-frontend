import branchesFixture from '@/content/branches.json'
import { buildSeo } from '@/content/seo-defaults'
import { resolveItemCards } from '@/lib/api/menu.impl'
import { resolveTranslation } from '@/lib/api/resolve'
import type { Locale } from '@/lib/i18n/config'
import type { Branch } from '@/lib/schemas'

const DAY_CODES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export function toSchemaOpeningHours(
  hours: {
    day_of_week: number
    opens_at: string | null
    closes_at: string | null
    is_closed: boolean
  }[],
): string[] {
  return hours
    .filter((h) => !h.is_closed && h.opens_at && h.closes_at)
    .map((h) => `${DAY_CODES[h.day_of_week]} ${h.opens_at}-${h.closes_at}`)
}

// The two branches carry different facility-slug sets, so each branch's
// `translations` object has its own literal `facilities_labels` shape and the
// fixture's array type is a union of them. Widen to the common shape we
// actually need at the call site rather than fighting the union.
type BranchTranslation = {
  name: string
  tagline: string
  address: string
  city: string
  directions_note: string | null
  story: string
  facilities_labels: Record<string, string>
  faq: { q: string; a: string }[]
}

// content/branches.json is a SOURCE fixture, not the wire shape: flat
// latitude/longitude, a facility-slug array plus a per-locale label map, and
// popular_dish_slugs, rather than branchSchema's coordinates/facilities[]/
// popular_dishes[]. This is where that mapping happens.
function toBranch(
  locale: Locale,
  branch: (typeof branchesFixture)[number],
): Branch {
  const t = resolveTranslation(
    branch.translations as Partial<Record<Locale, BranchTranslation>>,
    locale,
  )
  const labels = t.facilities_labels
  const path = `/branches/${branch.slug}`

  return {
    slug: branch.slug as Branch['slug'],
    name: t.name,
    tagline: t.tagline,
    address: t.address,
    city: t.city,
    story: t.story,
    directions_note: t.directions_note ?? null,
    phone: branch.phone,
    whatsapp: branch.whatsapp ?? null,
    email: branch.email,
    coordinates: { latitude: branch.latitude, longitude: branch.longitude },
    google_maps_url: branch.google_maps_url ?? null,
    google_place_id: branch.google_place_id ?? null,
    hero_image: branch.hero_image ?? null,
    gallery: branch.gallery,
    facilities: branch.facilities.map((slug) => ({ slug, label: labels[slug] })),
    opening_hours: branch.opening_hours as Branch['opening_hours'],
    schema_opening_hours: toSchemaOpeningHours(branch.opening_hours),
    popular_dishes: resolveItemCards(locale, branch.popular_dish_slugs),
    faq: t.faq,
    url: path,
    seo: buildSeo({
      title: t.name,
      description: t.tagline,
      path,
      locale,
      image: branch.hero_image,
    }),
  }
}

export function getBranches(locale: Locale): Branch[] {
  return branchesFixture
    .filter((b) => b.is_active)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((branch) => toBranch(locale, branch))
}

export function getBranch(locale: Locale, slug: string): Branch | null {
  const branch = branchesFixture.find((b) => b.slug === slug && b.is_active)
  return branch ? toBranch(locale, branch) : null
}
