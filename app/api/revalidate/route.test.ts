import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHmac } from 'node:crypto'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

const SECRET = 'test-secret'

beforeEach(() => {
  process.env.LARIO_REVALIDATE_SECRET = SECRET
  vi.clearAllMocks()
})

function signed(body: object, timestamp = Math.floor(Date.now() / 1000)) {
  const raw = JSON.stringify(body)
  const signature = createHmac('sha256', SECRET)
    .update(`${timestamp}.${raw}`)
    .digest('hex')
  return new Request('https://lario.sa/api/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Lario-Timestamp': String(timestamp),
      'X-Lario-Signature': `sha256=${signature}`,
    },
    body: raw,
  })
}

describe('POST /api/revalidate', () => {
  it('revalidates each tag and reports the count', async () => {
    const { POST } = await import('@/app/api/revalidate/route')
    const { revalidateTag } = await import('next/cache')
    const response = await POST(
      signed({ tags: ['menu', 'menu-item:carbonara'], reason: 'test' }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ revalidated: 2 })
    expect(revalidateTag).toHaveBeenCalledWith('menu', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('menu-item:carbonara', 'max')
  })

  it('rejects a bad signature with 401', async () => {
    const { POST } = await import('@/app/api/revalidate/route')
    const request = signed({ tags: ['menu'], reason: 'test' })
    request.headers.set('X-Lario-Signature', 'sha256=deadbeef')
    expect((await POST(request)).status).toBe(401)
  })

  it('rejects a timestamp older than the replay window', async () => {
    const { POST } = await import('@/app/api/revalidate/route')
    const stale = Math.floor(Date.now() / 1000) - 400
    expect((await POST(signed({ tags: ['menu'] }, stale))).status).toBe(401)
  })

  it('rejects more than 50 tags', async () => {
    const { POST } = await import('@/app/api/revalidate/route')
    const tags = Array.from({ length: 51 }, (_, i) => `menu-item:${i}`)
    expect((await POST(signed({ tags, reason: 'test' }))).status).toBe(422)
  })

  it('returns 401 when the secret is not configured', async () => {
    delete process.env.LARIO_REVALIDATE_SECRET
    const { POST } = await import('@/app/api/revalidate/route')
    expect((await POST(signed({ tags: ['menu'] }))).status).toBe(401)
  })
})
