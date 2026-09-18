import { describe, expect, it } from 'vitest'
import categories from '@/content/menu-categories.json'
import { menuCategorySchema } from '@/lib/schemas'
import { buildSeo } from '@/content/seo-defaults'
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

  it('resolves to a valid MenuCategory in both locales', () => {
    for (const category of categories) {
      for (const locale of LOCALES) {
        const t = category.translations[locale]
        const resolved = {
          slug: category.slug,
          name: t.name,
          description: t.description,
          intro_content: t.intro_content,
          image: category.image,
          item_count: 0,
          url: `/menu/${category.slug}`,
          seo: buildSeo({
            title: t.name,
            description: t.description ?? '',
            path: `/menu/${category.slug}`,
            locale,
          }),
        }
        expect(() => menuCategorySchema.parse(resolved)).not.toThrow()
      }
    }
  })
})
