import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lario.config'
import { getSettings } from '@/lib/api/settings'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'

/**
 * Indexing switch and extra rules from Settings → SEO. Extra rules are
 * "Disallow: /path" / "Allow: /path" lines applied to every crawler.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings(DEFAULT_LOCALE).catch(() => null)
  const seo = settings?.seo_defaults

  if (seo && !seo.allow_indexing) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  const lines = (seo?.robots_txt ?? '').split('\n').map((line) => line.trim())
  const pick = (directive: string) =>
    lines.filter((line) => line.toLowerCase().startsWith(`${directive}:`)).map((line) => line.slice(directive.length + 1).trim()).filter(Boolean)

  return {
    rules: { userAgent: '*', allow: ['/', ...pick('allow')], disallow: ['/api/', ...pick('disallow')] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
