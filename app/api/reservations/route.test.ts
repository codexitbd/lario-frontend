import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/reservations/route'

afterEach(() => vi.unstubAllGlobals())

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://lario.sa/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('POST /api/reservations (forwarded to Laravel)', () => {
  it('passes the body, the visitor IP and the answer through untouched', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { reference: 'LR-ABC234', status: 'pending' } }), { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(post({ guest_name: 'Nouf', locale: 'ar' }, { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }))

    expect(response.status).toBe(201)
    expect((await response.json()).data.reference).toBe('LR-ABC234')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/v1\/reservations$/)
    expect(init.body).toBe(JSON.stringify({ guest_name: 'Nouf', locale: 'ar' }))
    expect(init.headers['X-Forwarded-For']).toBe('203.0.113.9')
  })

  it('keeps localised 422 errors and 429 Retry-After', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'يرجى مراجعة الحقول المحددة.', errors: { guest_phone: ['…'] } }), { status: 422 }),
    ).mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Too Many Attempts.' }), { status: 429, headers: { 'Retry-After': '42' } })))

    const invalid = await POST(post({}))
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).errors.guest_phone).toHaveLength(1)

    const limited = await POST(post({}))
    expect(limited.status).toBe(429)
    expect(limited.headers.get('Retry-After')).toBe('42')
  })

  it('answers 503 when Laravel is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))

    expect((await POST(post({}))).status).toBe(503)
  })
})
