import { describe, expect, it } from 'vitest'
// Cached wrapper `@/lib/api/pages` throws under Vitest — see lib/api/menu.test.ts.
import { getPage } from '@/lib/api/pages.impl'
import { pageSchema } from '@/lib/schemas'

describe('getPage', () => {
  it('returns null for an unknown slug', () => {
    expect(getPage('en', 'no-such-page')).toBeNull()
  })

  it('returns each of the three system pages satisfying the contract shape', () => {
    for (const slug of ['contact', 'privacy-policy', 'terms-and-conditions']) {
      const page = getPage('en', slug)
      expect(page).not.toBeNull()
      expect(() => pageSchema.parse(page)).not.toThrow()
    }
  })

  it('computes an authoritative url-free path used by seo.canonical', () => {
    const page = getPage('en', 'contact')
    expect(page!.seo.canonical).toBe('https://lario.sa/contact')
  })
})
