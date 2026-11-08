import type { MetadataRoute } from 'next'
import { getSettings } from '@/lib/api/settings'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'

/**
 * "Add to Home Screen" (QA round 2, B-16). The icons are the gold logo on the
 * ink ground, generated into public/ from golden-logo.png; the logo sits inside
 * the centre 72%, so one file serves as both the plain and the maskable icon.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings(DEFAULT_LOCALE).catch(() => null)
  const name = settings?.site_name ?? 'La Rio'

  return {
    name,
    short_name: name,
    start_url: '/',
    display: 'standalone',
    background_color: '#0e1413',
    theme_color: '#0e1413',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
