import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/reservations/route'

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://lario.sa/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const valid = {
  branch_slug: 'narjis',
  guest_name: 'Nouf Alharbi',
  guest_email: 'nouf@example.com',
  guest_phone: '+966512345678',
  party_size: 4,
  reserved_for: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  consent: true,
  locale: 'en',
}

function inFutureNaive(days: number): string {
  // No trailing "Z" and no UTC offset — the exact shape Finding 1 guards
  // against, since Date.parse() on this resolves against the server
  // process's local timezone rather than Asia/Riyadh.
  return new Date(Date.now() + days * 86_400_000)
    .toISOString()
    .replace(/\.\d{3}Z$/, '')
}

describe('POST /api/reservations', () => {
  it('returns 201 with a reference and pending status', async () => {
    const response = await POST(post(valid))
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.reference).toMatch(/^LR-[A-Z2-9]{6}$/)
    expect(body.data.status).toBe('pending')
    expect(body.data.branch.slug).toBe('narjis')
  })

  it('returns 422 with per-field errors', async () => {
    const response = await POST(post({ ...valid, guest_email: 'nope' }))
    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.errors.guest_email).toBeDefined()
    expect(Array.isArray(body.errors.guest_email)).toBe(true)
  })

  it('returns 429 when the simulate header asks for it', async () => {
    const response = await POST(post(valid, { 'x-lario-simulate': '429' }))
    expect(response.status).toBe(429)
  })

  it('returns 422 for malformed JSON', async () => {
    const response = await POST(
      new Request('https://lario.sa/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ not json',
      }),
    )
    expect(response.status).toBe(422)
  })

  it('rejects a naive datetime with no timezone offset', async () => {
    const response = await POST(
      post({ ...valid, reserved_for: inFutureNaive(7) }),
    )
    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.errors.reserved_for).toBeDefined()
  })

  it('returns Arabic error text for an invalid ar-locale request', async () => {
    const response = await POST(
      post({ ...valid, guest_email: 'nope', locale: 'ar' }),
    )
    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.errors.guest_email[0]).toBe('أدخل بريداً إلكترونياً صحيحاً.')
  })

  it('ignores the simulate header when NODE_ENV is production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const response = await POST(post(valid, { 'x-lario-simulate': '429' }))
    expect(response.status).toBe(201)
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})
