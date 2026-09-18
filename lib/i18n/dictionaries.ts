import en from '@/messages/en.json'
import ar from '@/messages/ar.json'
import type { Locale } from '@/lib/i18n/config'

export type Dictionary = typeof en

// `satisfies`, never `as`. An `as` cast suppresses the structural check entirely:
// a key present in en.json but missing from ar.json compiles clean and fails only
// at runtime. `satisfies` validates both against Dictionary at compile time while
// keeping their literal types, so a missing Arabic key is a build error.
const DICTIONARIES = { en, ar } satisfies Record<Locale, Dictionary>

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return DICTIONARIES[locale]
}

export function interpolate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  )
}
