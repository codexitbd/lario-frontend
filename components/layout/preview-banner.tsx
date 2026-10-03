import { draftMode } from 'next/headers'

/** Shown only while an editor is previewing unpublished content. */
export async function PreviewBanner() {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return null

  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-4 bg-gold px-4 py-3 text-sm font-medium text-ink">
      Preview — you are seeing unpublished content.
      {/* A route handler that clears cookies needs a full request, not a client transition. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/preview/exit" className="underline underline-offset-4">Exit preview</a>
    </div>
  )
}
