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
    // Four naming tiles in reference 02-featured-dishes; see content/home.test.ts.
    expect(featured?.items).toHaveLength(4)
    expect(featured?.items?.[0].slug).toBe('assado-argentina-style')
  })

  it('resolves branch_cards branch_slugs into branch cards, in payload order', () => {
    const home = getHome('en')
    const cards = home.sections.find((s) => s.type === 'branch_cards')
    const branches = cards?.content.branches as { slug: string }[]
    expect(branches.map((b) => b.slug)).toEqual(['narjis', 'al-yasmin'])
  })

  it('resolves the testimonials section through getTestimonials, honouring testimonial_limit', () => {
    const home = getHome('en')
    const section = home.sections.find((s) => s.type === 'testimonials')
    const reviews = section?.content.testimonials as { body: string }[]
    const limit = section?.payload.testimonial_limit as number
    expect(limit).toBeGreaterThan(0)
    expect(reviews).toHaveLength(limit)
    expect(reviews[0].body.length).toBeGreaterThan(0)
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
    // EXACT, not `toContain`. A contains-assertion passed happily while the
    // fixture carried the brand and buildSeo appended it again, emitting
    // "La Rio Restaurant Riyadh | La Rio Riyadh" on every load. The fixture
    // supplies the descriptor; the suffix supplies the brand; once each.
    expect(home.seo.title).toBe(
      'Italian, Turkish & Argentine Dining | La Rio Riyadh',
    )
    expect(home.seo.title.match(/La Rio/g)).toHaveLength(1)
    expect(home.seo.title).not.toContain('Italian, Turkish and Argentinian Dining')
    expect(home.seo.description).toBe(
      'Italian, Turkish and Argentine dining in Al Narjis and Al Yasmin. Handmade pasta, wood-fired pizza and charcoal grills. Reserve a table.',
    )
    expect(home.seo.canonical).toBe('https://lario.sa/')

    const homeAr = getHome('ar')
    expect(homeAr.seo.title).toBe('مطعم إيطالي وتركي وأرجنتيني | لا ريو الرياض')
    // The suffix is per-locale precisely so an Arabic <title> does not carry
    // Latin brand text. Any Latin letter here is the bug coming back.
    expect(homeAr.seo.title).not.toMatch(/[A-Za-z]/)
    expect(homeAr.seo.canonical).toBe('https://lario.sa/ar')
  })
})
