import { describe, expect, it } from 'vitest'
import home from '@/content/home.json'
import menuItems from '@/content/menu-items.json'
import { SECTION_TYPES } from '@/lib/schemas'
import { LOCALES } from '@/lib/i18n/config'

describe('home fixture', () => {
  it('has all 11 approved section types exactly once', () => {
    const types = home.sections.map((s) => s.type)
    expect(types).toHaveLength(11)
    expect(new Set(types).size).toBe(11)
    for (const type of SECTION_TYPES) {
      expect(types).toContain(type)
    }
  })

  it('orders sections by sort_order starting at zero', () => {
    const orders = home.sections.map((s) => s.sort_order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    expect(orders[0]).toBe(0)
  })

  it('opens with hero and closes with reservation_cta', () => {
    expect(home.sections[0].type).toBe('hero')
    expect(home.sections.at(-1)?.type).toBe('reservation_cta')
  })

  it('carries translated content for every section in both locales', () => {
    for (const section of home.sections) {
      for (const locale of LOCALES) {
        expect(section.translations[locale]).toBeDefined()
        expect(section.translations[locale].heading.length).toBeGreaterThan(0)
      }
    }
  })

  // Eight, and the count is load-bearing rather than editorial. The section
  // shows FOUR at a time and the carousel advances one card at a time, so a
  // fixture of four would rotate the same four dishes through the same four
  // slots and the motion would carry no new information. D8 amended twice: 6,
  // then 4 for the mosaic, now 8 for the filmstrip that replaced it.
  it('references eight featured dishes on featured_dishes', () => {
    const featured = home.sections.find((s) => s.type === 'featured_dishes')
    expect(featured?.payload.item_slugs).toHaveLength(8)
  })

  // D8's actual intent was internal links into distinct category pages, and it
  // is better served than it has ever been: eight dishes, eight of the nine
  // courses, all three cuisines.
  it('spans eight distinct courses so the links reach eight categories', () => {
    const featured = home.sections.find((s) => s.type === 'featured_dishes')
    const slugs = featured?.payload.item_slugs as string[]
    const categories = slugs.map(
      (slug) => menuItems.find((item) => item.slug === slug)?.category_slug,
    )
    expect(categories.every(Boolean)).toBe(true)
    expect(new Set(categories).size).toBe(8)
    const cuisines = slugs.map(
      (slug) => menuItems.find((item) => item.slug === slug)?.cuisine,
    )
    expect(new Set(cuisines).size).toBe(3)
  })

  it('references both branches on branch_cards', () => {
    const cards = home.sections.find((s) => s.type === 'branch_cards')
    expect(cards?.payload.branch_slugs).toEqual(['narjis', 'al-yasmin'])
  })

  it('carries at least four FAQ pairs in both locales', () => {
    const faq = home.sections.find((s) => s.type === 'faq')
    for (const locale of LOCALES) {
      expect(faq?.translations[locale].items!.length).toBeGreaterThanOrEqual(4)
    }
  })
})
