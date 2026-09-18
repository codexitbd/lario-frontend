import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import ar from '@/messages/ar.json'
import { getDictionary } from '@/lib/i18n/dictionaries'

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

  it('loads by locale', async () => {
    const dictionary = await getDictionary('ar')
    expect(dictionary.nav.menu).toMatch(/[؀-ۿ]/)
  })
})
