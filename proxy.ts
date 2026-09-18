import { NextResponse, type NextRequest } from 'next/server'
import redirects from '@/content/redirects.json'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n/config'

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

const REDIRECT_MAP = new Map(
  redirects
    .filter((r) => r.is_active)
    .map((r) => [r.from_path, r] as const),
)

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  const redirect = REDIRECT_MAP.get(pathname)
  if (redirect) {
    const url = request.nextUrl.clone()
    url.pathname = redirect.to_path
    return withHeaders(NextResponse.redirect(url, redirect.status_code))
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)'],
}
