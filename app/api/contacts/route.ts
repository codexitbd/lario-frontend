import { contactSchema } from '@/lib/schemas/reservation'

export async function POST(request: Request): Promise<Response> {
  const simulate = request.headers.get('x-lario-simulate')
  if (simulate === '429') {
    return Response.json(
      { message: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }
  if (simulate === '500') {
    return Response.json({ message: 'Server error.' }, { status: 500 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json(
      { message: 'Malformed request body.', errors: {} },
      { status: 422 },
    )
  }

  const parsed = contactSchema.safeParse(payload)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.') || 'form'
      ;(errors[field] ??= []).push(issue.message)
    }
    return Response.json(
      { message: 'The given data was invalid.', errors },
      { status: 422 },
    )
  }

  return Response.json({ data: { status: 'received' } }, { status: 201 })
}
