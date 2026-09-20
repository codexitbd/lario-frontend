import { describe, expect, it } from 'vitest'
// `getMenuCategories`/`getMenuItem`/`getMenuItems` in `@/lib/api/menu` are
// 'use cache' wrappers — cacheTag()/cacheLife() throw outside a real Next.js
// render (confirmed: test.server.deps.inline: ['next'] does not help, see
// vitest.config.ts and task-11-report.md). So this suite exercises the pure
// bodies directly from the sibling impl module; `menu.ts` stays a thin
// pass-through, unit-tested implicitly by every caller that renders through it.
import { getMenuCategories, getMenuItem, getMenuItems } from '@/lib/api/menu.impl'
import { menuCategorySchema, menuItemSchema } from '@/lib/schemas'

describe('getMenuCategories', () => {
  it('returns 9 categories that satisfy the contract shape', async () => {
    const categories = await getMenuCategories('en')
    expect(categories).toHaveLength(9)
    for (const category of categories) {
      expect(() => menuCategorySchema.parse(category)).not.toThrow()
    }
  })

  it('counts items per category, summing to 89', async () => {
    const categories = await getMenuCategories('en')
    const total = categories.reduce((sum, c) => sum + c.item_count, 0)
    expect(total).toBe(89)
  })

  it('returns Arabic names for the ar locale', async () => {
    const categories = await getMenuCategories('ar')
    expect(categories[0].name).toMatch(/[؀-ۿ]/)
  })
})

describe('getMenuItems', () => {
  it('returns all 89 items with server-computed urls', async () => {
    const items = await getMenuItems('en')
    expect(items).toHaveLength(89)
    for (const item of items) {
      expect(item.url).toBe(`/menu/${item.category.slug}/${item.slug}`)
    }
  })
})

describe('getMenuItem', () => {
  it('returns null for an unknown slug', async () => {
    expect(await getMenuItem('en', 'no-such-dish')).toBeNull()
  })

  it('returns a full item with at most 4 related dishes', async () => {
    const items = await getMenuItems('en')
    const item = await getMenuItem('en', items[0].slug)
    expect(item).not.toBeNull()
    expect(() => menuItemSchema.parse(item)).not.toThrow()
    expect(item!.related.length).toBeLessThanOrEqual(4)
    expect(item!.related.every((r) => r.slug !== item!.slug)).toBe(true)
  })

  it('carries name_alt in the other script, or null when the two match', async () => {
    const en = await getMenuItem('en', 'urfa-kebab')
    expect(en!.name_alt).toMatch(/[\u0600-\u06ff]/)

    const ar = await getMenuItem('ar', 'urfa-kebab')
    expect(ar!.name_alt).toBe(en!.name)

    // All 89 fixture rows are translated, so every one has a real second name.
    // The null branch guards untranslated CMS rows, where resolveTranslation
    // falls back to `en` and both names come back identical; no fixture
    // reaches it, so it is not asserted here.
    for (const item of await getMenuItems('en')) {
      const full = await getMenuItem('en', item.slug)
      expect(full!.name_alt).not.toBeNull()
    }
  })
})
