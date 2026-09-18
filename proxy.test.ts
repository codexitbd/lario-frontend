import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

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
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
  })
})

describe('redirects', () => {
  it('serves a configured redirect with its status code', () => {
    const response = proxy(request('/our-menu/4'))
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://lario.sa/menu/pizza')
  })
})
