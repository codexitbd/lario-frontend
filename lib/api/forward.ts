import { apiUrl } from '@/lib/api/client'

/**
 * Website forms post here (same origin, so the CSP stays `connect-src 'self'`)
 * and this forwards to Laravel, which validates, stores, emails and answers in
 * the request's language. Status, body and Retry-After pass through untouched.
 *
 * The visitor's IP travels as X-Forwarded-For so Laravel rate-limits per
 * visitor, not per website server (Laravel trusts LARIO_TRUSTED_IPS for it).
 */
export async function forwardForm(request: Request, path: string): Promise<Response> {
  const visitor =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined

  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(visitor ? { 'X-Forwarded-For': visitor } : {}),
      },
      body: await request.text(),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return Response.json({ message: 'Service unavailable.' }, { status: 503 })
  }

  const headers = new Headers({ 'Content-Type': 'application/json' })
  const retryAfter = response.headers.get('Retry-After')
  if (retryAfter) headers.set('Retry-After', retryAfter)

  return new Response(await response.text(), { status: response.status, headers })
}
