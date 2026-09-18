import { describe, expect, it } from 'vitest'
// Cached wrapper `@/lib/api/settings` throws under Vitest — see lib/api/menu.test.ts.
import { getSettings } from '@/lib/api/settings.impl'
import { settingsSchema } from '@/lib/schemas'

describe('getSettings', () => {
  it('satisfies the contract shape', () => {
    expect(() => settingsSchema.parse(getSettings('en'))).not.toThrow()
  })

  it('carries exactly one GA4 and one GTM id', () => {
    expect(Object.keys(getSettings('en').analytics)).toEqual([
      'ga4_id',
      'gtm_id',
    ])
  })

  it('resolves seo_defaults.title_suffix for the requested locale', () => {
    expect(getSettings('en').seo_defaults.title_suffix).toBe(' | La Rio Riyadh')
    expect(getSettings('ar').seo_defaults.title_suffix).toBe(' | لا ريو الرياض')
  })
})
