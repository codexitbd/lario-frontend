import branches from '@/content/branches.json'
import { resolveTranslation } from '@/lib/api/resolve'
import { DEFAULT_LOCALE, type Locale, isLocale } from '@/lib/i18n/config'
import {
  VALIDATION_MESSAGES,
  generateReference,
  localiseIssues,
  reservationSchema,
} from '@/lib/schemas/reservation'

export async function POST(request: Request): Promise<Response> {
  // This route is the LIVE backend until Laravel exists, so the simulate escape
  // hatch must not survive to production — otherwise any caller can force a 429
  // or 500 on demand against the real site. It is a testing affordance, and it
  // is not documented in the API contract.
  const simulate =
    process.env.NODE_ENV === 'production'
      ? null
      : request.headers.get('x-lario-simulate')
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

  // Read the locale from the raw payload before validation — the request may be
  // invalid precisely because the guest is filling the Arabic form in, and they
  // should not be told so in English.
  const requested = (payload as { locale?: unknown } | null)?.locale
  const locale: Locale =
    typeof requested === 'string' && isLocale(requested)
      ? requested
      : DEFAULT_LOCALE

  const parsed = reservationSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      {
        message: VALIDATION_MESSAGES[locale].form,
        errors: localiseIssues(parsed.error.issues, locale),
      },
      { status: 422 },
    )
  }

  const data = parsed.data
  const branch = branches.find((b) => b.slug === data.branch_slug)
  if (!branch) {
    // Localised like every other 422 — data.locale is validated and in hand,
    // so there is no reason for this one path to answer an Arabic form in
    // English. Reachable only if the fixture and reservationSchema's slug enum
    // disagree, which is exactly when a clear message matters.
    return Response.json(
      {
        message: VALIDATION_MESSAGES[data.locale].form,
        errors: { branch_slug: [VALIDATION_MESSAGES[data.locale].branch_slug] },
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
