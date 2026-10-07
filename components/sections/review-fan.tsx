'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import {
  CaretLeftIcon,
  CaretRightIcon,
  StarIcon,
} from '@phosphor-icons/react/ssr'
import { Container } from '@/components/ui/container'
import { SectionHeader } from '@/components/ui/section-header'
import type { Testimonial } from '@/lib/schemas'

/**
 * Guest reviews as a fan of cards, rebuilt 2026-09-30 at client request from a
 * 21st.dev "stagger testimonials" reference. Reference 08-testimonials is
 * superseded (design/NOTES.md).
 *
 * What was taken from the reference is its composition: square cards fanned
 * out from the centre, every other one tilted the opposite way, the centre one
 * lifted and lit, any card clickable to bring it to the middle, arrows beneath.
 * What was NOT taken is its styling. The reference is neo-brutalist (clipped
 * corners, hard offset shadows, lucide icons, shadcn tokens) and this site is
 * not; the cards here are square with the house inset frame, the tilt is the
 * same +-2.5deg the gallery strip's frames already carry, and the centre card
 * is bone lifted off a bone-raised ground (emerald was dropped 2026-09-30 at
 * client request; bone-raised keeps it apart from the bone FAQ below).
 * The reference also measured card size with a resize listener; here the size
 * is a CSS custom property under a media query and the component never reads
 * the viewport.
 *
 * Geometry lives in globals.css (`.lr-fan-card`). React holds one number, the
 * index of the centre card, and writes each card's signed position `--p` inline;
 * CSS turns that into the translate, tilt and lift. Every card keeps a stable
 * key, so an advance is every card gliding one slot, and the one card that has
 * to cross the whole fan to wrap does it at opacity 0, two slots out from the
 * last visible one on either side.
 *
 * The reviews are real Google reviews of the Al Narjis branch, quoted verbatim
 * as contiguous excerpts (content/testimonials.json). No Review or
 * AggregateRating markup is emitted for them: self-served rating markup on
 * CMS-entered testimonials is a Google manual-action risk
 * (02-database-schema.md). The stars are display only.
 *
 * Side cards carry aria-hidden rather than inert, because inert would also
 * swallow the click that brings them to the centre. They hold nothing
 * focusable, so nothing is hidden from the keyboard that the arrows do not
 * reach, and a visually hidden live line announces whose review is centred.
 */
const AUTOPLAY_MS = 1000
/** Cards further out than this on either side are hidden; the wrap happens there. */
const WINGS = 2

export function ReviewFan({
  items,
  eyebrow,
  heading,
  subheading,
  previousLabel,
  nextLabel,
}: {
  items: Testimonial[]
  eyebrow: string
  heading: string
  subheading: string
  previousLabel: string
  nextLabel: string
}) {
  const count = items.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // Starts true so the server-rendered fan never claims autoplay it has not
  // measured the conditions for; the effect settles it on mount.
  const [reduced, setReduced] = useState(true)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (reduced || paused || count < 2) return
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % count),
      AUTOPLAY_MS,
    )
    return () => window.clearInterval(timer)
  }, [reduced, paused, count])

  if (count === 0) return null

  const go = (next: number) => setIndex(((next % count) + count) % count)

  return (
    <section
      className="lr-fan relative overflow-hidden bg-bone-raised py-24 md:py-32"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Container>
        <SectionHeader
          eyebrow={eyebrow}
          heading={heading}
          subheading={subheading}
          treatment="kicker"
          tone="light"
          align="center"
        />
      </Container>

      <p className="sr-only" aria-live="polite">
        {items[index].author_name}
      </p>

      <ul className="lr-fan-stage relative mt-12 h-120 md:mt-16 md:h-136">
        {items.map((item, slide) => {
          // Signed distance from the centre, shortest way round the ring.
          let position = (slide - index + count) % count
          if (position > count / 2) position -= count
          const centre = position === 0
          const odd = Math.abs(position) % 2 === 1

          return (
            <li
              key={`${item.author_name}-${slide}`}
              data-active={centre || undefined}
              data-far={Math.abs(position) > WINGS || undefined}
              aria-hidden={centre ? undefined : 'true'}
              onClick={centre ? undefined : () => go(index + position)}
              style={
                {
                  // Nearer the centre paints on top. Left to DOM order, the
                  // overlap flips side to side as the ring turns, and on one
                  // wing the farther card sat over the nearer one.
                  zIndex: WINGS + 1 - Math.abs(position),
                  '--p': position,
                  '--lr-fan-y': centre ? '-2.5rem' : odd ? '0.9rem' : '-0.9rem',
                  '--lr-fan-r': centre ? '0deg' : odd ? '2.5deg' : '-2.5deg',
                } as CSSProperties
              }
              className="lr-fan-card group absolute inset-s-1/2 top-1/2 bg-ink text-ivory data-active:bg-bone data-active:text-ink data-active:shadow-[0_32px_64px_-24px_var(--color-scrim)] data-far:pointer-events-none data-far:opacity-0 not-data-active:cursor-pointer"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-3 border border-ivory/25 transition-colors duration-500 ease-brand group-hover:border-gold/70 group-data-active:border-ink/15 group-data-active:group-hover:border-ink/15"
              />

              <blockquote className="flex h-full flex-col p-7 md:p-8">
                {item.rating ? (
                  <p
                    className="flex gap-1"
                    // role="img" is what makes the label announce: an
                    // aria-label on a bare <p> is ignored by most screen
                    // readers, which would leave the rating silent.
                    role="img"
                    aria-label={`${item.rating} out of 5`}
                  >
                    {Array.from({ length: item.rating }, (_, star) => (
                      <StarIcon
                        key={star}
                        aria-hidden="true"
                        weight="fill"
                        className="size-3.5 text-gold group-data-active:text-gold-ink"
                      />
                    ))}
                  </p>
                ) : null}

                {/* Four lines on the 18rem card, six on the 22.5rem one. Six at
                    18rem is 250px of stars, quote and byline in a 232px box, and
                    the byline sat over the last line of the quote on a phone. */}
                <p className="lr-display mt-5 line-clamp-4 text-base leading-[1.45] sm:line-clamp-6 sm:text-lg md:text-xl">
                  {item.body}
                </p>

                <footer className="mt-auto pt-5 text-sm">
                  <cite className="not-italic">
                    {/* bdi, so a Latin name in the Arabic page keeps its
                        trailing initial's full stop at the END ("Omar F." was
                        rendering as ".Omar F"), while an Arabic name still
                        runs right to left. */}
                    <span className="block">
                      <bdi>{item.author_name}</bdi>
                    </span>
                    {item.author_title ? (
                      <span className="block text-ivory-dim group-data-active:text-ink-soft">
                        {item.author_title}
                      </span>
                    ) : null}
                  </cite>
                </footer>
              </blockquote>
            </li>
          )
        })}
      </ul>

      {count > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label={previousLabel}
            className="flex size-11 items-center justify-center border border-gold-ink/35 text-gold-ink transition-colors duration-300 hover:border-gold-ink hover:bg-gold-ink/10"
          >
            {/* Logical flip: "previous" points at the start edge, which is the
                right-hand side in Arabic, and the fan itself mirrors with it. */}
            <CaretLeftIcon aria-hidden="true" className="size-4 rtl:hidden" />
            <CaretRightIcon
              aria-hidden="true"
              className="hidden size-4 rtl:block"
            />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label={nextLabel}
            className="flex size-11 items-center justify-center border border-gold-ink/35 text-gold-ink transition-colors duration-300 hover:border-gold-ink hover:bg-gold-ink/10"
          >
            <CaretRightIcon aria-hidden="true" className="size-4 rtl:hidden" />
            <CaretLeftIcon
              aria-hidden="true"
              className="hidden size-4 rtl:block"
            />
          </button>
        </div>
      ) : null}
    </section>
  )
}
