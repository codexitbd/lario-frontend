import { describe, expect, it } from 'vitest'
import home from '@/content/home.json'
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

  it('references six featured dishes on featured_dishes', () => {
    const featured = home.sections.find((s) => s.type === 'featured_dishes')
    expect(featured?.payload.item_slugs).toHaveLength(6)
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
