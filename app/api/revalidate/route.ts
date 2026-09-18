import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'

const REPLAY_WINDOW_SECONDS = 300
const MAX_TAGS = 50

function unauthorized(): Response {
  return Response.json({ message: 'Unauthorized.' }, { status: 401 })
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.LARIO_REVALIDATE_SECRET
  const timestamp = request.headers.get('x-lario-timestamp')
  const signature = request.headers.get('x-lario-signature')
  if (!secret || !timestamp || !signature) return unauthorized()

  const age = Math.floor(Date.now() / 1000) - Number(timestamp)
  if (!Number.isFinite(age) || Math.abs(age) > REPLAY_WINDOW_SECONDS) {
    return unauthorized()
  }

  const raw = await request.text()
  const expected = `sha256=${createHmac('sha256', secret)
    .update(`${timestamp}.${raw}`)
    .digest('hex')}`

  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(signature)
  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return unauthorized()
  }

  let body: { tags?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return Response.json({ message: 'Malformed body.' }, { status: 422 })
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === 'string')
    : []

  if (tags.length === 0 || tags.length > MAX_TAGS) {
    return Response.json(
      { message: `Provide between 1 and ${MAX_TAGS} tags.` },
      { status: 422 },
    )
  }

  for (const tag of tags) {
    revalidateTag(tag, 'max')
  }

  return Response.json({ revalidated: tags.length })
}
