import { formatCalories } from '@/lib/format'
import type { Locale } from '@/lib/i18n/config'
import type { Branch, MenuItem } from '@/lib/schemas'

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

// No star-rating schema.org markup (the schema.org Review type, or its
// Aggregate Rating companion) anywhere in this module: testimonials are
// CMS-entered, and self-served rating markup is a Google manual-action risk
// (02-database-schema.md). Testimonials are displayed only, never marked up.

// Every price and calorie value in this project is invented placeholder data —
// the client has supplied none (content-gap items 2 and 3). JSON-LD is a
// machine-readable assertion to search engines, not UI copy: a fabricated price
// can be surfaced in Search and Maps before any human reviews the page, and
// markup that does not reflect real content violates Google's structured-data
// policy. So the commercial claims are gated OFF until real data lands. Flip
// this one constant when the client's menu data is in — nothing else changes.
export const MENU_DATA_IS_VERIFIED = false

// schema.org diet URLs for the tags the CMS can produce. "spicy" is deliberately
// absent: it is a preparation style, not a dietary restriction, and has no
// schema.org RestrictedDiet equivalent.
const DIET_URLS: Partial<Record<string, string>> = {
  vegetarian: 'https://schema.org/VegetarianDiet',
  vegan: 'https://schema.org/VeganDiet',
  gluten_free: 'https://schema.org/GlutenFreeDiet',
  halal: 'https://schema.org/HalalDiet',
}

export function menuItemJsonLd(item: MenuItem, locale: Locale) {
  // An array when several apply, a bare string when one does, undefined when
  // none — all three are valid schema.org. The previous single-tag ternary
  // silently dropped every tag but vegetarian, including halal, which is the
  // contract's own example and the most common tag on this menu.
  const diets = item.dietary_tags
    .map((tag) => DIET_URLS[tag])
    .filter((url): url is string => Boolean(url))

  return {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: item.name,
    description: item.description,
    image: item.image ?? undefined,
    offers: MENU_DATA_IS_VERIFIED
      ? { '@type': 'Offer', price: item.price, priceCurrency: item.currency }
      : undefined,
    nutrition:
      MENU_DATA_IS_VERIFIED && item.calories
        ? {
            '@type': 'NutritionInformation',
            calories: `${formatCalories(item.calories, locale)} calories`,
          }
        : undefined,
    suitableForDiet:
      diets.length === 0 ? undefined : diets.length === 1 ? diets[0] : diets,
  }
}

// Consumes branch.schema_opening_hours verbatim — it is already formatted
// server-side for LocalBusiness JSON-LD (03-api-contract.md). Never
// reformat hours here; that logic lives in exactly one place so lario-api
// and lario-web cannot drift.
export function localBusinessJsonLd(branch: Branch) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: branch.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: branch.address,
      addressLocality: branch.city,
      addressCountry: 'SA',
    },
    telephone: branch.phone,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: branch.coordinates.latitude,
      longitude: branch.coordinates.longitude,
    },
    openingHours: branch.schema_opening_hours,
    servesCuisine: ['Italian', 'Turkish', 'Argentinian'],
    hasMap: branch.google_maps_url,
  }
}

export function restaurantJsonLd(input: {
  name: string
  description: string
  url: string
  image: string
  branches: Branch[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    servesCuisine: ['Italian', 'Turkish', 'Argentinian'],
    location: input.branches.map((branch) => localBusinessJsonLd(branch)),
  }
}
