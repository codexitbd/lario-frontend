import Image from 'next/image'
import { placeholderFor } from '@/lib/placeholders'

/**
 * Every photographic slot on the site goes through here.
 *
 * Thirteen of the fourteen shots this page is composed around do not exist yet
 * (docs/content-gaps.md, gap 8), so each fixture field is `null`. When that
 * happens, `slot` resolves a stand-in from lib/placeholders.ts and the
 * composition renders as designed. If there is neither a real image nor a
 * stand-in, it falls back to a branded plate naming the shot that belongs
 * there, so a missing slot reads as a brief rather than as a broken layout.
 *
 * `className` MUST establish a containing block — either `relative` with a
 * size, or `absolute inset-0`. Positioning is not baked in: a hardcoded
 * `relative` collides unpredictably with a caller's `absolute` and the element
 * silently collapses to zero height with `next/image fill` inside it.
 */
export function Figure({
  src,
  alt,
  shot,
  slot,
  sizes,
  priority = false,
  className = '',
  imageClassName = '',
  labelPosition = 'center',
}: {
  src: string | null
  alt: string
  /** The brief for the photographer, in client language, not a filename. */
  shot: string
  /** Key into lib/placeholders.ts, used only while `src` is null. */
  slot?: string
  sizes: string
  priority?: boolean
  className?: string
  imageClassName?: string
  /** 'bottom' keeps the shot brief clear of copy laid over the plate. */
  labelPosition?: 'center' | 'bottom'
}) {
  const resolved = src ?? placeholderFor(slot)

  if (resolved) {
    return (
      <div className={`overflow-hidden bg-emerald ${className}`}>
        <Image
          src={resolved}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${imageClassName}`}
        />
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden bg-emerald bg-[radial-gradient(120%_90%_at_50%_0%,var(--color-emerald-lift)_0%,var(--color-ink-raised)_78%)] ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 border border-gold/20"
      />
      <span
        className={`absolute inset-x-0 flex flex-col items-center gap-3 px-6 text-center ${
          labelPosition === 'bottom'
            ? 'bottom-[max(3rem,9vw)]'
            : 'inset-y-0 justify-center'
        }`}
      >
        <span aria-hidden="true" className="block h-px w-8 bg-gold/50" />
        {/* dir="ltr" because the shot brief is always English: it is a note to
            the client's photographer, not page copy. Left to inherit rtl, its
            trailing full stop jumps to the front of the line. */}
        <span
          dir="ltr"
          className="max-w-[22ch] text-[0.6875rem] leading-relaxed tracking-[0.18em] text-gold/70 uppercase"
        >
          {shot}
        </span>
      </span>
    </div>
  )
}
