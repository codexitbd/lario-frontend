import { formatCalories } from '@/lib/format'
import type { Locale } from '@/lib/i18n/config'
import type { Branch, MenuItem, Settings } from '@/lib/schemas'
import { absoluteUrl } from '@/content/seo-defaults'

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
    ...(branch.coordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: branch.coordinates.latitude,
        longitude: branch.coordinates.longitude,
      },
    }),
    openingHours: branch.schema_opening_hours,
    servesCuisine: ['Italian', 'Turkish', 'Argentinian'],
    hasMap: branch.google_maps_url,
  }
}

/** The site-wide Restaurant fields that come from Settings, for restaurantJsonLd. */
export function restaurantSettingsFields(settings: Settings, locale: Locale) {
  return {
    telephone: settings.contact.landline ?? settings.contact.phone,
    // English paths carry no locale prefix, which is what a file in public/ needs.
    logo: settings.branding.logo ?? absoluteUrl('en', '/original-logo.png'),
    sameAs: settings.socials.map((social) => social.url),
    menuUrl: absoluteUrl(locale, '/menu'),
    reserveUrl: absoluteUrl(locale, '/reservation'),
  }
}

export function restaurantJsonLd(input: {
  name: string
  description: string
  url: string
  // Nullable, matching seo.og.image and settings.seo_defaults.og_image. No
  // hero photograph and no default social card exist yet (content gaps 8 and
  // 10), and `"image": ""` is not a weaker assertion than omitting the key —
  // it is an invalid one. The property is dropped instead.
  image: string | null
  branches: Branch[]
  /** The reservation page. Emits a ReserveAction, which is the schema.org
      type for "you can book here". No Reservation entity is ever emitted:
      on a static page that would assert a booking that does not exist. */
  reserveUrl?: string
  /** The rest of QA round 2 B-14, all from Settings. No priceRange: there is
      no admin field for it, and inventing one is a price claim. */
  telephone?: string | null
  logo?: string | null
  sameAs?: string[]
  menuUrl?: string
}) {
  // Google wants an image on a Restaurant; until the share image exists the
  // logo stands in rather than dropping the property.
  const image = input.image ?? input.logo
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: input.name,
    description: input.description,
    url: input.url,
    ...(image ? { image } : {}),
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    ...(input.menuUrl ? { hasMenu: input.menuUrl } : {}),
    servesCuisine: ['Italian', 'Turkish', 'Argentinian'],
    location: input.branches.map((branch) => localBusinessJsonLd(branch)),
    ...(input.reserveUrl
      ? {
          acceptsReservations: input.reserveUrl,
          potentialAction: {
            '@type': 'ReserveAction',
            target: input.reserveUrl,
          },
        }
      : {}),
  }
}
