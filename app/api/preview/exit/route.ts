import { cookies, draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { PREVIEW_COOKIE } from '@/lib/preview'

/** Leaves preview and returns to the published page the editor was on. */
export async function GET(request: Request): Promise<Response> {
  ;(await draftMode()).disable()
  ;(await cookies()).delete(PREVIEW_COOKIE)

  const back = new URL(request.url).searchParams.get('path') ?? '/'
  redirect(back.startsWith('/') && !back.startsWith('//') ? back : '/')
}
