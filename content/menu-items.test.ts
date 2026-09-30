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
      // Presence is not purity: a bare "contains Arabic" test passes on a
      // half-transliterated name like "Fettuccine \u0623\u0644\u0641\u0631\u064a\u062f\u0648" — exactly the defect
      // class this guard exists for. Assert BOTH that Arabic is present and that
      // no Latin letter survives. Digits, parentheses and punctuation stay legal,
      // since names like "(4 \u0623\u0634\u062e\u0627\u0635)" are legitimate.
      expect(item.translations.ar.name).toMatch(/[\u0600-\u06FF]/)
      expect(item.translations.ar.name).not.toMatch(/[A-Za-z]/)
    }
  })

  it('points at an image that exists on disk', async () => {
    const { existsSync } = await import('node:fs')
    for (const item of items) {
      expect(existsSync(`public${item.image}`)).toBe(true)
    }
  })

  // is_featured has exactly one consumer: cascadeForMenuItem pushes the `home`
  // tag for a featured dish and not for any other. So the flag means "the
  // homepage names this dish", and the assertion reads it out of the homepage
  // fixture rather than restating the list. Drift either way is a real bug —
  // a flag the homepage does not name revalidates the homepage for nothing, and
  // a homepage dish without the flag leaves the homepage stale after an edit.
  it('flags exactly the dishes the homepage fixture names, for the cache cascade', async () => {
    const home = (await import('@/content/home.json')).default
    const section = home.sections.find((s) => s.type === 'featured_dishes')
    const named = new Set(
      (section?.payload as { item_slugs: string[] }).item_slugs,
    )
    const featured = items.filter((i) => i.is_featured)
    expect(new Set(featured.map((i) => i.slug))).toEqual(named)
    expect(new Set(featured.map((i) => i.category_slug)).size).toBe(named.size)
  })
})
