import branches from '@/content/branches.json'
import { resolveTranslation } from '@/lib/api/resolve'
import type { Locale } from '@/lib/i18n/config'
import { generateReference, reservationSchema } from '@/lib/schemas/reservation'

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

  const parsed = reservationSchema.safeParse(payload)
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

  const data = parsed.data
  const branch = branches.find((b) => b.slug === data.branch_slug)
  if (!branch) {
    return Response.json(
      {
        message: 'The given data was invalid.',
        errors: { branch_slug: ['Unknown branch.'] },
      },
      { status: 422 },
    )
  }

  // content/branches.json fixture: each branch's translations carry a
  // differently-shaped facilities_labels map, so the array type is a union.
  // Widen to the one field this route needs (see lib/api/branches.impl.ts
  // for the same pattern applied to the full Branch shape).
  const translation = resolveTranslation(
    branch.translations as Partial<Record<Locale, { name: string }>>,
    data.locale,
  )

  return Response.json(
    {
      data: {
        reference: generateReference(),
        status: 'pending',
        reserved_for: data.reserved_for,
        branch: {
          slug: branch.slug,
          name: translation.name,
          phone: branch.phone,
          email: branch.email,
        },
      },
    },
    { status: 201 },
  )
}
