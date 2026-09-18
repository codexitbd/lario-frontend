import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { buildRedirectMap, proxy } from './proxy'

function request(path: string) {
  return new NextRequest(new URL(`https://lario.sa${path}`))
}

describe('locale handling', () => {
  it('rewrites an unprefixed path to the en tree', () => {
    const response = proxy(request('/menu'))
    expect(response.headers.get('x-middleware-rewrite')).toContain('/en/menu')
  })

  it('rewrites the bare root to /en', () => {
    const response = proxy(request('/'))
    expect(response.headers.get('x-middleware-rewrite')).toContain('/en')
  })

  it('passes an /ar path through untouched', () => {
    const response = proxy(request('/ar/menu'))
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('redirects an explicit /en path to the unprefixed canonical', () => {
    const response = proxy(request('/en/menu'))
    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://lario.sa/menu')
  })
})

describe('security headers', () => {
  it('sets them on every response', () => {
    const response = proxy(request('/menu'))
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

  it('sets CSP and Permissions-Policy per ADR-004', () => {
    const response = proxy(request('/menu'))
    const csp = response.headers.get('Content-Security-Policy')
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain('frame-src https://www.google.com https://maps.google.com')
    expect(response.headers.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), payment=(), geolocation=()',
    )
  })

  it('sets HSTS without preload', () => {
    const response = proxy(request('/menu'))
    const hsts = response.headers.get('Strict-Transport-Security')
    expect(hsts).toBe('max-age=63072000; includeSubDomains')
    expect(hsts).not.toContain('preload')
  })
})

describe('redirects', () => {
  it('serves a configured redirect with its status code', () => {
    const response = proxy(request('/our-menu/4'))
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://lario.sa/menu/pizza')
  })
})

describe('redirect loop protection', () => {
  it('drops a self-redirect (from === to)', () => {
    const map = buildRedirectMap([
      { from: '/a', to: '/a', status: 301, is_active: true },
    ])
    expect(map.has('/a')).toBe(false)
  })

  it('drops an inactive row', () => {
    const map = buildRedirectMap([
      { from: '/a', to: '/b', status: 301, is_active: false },
    ])
    expect(map.has('/a')).toBe(false)
  })

  it('drops both rows in a two-hop cycle', () => {
    const map = buildRedirectMap([
      { from: '/a', to: '/b', status: 301, is_active: true },
      { from: '/b', to: '/a', status: 301, is_active: true },
    ])
    expect(map.has('/a')).toBe(false)
    expect(map.has('/b')).toBe(false)
  })
})
