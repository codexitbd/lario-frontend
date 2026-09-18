import settingsFixture from '@/content/settings.json'
import { titleSuffix } from '@/content/seo-defaults'
import type { Locale } from '@/lib/i18n/config'
import type { Settings } from '@/lib/schemas'

// site_name, contact, social and analytics are locale-invariant, but
// seo_defaults.title_suffix is not: the fixture carries one per locale (source
// shape) and GET /settings returns the resolved string for `?locale=`, the same
// as every other translated field. That is what the `locale` param is for.
export function getSettings(locale: Locale): Settings {
  return {
    ...settingsFixture,
    default_locale: settingsFixture.default_locale as Locale,
    locales: settingsFixture.locales as Locale[],
    seo_defaults: {
      ...settingsFixture.seo_defaults,
      title_suffix: titleSuffix(locale),
    },
  }
}
