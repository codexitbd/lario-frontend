import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import ar from '@/messages/ar.json'
import {
  DEFERRED_NAV,
  LEGAL_NAV,
  PRIMARY_NAV,
  isActivePath,
} from '@/lib/nav'

describe('nav model', () => {
  it('labels every item in both locales', () => {
    for (const { key } of PRIMARY_NAV) {
      expect(en.nav[key], `en.nav.${key}`).toBeTruthy()
      expect(ar.nav[key], `ar.nav.${key}`).toBeTruthy()
    }
    for (const key of DEFERRED_NAV) {
      expect(en.nav[key], `en.nav.${key}`).toBeTruthy()
      expect(ar.nav[key], `ar.nav.${key}`).toBeTruthy()
    }
    for (const { key } of LEGAL_NAV) {
      expect(en.footer[key], `en.footer.${key}`).toBeTruthy()
      expect(ar.footer[key], `ar.footer.${key}`).toBeTruthy()
    }
  })

  it('gives deferred Phase-4 items no href to link to', () => {
    // The guard behind spec §3: a deferred item cannot become a broken link
    // because there is no URL on it in the first place.
    const linked = new Set(PRIMARY_NAV.map((item) => item.key))
    for (const key of DEFERRED_NAV) expect(linked.has(key)).toBe(false)
    for (const key of DEFERRED_NAV) {
      expect(Object.hasOwn({ key }, 'href')).toBe(false)
    }
  })

  it('roots every primary and legal href', () => {
    for (const { href } of [...PRIMARY_NAV, ...LEGAL_NAV]) {
      expect(href.startsWith('/')).toBe(true)
    }
  })
})

describe('isActivePath', () => {
  it('matches home only exactly', () => {
    expect(isActivePath('/', '/')).toBe(true)
    expect(isActivePath('/menu', '/')).toBe(false)
    // The Arabic home is /ar, which a prefix test would match on every
    // Arabic page in the site. This is why `exact` is the caller's to pass.
    expect(isActivePath('/ar', '/ar', true)).toBe(true)
    expect(isActivePath('/ar/menu', '/ar', true)).toBe(false)
  })

  it('keeps a section marked through its whole subtree', () => {
    expect(isActivePath('/menu', '/menu')).toBe(true)
    expect(isActivePath('/menu/kebabs', '/menu')).toBe(true)
    expect(isActivePath('/menu/kebabs/urfa-kebab', '/menu')).toBe(true)
    expect(isActivePath('/ar/menu/kebabs', '/ar/menu')).toBe(true)
  })

  it('does not match a sibling that merely shares a prefix', () => {
    expect(isActivePath('/menus', '/menu')).toBe(false)
    expect(isActivePath('/contact-us', '/contact')).toBe(false)
  })

  it('ignores a trailing slash on either side', () => {
    expect(isActivePath('/menu/', '/menu')).toBe(true)
    expect(isActivePath('/menu', '/menu/')).toBe(true)
  })
})
