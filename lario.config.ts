/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE ONE FILE TO EDIT when the backend / admin panel moves.
 *
 *  backendUrl  where Laravel (the admin panel and the API) lives
 *  siteUrl     this website's public address (canonicals, sitemap, hreflang)
 *
 *  Each can also be overridden per environment with LARIO_BACKEND_URL /
 *  LARIO_SITE_URL, so staging never needs a code change.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const config = {
  backendUrl: 'https://lario-backend.test',
  siteUrl: 'https://lario.sa',
}

const trim = (url: string) => url.replace(/\/+$/, '')

export const BACKEND_URL = trim(process.env.LARIO_BACKEND_URL || config.backendUrl)
export const SITE_URL = trim(process.env.LARIO_SITE_URL || config.siteUrl)

/** Read API the website renders from. */
export const API_URL = `${BACKEND_URL}/api/v1`
/** The client's admin panel. */
export const ADMIN_URL = `${BACKEND_URL}/admin`
/** Origin uploaded images are served from (next/image allowlist, CSP img-src). */
export const MEDIA_ORIGIN = new URL(BACKEND_URL).origin
