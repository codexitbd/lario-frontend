import { describe, expect, it } from 'vitest'
import { menuItemCardSchema, seoSchema } from '@/lib/schemas'

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
