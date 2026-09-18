import { describe, expect, it } from 'vitest'
import items from '@/content/menu-items.json'
import categories from '@/content/menu-categories.json'
import { DIETARY_TAGS, ALLERGENS, DECIMAL_STRING } from '@/lib/schemas'
import { LOCALES } from '@/lib/i18n/config'

const categorySlugs = new Set(categories.map((c) => c.slug))

describe('menu-items fixture', () => {
  it('has 89 items with unique slugs', () => {
    expect(items).toHaveLength(89)
    expect(new Set(items.map((i) => i.slug)).size).toBe(89)
  })

  it('assigns every item to a real category', () => {
    for (const item of items) {
      expect(categorySlugs.has(item.category_slug)).toBe(true)
    }
  })

  it('prices every item as a decimal string above zero', () => {
    for (const item of items) {
      expect(item.price).toMatch(DECIMAL_STRING)
      expect(item.price).not.toBe('0.00')
    }
  })

  it('uses only known dietary tags and allergens', () => {
    for (const item of items) {
      for (const tag of item.dietary_tags) {
        expect(DIETARY_TAGS).toContain(tag)
      }
      for (const allergen of item.allergens) {
        expect(ALLERGENS).toContain(allergen)
      }
    }
  })

  it('carries a real name in both locales', () => {
    for (const item of items) {
      for (const locale of LOCALES) {
        expect(item.translations[locale].name.length).toBeGreaterThan(0)
      }
      expect(item.translations.ar.name).toMatch(/[؀-ۿ]/)
    }
  })

  it('points at an image that exists on disk', async () => {
    const { existsSync } = await import('node:fs')
    for (const item of items) {
      expect(existsSync(`public${item.image}`)).toBe(true)
    }
  })

  it('features exactly 6 dishes spanning at least 4 categories', () => {
    const featured = items.filter((i) => i.is_featured)
    expect(featured).toHaveLength(6)
    expect(new Set(featured.map((i) => i.category_slug)).size).toBeGreaterThanOrEqual(4)
  })
})
