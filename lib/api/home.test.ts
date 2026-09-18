import { describe, expect, it } from 'vitest'
// Cached wrapper `@/lib/api/home` throws under Vitest — see lib/api/menu.test.ts.
import { getHome } from '@/lib/api/home.impl'
import { homeSchema } from '@/lib/schemas'

describe('getHome', () => {
  it('satisfies the contract shape', () => {
    const home = getHome('en')
    expect(() => homeSchema.parse(home)).not.toThrow()
    expect(home.sections).toHaveLength(11)
  })

  it('resolves featured_dishes item_slugs into MenuItemCard[] via getFeaturedItems', () => {
    const home = getHome('en')
    const featured = home.sections.find((s) => s.type === 'featured_dishes')
    expect(featured?.items).toHaveLength(6)
    expect(featured?.items?.[0].slug).toBe('assado-argentina-style')
  })

  it('resolves branch_cards branch_slugs into branch cards, in payload order', () => {
    const home = getHome('en')
    const cards = home.sections.find((s) => s.type === 'branch_cards')
    const branches = cards?.content.branches as { slug: string }[]
    expect(branches.map((b) => b.slug)).toEqual(['narjis', 'al-yasmin'])
  })

  it('maps translations.{locale} into a resolved content field', () => {
    const home = getHome('en')
    const hero = home.sections.find((s) => s.type === 'hero')
    expect(hero?.content.heading).toBe(
      'Italian, Turkish and Argentinian Dining in Riyadh',
    )
    const homeAr = getHome('ar')
    const heroAr = homeAr.sections.find((s) => s.type === 'hero')
    expect(heroAr?.content.heading).toBe('مطبخ إيطالي وتركي وأرجنتيني في الرياض')
  })

  it('builds seo from the fixture top-level seo.{locale} block, not the hero copy', () => {
    const home = getHome('en')
    expect(home.seo.title).toContain('La Rio Restaurant Riyadh')
    expect(home.seo.title).not.toContain('Italian, Turkish and Argentinian Dining')
    expect(home.seo.description).toBe(
      'Italian, Turkish and Argentine dining in Al Narjis and Al Yasmin. Handmade pasta, wood-fired pizza and charcoal grills. Reserve a table.',
    )
    expect(home.seo.canonical).toBe('https://lario.sa/')

    const homeAr = getHome('ar')
    expect(homeAr.seo.title).toContain('مطعم لا ريو الرياض')
    expect(homeAr.seo.canonical).toBe('https://lario.sa/ar')
  })
})
