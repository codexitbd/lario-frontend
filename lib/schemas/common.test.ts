import { describe, expect, it } from 'vitest'
import {
  SECTION_TYPES,
  branchSchema,
  imageUrlSchema,
  menuItemCardSchema,
  seoSchema,
} from '@/lib/schemas'

const validSeo = {
  title: 'Argentina Style Asado | La Rio Riyadh',
  description: 'Slow-grilled over open flame.',
  canonical: 'https://lario.sa/menu/grills/argentina-style-asado',
  robots: 'index,follow',
  og: {
    title: 'Argentina Style Asado',
    description: 'Slow-grilled over open flame.',
    image: 'https://lario.sa/images/og/asado.jpg',
    type: 'article',
  },
  twitter: { card: 'summary_large_image' },
  alternates: {
    en: 'https://lario.sa/menu/grills/argentina-style-asado',
    ar: 'https://lario.sa/ar/menu/grills/argentina-style-asado',
  },
  schema_enabled: true,
}

describe('seoSchema', () => {
  it('accepts a fully resolved seo object', () => {
    expect(seoSchema.parse(validSeo).title).toBe(
      'Argentina Style Asado | La Rio Riyadh',
    )
  })

  it('rejects an empty title — the contract forbids it', () => {
    expect(() => seoSchema.parse({ ...validSeo, title: '' })).toThrow()
  })
})

describe('load-bearing constants', () => {
  it('SECTION_TYPES holds exactly the 11 approved types in order', () => {
    expect(SECTION_TYPES).toEqual([
      'hero',
      'intro',
      'featured_dishes',
      'why_lario',
      'chef_story',
      'branch_cards',
      'private_events',
      'gallery_strip',
      'testimonials',
      'faq',
      'reservation_cta',
    ])
  })

  it('branchSchema accepts only the two contracted slugs', () => {
    const base = {
      slug: 'narjis',
      name: 'La Rio Al Narjis',
    }
    expect(() => branchSchema.shape.slug.parse('narjis')).not.toThrow()
    expect(() => branchSchema.shape.slug.parse('al-yasmin')).not.toThrow()
    expect(() => branchSchema.shape.slug.parse('al-narjis')).toThrow()
    expect(() => branchSchema.shape.slug.parse('jeddah')).toThrow()
    void base
  })
})

describe('imageUrlSchema', () => {
  it('accepts an absolute URL and a root-relative path', () => {
    expect(() => imageUrlSchema.parse('https://lario.sa/x.jpg')).not.toThrow()
    expect(() => imageUrlSchema.parse('/images/menu/x.jpg')).not.toThrow()
  })

  it('rejects a bare storage path', () => {
    expect(() => imageUrlSchema.parse('storage/app/x.jpg')).toThrow()
    expect(() => imageUrlSchema.parse('images/menu/x.jpg')).toThrow()
  })
})

describe('menuItemCardSchema', () => {
  const card = {
    slug: 'argentina-style-asado',
    name: 'Argentina Style Asado',
    short_description: 'Slow-grilled over open flame.',
    price: '189.00',
    currency: 'SAR',
    calories: 820,
    image: '/images/menu/grills/argentina-style-asado.jpg',
    dietary_tags: ['halal'],
    is_available: true,
    category: { slug: 'steaks-and-mains', name: 'Steaks & Mains' },
    url: '/menu/steaks-and-mains/argentina-style-asado',
  }

  it('accepts a valid card', () => {
    expect(menuItemCardSchema.parse(card).slug).toBe('argentina-style-asado')
  })

  it('rejects a numeric price — money must stay a decimal string', () => {
    expect(() => menuItemCardSchema.parse({ ...card, price: 189 })).toThrow()
  })

  it('rejects a malformed decimal string', () => {
    expect(() => menuItemCardSchema.parse({ ...card, price: '189' })).toThrow()
  })

  it('allows null calories and null image', () => {
    const parsed = menuItemCardSchema.parse({
      ...card,
      calories: null,
      image: null,
    })
    expect(parsed.calories).toBeNull()
  })
})
