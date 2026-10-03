import { describe, expect, it, vi } from 'vitest'
import en from '@/messages/en.json'
import ar from '@/messages/ar.json'
vi.mock('next/cache', () => ({ cacheLife: () => {}, cacheTag: () => {} }))

const { getDictionary } = await import('@/lib/i18n/dictionaries')

describe('dictionaries', () => {
  it('have identical key sets in both locales', () => {
    const flatten = (obj: object, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([key, value]) =>
        typeof value === 'object' && value !== null
          ? flatten(value, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      )
    expect(flatten(en).sort()).toEqual(flatten(ar).sort())
  })

  it('contain no empty Arabic strings', () => {
    const values = JSON.stringify(ar)
    expect(values).not.toContain('""')
  })

  it('falls back to the bundled wording when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const dictionary = await getDictionary('ar')
    expect(dictionary.nav.menu).toMatch(/[؀-ۿ]/)
    vi.unstubAllGlobals()
  })

  it('layers the admin\'s site texts and tag labels over the bundled ones', async () => {
    const respond = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data, meta: { cache_tags: [] } }) })
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('/ui-strings')
      ? respond({ actions: { reserve: 'Book a table' }, unknown: { key: 'ignored' } })
      : respond([{ type: 'dietary', slug: 'keto', label: 'Keto', icon: null }])))

    const dictionary = await getDictionary('en')

    expect(dictionary.actions.reserve).toBe('Book a table')
    expect(dictionary.nav.menu).toBe(en.nav.menu)
    expect((dictionary.menu.tags as Record<string, string>).keto).toBe('Keto')
    expect('unknown' in dictionary).toBe(false)
    vi.unstubAllGlobals()
  })
})
