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
export function menuItemJsonLd(item: MenuItem, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: item.name,
    description: item.description,
    image: item.image ?? undefined,
    offers: {
      '@type': 'Offer',
      price: item.price,
      priceCurrency: item.currency,
    },
    nutrition: item.calories
      ? {
          '@type': 'NutritionInformation',
          calories: `${formatCalories(item.calories, locale)} calories`,
        }
      : undefined,
    suitableForDiet: item.dietary_tags.includes('vegetarian')
      ? 'https://schema.org/VegetarianDiet'
      : undefined,
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
