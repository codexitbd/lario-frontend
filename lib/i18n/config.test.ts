import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  LOCALES,
  getDirection,
  isLocale,
  localePath,
} from '@/lib/i18n/config'

describe('locale config', () => {
  it('exposes exactly en and ar with en as default', () => {
    expect(LOCALES).toEqual(['en', 'ar'])
    expect(DEFAULT_LOCALE).toBe('en')
  })

  it('narrows known locales and rejects unknown ones', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('ar')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('EN')).toBe(false)
  })

  it('maps direction', () => {
    expect(getDirection('en')).toBe('ltr')
    expect(getDirection('ar')).toBe('rtl')
  })
})

describe('localePath', () => {
  it('leaves English unprefixed', () => {
    expect(localePath('en', '/menu')).toBe('/menu')
    expect(localePath('en', '/')).toBe('/')
  })

  it('prefixes Arabic with /ar', () => {
    expect(localePath('ar', '/menu')).toBe('/ar/menu')
    expect(localePath('ar', '/')).toBe('/ar')
  })

  it('normalises a missing leading slash', () => {
    expect(localePath('en', 'menu')).toBe('/menu')
    expect(localePath('ar', 'menu')).toBe('/ar/menu')
  })

  it('strips trailing slashes', () => {
    expect(localePath('en', '/menu/')).toBe('/menu')
    expect(localePath('ar', '/menu/pizza/')).toBe('/ar/menu/pizza')
  })

  it('preserves query strings and fragments', () => {
    expect(localePath('ar', '/reservation?branch=narjis')).toBe(
      '/ar/reservation?branch=narjis',
    )
    expect(localePath('en', '/menu#grills')).toBe('/menu#grills')
  })
})
