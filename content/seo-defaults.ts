import { SITE_URL } from '@/lario.config'
import type { Locale } from '@/lib/i18n/config'
import { localePath } from '@/lib/i18n/config'

// SEO objects now arrive fully resolved from the API (title suffix, canonical,
// alternates, robots). What remains here is the one thing pages still build
// themselves: absolute addresses for breadcrumbs and JSON-LD.
export const SITE_ORIGIN = SITE_URL

export function absoluteUrl(locale: Locale, path: string): string {
  return `${SITE_ORIGIN}${localePath(locale, path)}`
}
