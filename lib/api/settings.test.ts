import { describe, expect, it } from 'vitest'
// Cached wrapper `@/lib/api/settings` throws under Vitest — see lib/api/menu.test.ts.
import { getSettings } from '@/lib/api/settings.impl'
import { settingsSchema } from '@/lib/schemas'

describe('getSettings', () => {
  it('satisfies the contract shape', () => {
    expect(() => settingsSchema.parse(getSettings())).not.toThrow()
  })

  it('carries exactly one GA4 and one GTM id', () => {
    expect(Object.keys(getSettings().analytics)).toEqual(['ga4_id', 'gtm_id'])
  })
})
