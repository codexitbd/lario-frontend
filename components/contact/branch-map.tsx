import type { Locale } from '@/lib/i18n/config'
import type { Branch } from '@/lib/schemas'

/**
 * Google's keyless map embed, pinned on the branch's own coordinates rather than
 * a text search, so it cannot land on the wrong place (QA round 2, B-09).
 * `loading="lazy"` keeps the frame and Google's script off the critical path;
 * every use sits below the fold. frame-src in proxy.ts already allows
 * www.google.com. Renders nothing for a branch without coordinates.
 */
export function BranchMap({
  branch,
  locale,
  className = '',
}: {
  branch: Branch
  locale: Locale
  className?: string
}) {
  if (!branch.coordinates) return null
  const { latitude, longitude } = branch.coordinates
  const src = `https://www.google.com/maps?q=${latitude},${longitude}&z=16&hl=${locale}&output=embed`

  return (
    <div className={`relative overflow-hidden bg-bone-raised ${className}`}>
      <iframe
        src={src}
        title={branch.name}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 size-full border-0"
      />
    </div>
  )
}
