import settingsFixture from '@/content/settings.json'
import type { Locale } from '@/lib/i18n/config'
import type { Settings } from '@/lib/schemas'

// Settings carry no per-locale copy today (site_name, contact, social,
// analytics and seo_defaults are locale-invariant) — the `locale` param exists
// only so the signature matches every other fetcher's `?locale=` contract.
export function getSettings(): Settings {
  return {
    ...settingsFixture,
    default_locale: settingsFixture.default_locale as Locale,
    locales: settingsFixture.locales as Locale[],
  }
}
