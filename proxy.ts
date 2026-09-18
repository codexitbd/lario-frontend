import { NextResponse, type NextRequest } from 'next/server'
import redirects from '@/content/redirects.json'
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
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  'frame-src https://www.google.com https://maps.google.com',
  "connect-src 'self'",
  'upgrade-insecure-requests',
].join('; ')

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP,
  'Permissions-Policy': 'camera=(), microphone=(), payment=(), geolocation=()',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
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

const REDIRECT_MAP = buildRedirectMap(redirects as RedirectRow[])

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  const redirect = REDIRECT_MAP.get(pathname)
  if (redirect) {
    const url = request.nextUrl.clone()
    url.pathname = redirect.to
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

function withHeaders(response: NextResponse): NextResponse {
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
