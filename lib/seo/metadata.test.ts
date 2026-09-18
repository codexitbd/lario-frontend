import { describe, expect, it } from 'vitest'
import { buildMetadata } from '@/lib/seo/metadata'

const seo = {
  title: 'Pizza | La Rio Riyadh',
  description: 'Long-fermented dough, wood-fired.',
  canonical: 'https://lario.sa/menu/pizza',
  robots: 'index,follow',
  og: {
    title: 'Pizza',
    description: 'Long-fermented dough, wood-fired.',
    image: 'https://lario.sa/images/og/pizza.jpg',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  alternates: {
    en: 'https://lario.sa/menu/pizza',
    ar: 'https://lario.sa/ar/menu/pizza',
  },
  schema_enabled: true,
}

describe('buildMetadata', () => {
  it('maps the seo object verbatim', () => {
    const meta = buildMetadata(seo)
    expect(meta.title).toBe('Pizza | La Rio Riyadh')
    expect(meta.description).toBe('Long-fermented dough, wood-fired.')
  })

  it('sets the canonical and both language alternates plus x-default', () => {
    const meta = buildMetadata(seo)
    expect(meta.alternates?.canonical).toBe('https://lario.sa/menu/pizza')
    expect(meta.alternates?.languages).toEqual({
      en: 'https://lario.sa/menu/pizza',
      ar: 'https://lario.sa/ar/menu/pizza',
      'x-default': 'https://lario.sa/menu/pizza',
    })
  })

  it('parses the robots string into the structured form', () => {
    expect(buildMetadata(seo).robots).toEqual({ index: true, follow: true })
    expect(
      buildMetadata({ ...seo, robots: 'noindex,nofollow' }).robots,
    ).toEqual({ index: false, follow: false })
  })

  it('carries openGraph and twitter through', () => {
    const meta = buildMetadata(seo)
    expect(meta.openGraph?.images).toEqual([
      'https://lario.sa/images/og/pizza.jpg',
    ])
    expect(meta.twitter?.card).toBe('summary_large_image')
  })

  it('uses the og title/description for openGraph, not the suffixed page title', () => {
    const meta = buildMetadata(seo)
    expect(meta.openGraph?.title).toBe('Pizza')
    expect(meta.title).not.toBe(meta.openGraph?.title)
  })
})
