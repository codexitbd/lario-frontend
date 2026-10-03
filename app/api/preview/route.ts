import { cookies, draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { apiUrl } from '@/lib/api/client'
import { isLocale, localePath } from '@/lib/i18n/config'
import { PREVIEW_COOKIE } from '@/lib/preview'

/**
 * Entry point of the admin's "Preview on website" button:
 * /api/preview?token=…[&locale=ar]
 *
 * Laravel checks the signed token and says which page it opens. Only then is
 * draft mode switched on, and the browser is sent to the path Laravel named —
 * never to a path from the query string, so this cannot be an open redirect.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const locale = searchParams.get('locale') ?? ''
  if (!token) return new Response('Missing preview token.', { status: 401 })

  const response = await fetch(apiUrl('/preview', { query: { token } }), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  }).catch(() => null)

  if (!response?.ok) {
    return new Response('This preview link has expired or is invalid. Open it again from the admin panel.', { status: 401 })
  }

  const { data } = (await response.json()) as { data: { path: string; expires_at: string } }
  if (!data.path.startsWith('/') || data.path.startsWith('//')) {
    return new Response('Invalid preview target.', { status: 400 })
  }

  ;(await draftMode()).enable()
  ;(await cookies()).set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(data.expires_at),
  })

  redirect(isLocale(locale) ? localePath(locale, data.path) : data.path)
}
