import { describe, expect, it } from 'vitest'
import {
  breadcrumbJsonLd,
  faqJsonLd,
  localBusinessJsonLd,
  MENU_DATA_IS_VERIFIED,
  menuItemJsonLd,
  restaurantJsonLd,
} from '@/lib/seo/json-ld'
import type { Branch, MenuItem, Seo } from '@/lib/schemas'

// Rating/review terms must never appear in any JSON-LD this module emits —
// testimonials are CMS-entered and self-served, so marking them up as star
// ratings is a Google manual-action risk (02-database-schema.md).
const FORBIDDEN_TERMS = /review|rating/i

const seo: Seo = {
  title: 'Test Dish | La Rio Riyadh',
  description: 'A dish for testing.',
  canonical: 'https://lario.sa/menu/mains/test-dish',
  robots: 'index,follow',
  og: {
    title: 'Test Dish',
    description: 'A dish for testing.',
    image: 'https://lario.sa/images/og/test-dish.jpg',
    type: 'article',
  },
  twitter: { card: 'summary_large_image' },
  alternates: {
    en: 'https://lario.sa/menu/mains/test-dish',
    ar: 'https://lario.sa/ar/menu/mains/test-dish',
  },
  schema_enabled: true,
}

const item: MenuItem = {
  slug: 'test-dish',
  name: 'Test Dish',
  short_description: 'A dish for testing.',
  price: '42.00',
  currency: 'SAR',
  calories: 650,
  image: 'https://lario.sa/images/test-dish.jpg',
  dietary_tags: ['vegetarian'],
  is_available: true,
  category: { slug: 'mains', name: 'Mains' },
  url: '/menu/mains/test-dish',
  description: 'A longer description of the test dish.',
  ingredients_note: null,
  preparation_note: null,
  allergens: [],
  seo,
  related: [],
}

const branch: Branch = {
  slug: 'narjis',
  name: 'La Rio Narjis',
  tagline: 'Riyadh, first branch',
  address: '123 Test Street',
  city: 'Riyadh',
  story: 'A branch for testing.',
  directions_note: null,
  phone: '+966500000000',
  whatsapp: null,
  email: 'narjis@lario.sa',
  coordinates: { latitude: 24.8305, longitude: 46.6362 },
  google_maps_url: 'https://maps.google.com/?q=lario-narjis',
  google_place_id: null,
  hero_image: null,
  gallery: [],
  facilities: [],
  opening_hours: [
    { day_of_week: 0, opens_at: '12:00', closes_at: '23:30', is_closed: false },
    { day_of_week: 1, opens_at: '12:00', closes_at: '23:30', is_closed: false },
    { day_of_week: 2, opens_at: '12:00', closes_at: '23:30', is_closed: false },
    { day_of_week: 3, opens_at: '12:00', closes_at: '23:30', is_closed: false },
    { day_of_week: 4, opens_at: '12:00', closes_at: '23:30', is_closed: false },
    { day_of_week: 5, opens_at: '13:00', closes_at: '01:00', is_closed: false },
    { day_of_week: 6, opens_at: '13:00', closes_at: '01:00', is_closed: false },
  ],
  schema_opening_hours: ['Su-Th 12:00-23:30', 'Fr-Sa 13:00-01:00'],
  popular_dishes: [],
  faq: [],
  url: '/branches/narjis',
  seo,
}

describe('breadcrumbJsonLd', () => {
  it('numbers positions from 1', () => {
    const ld = breadcrumbJsonLd([
      { name: 'Menu', url: 'https://lario.sa/menu' },
      { name: 'Pizza', url: 'https://lario.sa/menu/pizza' },
    ])
    expect(ld['@type']).toBe('BreadcrumbList')
    expect(ld.itemListElement[0].position).toBe(1)
    expect(ld.itemListElement[1].position).toBe(2)
  })
})

describe('faqJsonLd', () => {
  it('emits one Question per pair', () => {
    const ld = faqJsonLd([{ q: 'Do you take walk-ins?', a: 'Yes.' }])
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity).toHaveLength(1)
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('Yes.')
  })
})

describe('menuItemJsonLd', () => {
  it('omits offers and nutrition while MENU_DATA_IS_VERIFIED is false — price and calories are placeholder data', () => {
    expect(MENU_DATA_IS_VERIFIED).toBe(false)
    const ld = menuItemJsonLd(item, 'en')
    expect(ld['@type']).toBe('MenuItem')
    expect(ld.offers).toBeUndefined()
    expect(ld.nutrition).toBeUndefined()
    expect(JSON.stringify(ld)).not.toMatch(FORBIDDEN_TERMS)
  })

  it('maps a single dietary tag to its schema.org diet URL', () => {
    const ld = menuItemJsonLd({ ...item, dietary_tags: ['halal'] }, 'en')
    expect(ld.suitableForDiet).toBe('https://schema.org/HalalDiet')
  })

  it('maps several dietary tags to an array of diet URLs, halal included', () => {
    const ld = menuItemJsonLd(
      { ...item, dietary_tags: ['vegetarian', 'halal'] },
      'en',
    )
    expect(ld.suitableForDiet).toEqual([
      'https://schema.org/VegetarianDiet',
      'https://schema.org/HalalDiet',
    ])
  })

  it('omits suitableForDiet when no tag has a schema.org diet equivalent (e.g. spicy alone)', () => {
    const ld = menuItemJsonLd({ ...item, dietary_tags: ['spicy'] }, 'en')
    expect(ld.suitableForDiet).toBeUndefined()
  })

  it('omits suitableForDiet when there are no dietary tags at all', () => {
    const ld = menuItemJsonLd({ ...item, dietary_tags: [] }, 'en')
    expect(ld.suitableForDiet).toBeUndefined()
  })
})

describe('localBusinessJsonLd', () => {
  it('carries the pre-formatted schema_opening_hours through unchanged', () => {
    const ld = localBusinessJsonLd(branch)
    expect(ld['@type']).toBe('Restaurant')
    expect(ld.openingHours).toEqual(['Su-Th 12:00-23:30', 'Fr-Sa 13:00-01:00'])
    expect(ld.geo).toEqual({
      '@type': 'GeoCoordinates',
      latitude: 24.8305,
      longitude: 46.6362,
    })
    expect(JSON.stringify(ld)).not.toMatch(FORBIDDEN_TERMS)
  })
})

describe('restaurantJsonLd', () => {
  it('nests every branch as a location and carries no rating fields', () => {
    const ld = restaurantJsonLd({
      name: 'La Rio',
      description: 'A Riyadh restaurant.',
      url: 'https://lario.sa',
      image: 'https://lario.sa/images/og/home.jpg',
      branches: [branch],
    })
    expect(ld['@type']).toBe('Restaurant')
    expect(ld.location).toHaveLength(1)
    expect(ld.location[0]['@type']).toBe('Restaurant')
    expect(JSON.stringify(ld)).not.toMatch(FORBIDDEN_TERMS)
  })
})
