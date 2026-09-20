import { describe, expect, it } from 'vitest'
import { LOCALES, localePath, stripLocalePrefix } from '@/lib/i18n/config'

describe('stripLocalePrefix', () => {
  it('drops a prefix that is a whole segment', () => {
    expect(stripLocalePrefix('/ar/menu/cold-mezze')).toBe('/menu/cold-mezze')
    expect(stripLocalePrefix('/ar')).toBe('/')
    expect(stripLocalePrefix('/en/menu')).toBe('/menu')
  })

  it('leaves an unprefixed path alone', () => {
    expect(stripLocalePrefix('/menu/cold-mezze')).toBe('/menu/cold-mezze')
    expect(stripLocalePrefix('/')).toBe('/')
  })

  it('does NOT eat a segment that merely starts with a locale code', () => {
    // The bug a naive startsWith would ship: /arabica-blend -> /abica-blend.
    expect(stripLocalePrefix('/arabica-blend')).toBe('/arabica-blend')
    expect(stripLocalePrefix('/ar-something/x')).toBe('/ar-something/x')
    expect(stripLocalePrefix('/energy')).toBe('/energy')
  })
})

describe('switching a page between locales', () => {
  const counterpart = (pathname: string, to: (typeof LOCALES)[number]) =>
    localePath(to, stripLocalePrefix(pathname))

  it('round-trips every route shape without drift', () => {
    const paths = ['/', '/menu', '/menu/cold-mezze', '/menu/cold-mezze/acili-ezme']
    for (const path of paths) {
      const ar = counterpart(path, 'ar')
      const backToEn = counterpart(ar, 'en')
      expect(backToEn, path).toBe(path)
      expect(ar.startsWith('/ar')).toBe(true)
    }
  })

  it('maps the two homepages onto each other', () => {
    expect(counterpart('/', 'ar')).toBe('/ar')
    expect(counterpart('/ar', 'en')).toBe('/')
  })

  it('is idempotent when the target locale is already active', () => {
    expect(counterpart('/ar/menu', 'ar')).toBe('/ar/menu')
    expect(counterpart('/menu', 'en')).toBe('/menu')
  })
})
