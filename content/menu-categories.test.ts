import { describe, expect, it } from 'vitest'
import categories from '@/content/menu-categories.json'
import { LOCALES } from '@/lib/i18n/config'

describe('menu-categories fixture', () => {
  it('has exactly 9 categories', () => {
    expect(categories).toHaveLength(9)
  })

  it('has unique slugs', () => {
    const slugs = categories.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(9)
  })

  it('carries both locales for every category', () => {
    for (const category of categories) {
      for (const locale of LOCALES) {
        expect(category.translations[locale].name.length).toBeGreaterThan(0)
        expect(
          category.translations[locale].intro_content.length,
        ).toBeGreaterThan(80)
      }
    }
  })

})
