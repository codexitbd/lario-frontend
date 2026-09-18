import { beforeEach, describe, expect, it, vi } from 'vitest'

// The cached wrappers' own bodies (menu.ts, branches.ts, home.ts, pages.ts,
// settings.ts) can't run their 'use cache' machinery under Vitest — see
// lib/api/menu.test.ts. But the directive itself is inert outside Next's
// compiler; the rest of each wrapper body is plain code. Mocking cacheTag/
// cacheLife lets us call the REAL wrapper (not just the impl) and assert the
// exact tag strings it declares — the one thing decision #1 (dual-tag on
// getMenuCategory) and the tag-string contract actually hinge on.
const cacheTagCalls: unknown[][] = []
const cacheLifeCalls: unknown[][] = []

vi.mock('next/cache', () => ({
  cacheTag: (...args: unknown[]) => {
    cacheTagCalls.push(args)
  },
  cacheLife: (...args: unknown[]) => {
    cacheLifeCalls.push(args)
  },
}))

const { getMenuCategories, getMenuCategory, getMenuItems, getMenuItem, getFeaturedItems } =
  await import('@/lib/api/menu')
const { getBranches, getBranch } = await import('@/lib/api/branches')
const { getHome } = await import('@/lib/api/home')
const { getPage } = await import('@/lib/api/pages')
const { getSettings } = await import('@/lib/api/settings')

beforeEach(() => {
  cacheTagCalls.length = 0
  cacheLifeCalls.length = 0
})

describe('cacheLife', () => {
  it('every fetcher uses the "max" profile', async () => {
    await getMenuCategories('en')
    await getMenuItems('en')
    await getMenuItem('en', 'acili-ezme')
    await getMenuCategory('en', 'cold-mezze')
    await getFeaturedItems('en', ['acili-ezme'])
    await getBranches('en')
    await getBranch('en', 'narjis')
    await getHome('en')
    await getPage('en', 'contact')
    await getSettings('en')

    expect(cacheLifeCalls.length).toBeGreaterThan(0)
    for (const call of cacheLifeCalls) {
      expect(call).toEqual(['max'])
    }
  })
})

describe('cacheTag wiring matches the contract', () => {
  it('getMenuCategories tags "menu"', async () => {
    await getMenuCategories('en')
    expect(cacheTagCalls).toEqual([['menu']])
  })

  it('getMenuItems tags "menu"', async () => {
    await getMenuItems('en')
    expect(cacheTagCalls).toEqual([['menu']])
  })

  it('getMenuItem tags "menu-item:{slug}"', async () => {
    await getMenuItem('en', 'acili-ezme')
    expect(cacheTagCalls).toEqual([['menu-item:acili-ezme']])
  })

  it('getMenuCategory tags BOTH "menu-category:{slug}" and "menu" — the cascade decision', async () => {
    await getMenuCategory('en', 'cold-mezze')
    expect(cacheTagCalls).toEqual([['menu-category:cold-mezze', 'menu']])
  })

  it('getFeaturedItems tags "home"', async () => {
    await getFeaturedItems('en', ['acili-ezme'])
    expect(cacheTagCalls).toEqual([['home']])
  })

  it('getBranches tags "branches"', async () => {
    await getBranches('en')
    expect(cacheTagCalls).toEqual([['branches']])
  })

  it('getBranch tags "branch:{slug}"', async () => {
    await getBranch('en', 'narjis')
    expect(cacheTagCalls).toEqual([['branch:narjis']])
  })

  it('getHome tags "home"', async () => {
    await getHome('en')
    expect(cacheTagCalls).toEqual([['home']])
  })

  it('getPage tags "page:{slug}"', async () => {
    await getPage('en', 'contact')
    expect(cacheTagCalls).toEqual([['page:contact']])
  })

  it('getSettings tags "settings"', async () => {
    await getSettings('en')
    expect(cacheTagCalls).toEqual([['settings']])
  })
})
