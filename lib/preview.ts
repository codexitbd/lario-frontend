import { cookies, draftMode } from 'next/headers'

/** Cookie set by /api/preview next to Next's draft-mode cookie. */
export const PREVIEW_COOKIE = 'lario_preview'

/**
 * The admin's preview token while draft mode is on, else undefined.
 * Reads cookies only in draft mode, so normal visits stay fully static.
 */
export async function previewToken(): Promise<string | undefined> {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return undefined
  return (await cookies()).get(PREVIEW_COOKIE)?.value
}
