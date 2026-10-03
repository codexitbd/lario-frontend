import { NextResponse, type NextRequest } from 'next/server'
import fallbackRedirects from '@/content/redirects.json'
import { apiUrl } from '@/lib/api/client'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n/config'

// ADR-004 names the required set: CSP, HSTS, Referrer-Policy, Permissions-Policy
// and X-Content-Type-Options.
//
// HSTS deliberately omits `preload`. max-age + includeSubDomains is self-healing
// — serve max-age=0 to release it. `preload` asks to be hardcoded into browser
// source trees, takes months to undo, and reaches already-shipped browsers never.
// That is a one-way commitment for the client to make deliberately, after every
// subdomain is confirmed to terminate HTTPS. Not a foundation-task default.
//
// The CSP is strict-by-default with two known allowances: the Google Maps embed
// on branch pages (frame-src) and data: image URIs. It is UNVERIFIED against real
// pages, because no page exists yet — the very next task renders the first one,
// so a mistake here surfaces immediately rather than in production.
export type TrackingSettings = {
  ga4_id?: string | null
  gtm_id?: string | null
  meta_pixel_id?: string | null
  tiktok_pixel_id?: string | null
  snap_pixel_id?: string | null
  custom_head?: string | null
  custom_body_start?: string | null
  custom_body_end?: string | null
  extra_script_domains?: string[]
}

/**
 * The Content-Security-Policy, widened only for the trackers the admin has
 * switched on (Settings → Tracking & scripts) and the extra domains they list.
 */
export function buildCsp(tracking: TrackingSettings = {}): string {
  const script = ["'self'", "'unsafe-inline'"]
  // React dev mode rebuilds call stacks with eval(); production never uses it,
  // so the live site's policy stays eval-free.
  if (process.env.NODE_ENV === 'development') script.push("'unsafe-eval'")
  const connect = ["'self'"]
  const frame = ['https://www.google.com', 'https://maps.google.com', 'https://www.youtube-nocookie.com']

  if (tracking.gtm_id || tracking.ga4_id) {
    script.push('https://www.googletagmanager.com')
    connect.push('https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com')
    frame.push('https://www.googletagmanager.com')
  }
  if (tracking.meta_pixel_id) {
    script.push('https://connect.facebook.net')
    connect.push('https://www.facebook.com', 'https://connect.facebook.net')
  }
  if (tracking.tiktok_pixel_id) {
    script.push('https://analytics.tiktok.com')
    connect.push('https://analytics.tiktok.com')
  }
  if (tracking.snap_pixel_id) {
    script.push('https://sc-static.net')
    connect.push('https://tr.snapchat.com', 'https://tr-shadow.snapchat.com')
  }
  for (const origin of tracking.extra_script_domains ?? []) {
    if (/^https:\/\/[a-z0-9.*-]+(:\d+)?$/i.test(origin)) {
      script.push(origin)
      connect.push(origin)
      frame.push(origin)
    }
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${[...new Set(script)].join(' ')}`,
    `frame-src ${[...new Set(frame)].join(' ')}`,
    `connect-src ${[...new Set(connect)].join(' ')}`,
    'upgrade-insecure-requests',
  ].join('; ')
}

const SECURITY_HEADERS: Record<string, string> = {
  'Permissions-Policy': 'camera=(), microphone=(), payment=(), geolocation=()',
  'X-Content-Type-Options': 'nosniff',
  // DENY, not SAMEORIGIN: the CSP set beside this declares
  // `frame-ancestors 'none'`, and a legacy header that permits same-origin
  // framing while the modern one forbids all framing is a contradiction a
  // reader has to resolve. Nothing on this site frames itself.
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
}

// Field names are the CONTRACT's (`from` / `to` / `status`), not the database
// column names (`from_path` / `to_path` / `status_code`). content/redirects.json
// stands in for GET /redirects, and the contract defines the wire shape; column
// names stay in the database where they belong.
//
// `is_active` has no contract equivalent because it is a real filter applied
// before the rows are serialised — it is documented in the contract as
// optionally present so a fixture layer can carry it.
interface RedirectRow {
  from: string
  to: string
  status: number
  is_active: boolean
}

// Redirect rows are written AUTOMATICALLY by a slug-change observer (ADR-012),
// so a self-redirect or an A->B->A cycle is a plausible accident, not a contrived
// one. Nothing downstream would catch it: the browser just returns
// ERR_TOO_MANY_REDIRECTS. Drop bad rows at build time rather than serving them.
export function buildRedirectMap(rows: RedirectRow[]): Map<string, RedirectRow> {
  const active = rows.filter((r) => r.is_active && r.from !== r.to)

  const safe = active.filter((r) => {
    // Follow the chain from this row's target; if it leads back here, drop it.
    const seen = new Set<string>([r.from])
    let next = r.to
    for (let hop = 0; hop < 10; hop += 1) {
      if (seen.has(next)) return false
      seen.add(next)
      const onward = active.find((c) => c.from === next)
      if (!onward) return true
      next = onward.to
    }
    return false
  })

  return new Map(safe.map((r) => [r.from, r] as const))
}

/**
 * Redirects (Pages → Redirects) and tracking settings, fetched from the API at
 * most once a minute per server process. The proxy runs before rendering, so
 * 'use cache' is not available here; a stale minute is the price of not
 * calling the API on every request. The bundled fixture covers an outage.
 */
const TTL_MS = 60_000
let cached: { at: number; redirects: Map<string, RedirectRow>; csp: string } | null = null

async function siteRules(): Promise<{ redirects: Map<string, RedirectRow>; csp: string }> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached

  const get = async (path: string) => {
    const response = await fetch(apiUrl(path), {
      headers: { Accept: 'application/json', ...(process.env.LARIO_API_KEY ? { 'X-Lario-Key': process.env.LARIO_API_KEY } : {}) },
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
    return (await response.json()).data
  }

  const [redirects, settings] = await Promise.all([
    get('/redirects').catch(() => null) as Promise<Omit<RedirectRow, 'is_active'>[] | null>,
    get('/settings').catch(() => null) as Promise<{ tracking?: TrackingSettings } | null>,
  ])

  cached = {
    at: Date.now(),
    redirects: buildRedirectMap(
      redirects ? redirects.map((row) => ({ ...row, is_active: true })) : (fallbackRedirects as RedirectRow[]),
    ),
    csp: buildCsp(settings?.tracking),
  }
  return cached
}

/** For tests: forget the cached rules. */
export function resetSiteRules(): void {
  cached = null
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const rules = await siteRules()
  const withHeaders = (response: NextResponse) => withSecurityHeaders(response, rules.csp)

  // Redirect paths are language-free: "/old" also covers "/ar/old".
  const arabic = pathname === '/ar' || pathname.startsWith('/ar/')
  const bare = arabic ? pathname.slice(3) || '/' : pathname
  const redirect = rules.redirects.get(bare)
  if (redirect) {
    if (/^https?:\/\//i.test(redirect.to)) {
      return withHeaders(NextResponse.redirect(redirect.to, redirect.status))
    }
    const url = request.nextUrl.clone()
    url.pathname = arabic ? `/ar${redirect.to === '/' ? '' : redirect.to}` : redirect.to
    return withHeaders(NextResponse.redirect(url, redirect.status))
  }

  const segment = pathname.split('/')[1] ?? ''

  if (segment === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || '/'
    return withHeaders(NextResponse.redirect(url, 308))
  }

  if (!(LOCALES as readonly string[]).includes(segment)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
    return withHeaders(NextResponse.rewrite(url))
  }

  return withHeaders(NextResponse.next())
}

function withSecurityHeaders(response: NextResponse, csp: string): NextResponse {
  response.headers.set('Content-Security-Policy', csp)
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export const config = {
  // Each exclusion is anchored to a segment boundary — `api(?:/|$)`, not `api`.
  // A bare negative lookahead matches a PREFIX, so `api` would also exclude a
  // legitimate `/api-documentation` page and `images` would exclude
  // `/images-of-our-chefs`: no locale rewrite, so a 404, and no security headers
  // either. Nothing about that failure points back to a routing pattern.
  matcher: [
    '/((?!api(?:/|$)|_next/static(?:/|$)|_next/image(?:/|$)|favicon\\.ico$|images(?:/|$)|.*\\..*).*)',
  ],
}
