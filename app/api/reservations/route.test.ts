import { describe, expect, it } from 'vitest'
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
})
