import { DEFAULT_LOCALE, type Locale, isLocale } from '@/lib/i18n/config'
import {
  VALIDATION_MESSAGES,
  localiseIssues,
  newsletterSchema,
} from '@/lib/schemas/reservation'

/**
 * Mock newsletter signup, mirroring api/contacts exactly so the Laravel
 * implementation has one shape to copy rather than two.
 *
 * 201 on success, 422 with locale-correct field errors, 429 on rate limit.
 * See 03-api-contract.md, which was amended to add this endpoint.
 */
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

  // Read the locale from the raw payload before validation: the request may be
  // invalid precisely because the guest is using the Arabic form, and they
  // should not be told so in English.
  const requested = (payload as { locale?: unknown } | null)?.locale
  const locale: Locale =
    typeof requested === 'string' && isLocale(requested)
      ? requested
      : DEFAULT_LOCALE

  const parsed = newsletterSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      {
        message: VALIDATION_MESSAGES[locale].form,
        errors: localiseIssues(parsed.error.issues, locale),
      },
      { status: 422 },
    )
  }

  // A real implementation double-opt-ins here. The mock reports the same
  // `pending` status the contract specifies so the UI is built against it.
  return Response.json({ data: { status: 'pending' } }, { status: 201 })
}
