'use client'

import { useEffect, useState } from 'react'
import { CaretLeftIcon, CaretRightIcon, StarIcon } from '@phosphor-icons/react/ssr'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import type { Testimonial } from '@/lib/schemas'

/**
 * Reference 08-testimonials: a photograph on one side with a gold script line
 * running off its corner, and on the other the section title set huge and
 * ghosted behind the quote, with dots and arrows beneath.
 *
 * The previous build had no photograph and put an ordinary heading column
 * where the image belongs, which lost the reference entirely. Both halves now
 * wipe together on advance, per 08-testimonials-next-transition.
 *
 * The ghosted title is the real <h2>, not decoration: it carries the section's
 * heading, and at ivory/50 on emerald it clears 3:1 for large text. Do not
 * lower that opacity to make it prettier — it would leave the section without
 * an accessible heading.
 *
 * The one client component on this page. Everything else is a Server Component
 * with CSS-only motion; a carousel genuinely needs state, autoplay and
 * controls, so it is an isolated leaf that wraps no static content.
 *
 * No Review or AggregateRating markup is emitted for these anywhere. The stars
 * are display only — self-served rating markup on CMS-entered testimonials is a
 * Google manual-action risk (02-database-schema.md).
 */
const AUTOPLAY_MS = 7000

export function Testimonials({
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
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const count = items.length

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (paused || reduced || count < 2) return
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % count),
      AUTOPLAY_MS,
    )
    return () => window.clearInterval(timer)
  }, [paused, reduced, count])

  if (count === 0) return null

  const go = (next: number) => setIndex(((next % count) + count) % count)

  return (
    <section
      className="relative overflow-hidden bg-emerald py-24 md:py-36"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          {/* The photograph, with the eyebrow running off its lower corner the
              way the reference's script line does. */}
          <div className="lr-reveal relative">
            {/* The wipe keys on data-active, which Figure cannot carry, so each
                slide gets a wrapper. All slides share one grid cell, so the
                column sizes to the image and nothing jumps on advance. */}
            <div className="relative grid">
              {items.map((item, slide) => (
                <div
                  key={`photo-${item.author_name}-${slide}`}
                  data-active={slide === index ? 'true' : 'false'}
                  aria-hidden="true"
                  className="lr-wipe col-start-1 row-start-1"
                >
                  <Figure
                    src={null}
                    slot={`home.gallery.${slide % 6}`}
                    alt=""
                    shot="Guests at the table."
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="relative aspect-[4/3] w-full"
                  />
                </div>
              ))}
              {/* The overline runs across the photograph's lower corner, as the
                  reference's script line does. Placeholder frames vary from
                  bright to dark, so it gets a short scrim to sit on rather than
                  relying on whatever happens to be in the bottom of the shot. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(to_top,var(--color-emerald)_10%,transparent_100%)]"
              />
            </div>
            {/* z-10: the slides above establish stacking contexts of their own
                (clip-path and opacity both do), so source order alone does not
                keep this on top. */}
            <p className="lr-display relative z-10 -mt-9 pe-4 text-end text-2xl text-gold italic md:text-3xl">
              {eyebrow}
            </p>
            <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-ivory-dim">
              {subheading}
            </p>
          </div>

          <div className="relative">
            <h2 className="lr-display max-w-[9ch] text-[clamp(3rem,2rem+4.5vw,6rem)] leading-[0.92] text-ivory/50">
              {heading}
            </h2>

            <div className="relative mt-10 grid" aria-live="polite">
              {items.map((item, slide) => (
                <blockquote
                  key={`quote-${item.author_name}-${slide}`}
                  data-active={slide === index ? 'true' : 'false'}
                  inert={slide !== index}
                  className="lr-wipe col-start-1 row-start-1 flex flex-col items-start"
                >
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
                          className="size-4 text-gold"
                        />
                      ))}
                    </p>
                  ) : null}

                  <p className="mt-6 text-xl leading-[1.6] text-ivory md:text-2xl">
                    {item.body}
                  </p>

                  <footer className="mt-8 flex items-center gap-3 text-sm">
                    <span
                      aria-hidden="true"
                      className="block h-px w-8 bg-gold/50"
                    />
                    <cite className="not-italic">
                      <span className="text-ivory">{item.author_name}</span>
                      {item.author_title ? (
                        <span className="text-ivory-dim">
                          {', '}
                          {item.author_title}
                        </span>
                      ) : null}
                    </cite>
                  </footer>
                </blockquote>
              ))}
            </div>

            {count > 1 ? (
              <div className="mt-12 flex items-center gap-6">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => go(index - 1)}
                    aria-label={previousLabel}
                    className="flex size-11 items-center justify-center border border-gold/35 text-gold transition-colors duration-300 hover:border-gold hover:bg-gold/10"
                  >
                    {/* Logical flip: "previous" points at the start edge, which
                        is the right-hand side in Arabic. */}
                    <CaretLeftIcon
                      aria-hidden="true"
                      className="size-4 rtl:hidden"
                    />
                    <CaretRightIcon
                      aria-hidden="true"
                      className="hidden size-4 rtl:block"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(index + 1)}
                    aria-label={nextLabel}
                    className="flex size-11 items-center justify-center border border-gold/35 text-gold transition-colors duration-300 hover:border-gold hover:bg-gold/10"
                  >
                    <CaretRightIcon
                      aria-hidden="true"
                      className="size-4 rtl:hidden"
                    />
                    <CaretLeftIcon
                      aria-hidden="true"
                      className="hidden size-4 rtl:block"
                    />
                  </button>
                </div>

                <ol className="flex items-center gap-2">
                  {items.map((item, slide) => (
                    <li key={`dot-${item.author_name}-${slide}`}>
                      <button
                        type="button"
                        onClick={() => go(slide)}
                        aria-label={item.author_name}
                        aria-current={slide === index}
                        className={`block size-2 transition-colors duration-300 ${
                          slide === index
                            ? 'bg-gold'
                            : 'bg-ivory/25 hover:bg-ivory/50'
                        }`}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}
