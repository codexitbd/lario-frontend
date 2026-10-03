import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { buildCsp, buildRedirectMap, proxy, resetSiteRules } from './proxy'

// Offline by default: the proxy falls back to the bundled redirect fixture.
beforeEach(() => {
  resetSiteRules()
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
})

function request(path: string) {
  return new NextRequest(new URL(`https://lario.sa${path}`))
}

describe('locale handling', () => {
  it('rewrites an unprefixed path to the en tree', async () => {
    const response = await proxy(request('/menu'))
    expect(response.headers.get('x-middleware-rewrite')).toContain('/en/menu')
  })

  it('rewrites the bare root to /en', async () => {
    const response = await proxy(request('/'))
    expect(response.headers.get('x-middleware-rewrite')).toContain('/en')
  })

  it('passes an /ar path through untouched', async () => {
    const response = await proxy(request('/ar/menu'))
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('redirects an explicit /en path to the unprefixed canonical', async () => {
    const response = await proxy(request('/en/menu'))
    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://lario.sa/menu')
  })
})

describe('security headers', () => {
  it('sets them on every response', async () => {
    const response = await proxy(request('/menu'))
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    )
    // DENY, matching the CSP's frame-ancestors 'none' beside it.
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    expect(response.headers.get('Content-Security-Policy')).toContain(
      "frame-ancestors 'none'",
    )
  })

  it('sets CSP and Permissions-Policy per ADR-004', async () => {
    const response = await proxy(request('/menu'))
    const csp = response.headers.get('Content-Security-Policy')
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain('frame-src https://www.google.com https://maps.google.com')
    expect(response.headers.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), payment=(), geolocation=()',
    )
  })

  it('sets HSTS without preload', async () => {
    const response = await proxy(request('/menu'))
    const hsts = response.headers.get('Strict-Transport-Security')
    expect(hsts).toBe('max-age=63072000; includeSubDomains')
    expect(hsts).not.toContain('preload')
  })
})

describe('redirects', () => {
  it('serves a configured redirect with its status code', async () => {
    const response = await proxy(request('/our-menu/4'))
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://lario.sa/menu/pizza')
  })
})

describe('redirect loop protection', () => {
  it('drops a self-redirect (from === to)', async () => {
    const map = buildRedirectMap([
      { from: '/a', to: '/a', status: 301, is_active: true },
    ])
    expect(map.has('/a')).toBe(false)
  })

  it('drops an inactive row', async () => {
    const map = buildRedirectMap([
      { from: '/a', to: '/b', status: 301, is_active: false },
    ])
    expect(map.has('/a')).toBe(false)
  })

  it('drops both rows in a two-hop cycle', async () => {
    const map = buildRedirectMap([
      { from: '/a', to: '/b', status: 301, is_active: true },
      { from: '/b', to: '/a', status: 301, is_active: true },
    ])
    expect(map.has('/a')).toBe(false)
    expect(map.has('/b')).toBe(false)
  })
})

describe('admin-driven rules', () => {
  it('allows eval only in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(buildCsp()).toContain("'unsafe-eval'")
    vi.stubEnv('NODE_ENV', 'production')
    expect(buildCsp()).not.toContain("'unsafe-eval'")
    vi.unstubAllEnvs()
  })

  it('opens the CSP only for trackers that are switched on', () => {
    expect(buildCsp({})).not.toContain('googletagmanager')
    const csp = buildCsp({ gtm_id: 'GTM-ABC1234', meta_pixel_id: '123', extra_script_domains: ['https://cdn.example.com', 'http://insecure.example'] })
    expect(csp).toMatch(/script-src [^;]*https:\/\/www\.googletagmanager\.com/)
    expect(csp).toMatch(/script-src [^;]*https:\/\/connect\.facebook\.net/)
    expect(csp).toMatch(/script-src [^;]*https:\/\/cdn\.example\.com/)
    expect(csp).not.toContain('insecure.example')
    expect(csp).not.toContain('tiktok')
  })

  it('applies API redirects in both languages and the tracking CSP', async () => {
    const respond = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) })
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('/redirects')
      ? respond([{ from: '/old-dish', to: '/menu/grill/adana', status: 301 }])
      : respond({ tracking: { tiktok_pixel_id: 'C123' } })))

    const english = await proxy(request('/old-dish'))
    expect(english.headers.get('location')).toBe('https://lario.sa/menu/grill/adana')
    expect(english.headers.get('Content-Security-Policy')).toContain('https://analytics.tiktok.com')

    const arabic = await proxy(request('/ar/old-dish'))
    expect(arabic.headers.get('location')).toBe('https://lario.sa/ar/menu/grill/adana')
  })
})
