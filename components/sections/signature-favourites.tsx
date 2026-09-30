'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react/ssr'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import { SectionHeader } from '@/components/ui/section-header'
import { readText, type Bag } from '@/components/sections/content'
import { formatPrice } from '@/lib/format'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { MenuItemCard } from '@/lib/schemas'

/**
 * Signature favourites. Replaces the five-column mosaic that followed reference
 * 02-featured-dishes; the client asked for a filmstrip instead, and every card
 * now takes the treatment the mosaic reserved for its hero tile — the plate
 * full-bleed, the naming laid over its base.
 *
 * Four cards tile the full width at 25% each. Hover one and it opens to a TRUE
 * square while its three neighbours give up the difference. The square is exact
 * rather than eyeballed because the expanded width and the strip height are the
 * same custom property, `--lr-fav-h` in globals.css; that is also why the
 * height is clamped at both ends, since an uncapped one would outgrow the
 * viewport on a wide monitor and an unfloored one leaves the three squeezed
 * neighbours under ~170px at 1024, with nowhere for a dish name to wrap.
 *
 * The carousel advances ONE card at a time, not a page of four: the track slides
 * by exactly 25% every few seconds, so one dish enters at the trailing edge and
 * one leaves at the leading edge while the middle two only shift. Eight dishes
 * feed four slots (D8 amended again — see the spec), which is what makes the
 * rotation carry new information instead of shuffling the same four.
 *
 * Why this is the fifth client component on the page rather than CSS like the
 * gallery marquee: a marquee is one infinite translate and needs no state, but a
 * stepped advance has to know which step it is on, stop on hover, and follow
 * keyboard focus. Nothing static is nested inside it.
 *
 * The three mechanisms are kept from fighting each other:
 *
 *   the slide     runs only while `phase` is 'next' or 'prev', which is also
 *                 the only state the track's transform transitions in
 *   the accordion CSS `:has()`, gated to `phase === 'rest'`, so pointer travel
 *                 across four cards costs no React render at all
 *   autoplay      paused by pointer and by focus anywhere in the section, and
 *                 off entirely under `prefers-reduced-motion` or below `lg`
 *
 * The loop rotates flex `order` rather than translating an ever-growing track,
 * and it holds ONE card of lead-in: card `i` sits at position `(i - head + 1)
 * mod 8`, the strip rests translated one card left, so position 0 waits off the
 * LEADING edge, 1-4 are the four on screen and 5-7 wait off the trailing edge.
 *
 * That lead-in is what makes the arrows symmetrical. Travel in either direction
 * is a single commit: 'next' translates to two cards, 'prev' to none, and
 * landing either one moves `head` and returns the rest step in the same commit,
 * which is the identical frame the slide arrived at. Without a card waiting off
 * the leading edge, 'prev' would have to rotate order first and suppress the
 * transition for a frame before it could animate, which is two commits and a
 * style flush for the same result.
 *
 * The first cut of this duplicated the leading four cards at the track's end to
 * get that seamless wrap, and made the copies `inert` to keep them out of the
 * tab order. Measured in the browser, that was wrong: at `head` 5, 6 and 7 up to
 * THREE of the four cards on screen were copies, so for most of a lap the reader
 * was looking at cards that could not be hovered or clicked. Rotating order has
 * no copies to go wrong — every card on screen is the real, interactive one,
 * eight DOM nodes instead of twelve, and nothing is hidden from a screen reader.
 *
 * Below `lg` none of it applies: `order` and the transform are both inside the
 * lg media query, so the strip is a native scroll-snap row of all eight square
 * cards in fixture order, which is the same idea driven by the thumb. The arrows
 * hide there for the same reason.
 *
 * The arrows are the WCAG 2.2.2 control. They and focus-follow both keep working
 * under `prefers-reduced-motion`, where only autoplay stops: that preference
 * means do not move things AT the reader, not refuse to move when the reader
 * asks. They land instantly there rather than sliding.
 */
const VISIBLE = 4
const DWELL_MS = 4200
// A shade longer than the CSS transition it lands, so timer drift can never cut
// the slide off a frame early and snap it to the end.
const SLIDE_MS = 960

/** Rest 25vw, open 45vw, and a square tile on the scroll-snap row below lg. */
const SIZES = '(min-width: 64rem) 45vw, (min-width: 30rem) 22rem, 78vw'

function Card({
  item,
  locale,
  viewLabel,
  onFocus,
}: {
  item: MenuItemCard
  locale: Locale
  viewLabel: string
  onFocus?: () => void
}) {
  return (
    <Link
      href={localePath(locale, item.url)}
      onFocus={onFocus}
      className="group relative flex h-full w-full items-end overflow-hidden"
    >
      <Figure
        src={item.image}
        alt=""
        shot={item.name}
        sizes={SIZES}
        className="absolute inset-0 -z-10"
        imageClassName="transition-transform duration-[1200ms] ease-brand group-hover:scale-[1.05]"
      />
      {/* --color-scrim, not --color-ink: the token exists because tinting a
          photograph with the section's own ground makes the food read as
          colour-graded rather than lit. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--color-scrim)_4%,color-mix(in_srgb,var(--color-scrim)_58%,transparent)_36%,transparent_76%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 border border-ivory/35 transition-colors duration-500 ease-brand group-hover:border-gold/80"
      />

      <span className="relative w-full px-7 pb-8 text-start lg:px-8 lg:pb-9">
        <span className="block text-[0.625rem] tracking-[0.22em] text-gold uppercase">
          {item.category.name}
        </span>
        {/* cqi, so the name grows with the card as the accordion opens it and
            there is nothing to transition: 18px on a squeezed neighbour, 34px
            on the open square. The li is the query container. */}
        <span className="lr-display mt-2 block text-[clamp(1rem,4.6cqi,2.125rem)] leading-[1.12] text-ivory">
          {item.name}
        </span>
        <span className="lr-hover-copy grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-500 ease-brand group-hover:grid-rows-[1fr] group-hover:opacity-100">
          <span className="flex flex-wrap items-baseline gap-x-5 gap-y-2 overflow-hidden">
            <span className="lr-display mt-4 block text-lg text-gold">
              {formatPrice(item.price, item.currency, locale)}
            </span>
            <span className="mt-4 block border-b border-gold/40 pb-1 text-[0.6875rem] tracking-[0.18em] text-gold uppercase transition-colors duration-300 group-hover:border-gold">
              {viewLabel}
            </span>
          </span>
        </span>
      </span>
    </Link>
  )
}

export function SignatureFavourites({
  section,
  locale,
  dict,
}: {
  section: { content: Bag; items?: MenuItemCard[] }
  locale: Locale
  dict: Dictionary
}) {
  const { content, items = [] } = section
  const count = items.length

  const [head, setHead] = useState(0)
  const [phase, setPhase] = useState<'rest' | 'next' | 'prev'>('rest')
  const [paused, setPaused] = useState(false)
  // Two conditions, NOT one. They were bundled at first and it cost a reader on
  // prefers-reduced-motion the ability to Tab through the strip at all: with
  // autoplay off and focus-follow off with it, the window froze on the first
  // four cards while Tab walked through all eight, so four of them took focus
  // while off screen. Reduced motion means do not MOVE things at the reader,
  // not refuse to move when the reader asks.
  //
  //   narrow    below lg, where `order` and the transform are both outside the
  //             media query and the strip is a plain scroll-snap row. Nothing
  //             the carousel does has any effect, so it does nothing.
  //   reduced   prefers-reduced-motion. Autoplay stops; the arrows and
  //             focus-follow keep working and land instantly, because the
  //             global reduce block collapses the transition.
  //
  // Both start true so the server-rendered strip never claims motion it has not
  // measured the conditions for; the effect below settles them on mount.
  const [narrow, setNarrow] = useState(true)
  const [reduced, setReduced] = useState(true)

  useEffect(() => {
    const queries = [
      [window.matchMedia('(max-width: 63.9375rem)'), setNarrow],
      [window.matchMedia('(prefers-reduced-motion: reduce)'), setReduced],
    ] as const
    const syncs = queries.map(([query, set]) => {
      const sync = () => set(query.matches)
      sync()
      query.addEventListener('change', sync)
      return () => query.removeEventListener('change', sync)
    })
    return () => syncs.forEach((off) => off())
  }, [])

  useEffect(() => {
    if (narrow || reduced || paused || count <= VISIBLE) return
    const timer = window.setInterval(() => setPhase('next'), DWELL_MS)
    return () => window.clearInterval(timer)
  }, [narrow, reduced, paused, count])

  // Landing the slide is what makes the loop seamless, and it leans on the CSS
  // transitioning ONLY while `data-motion` is a direction. Moving `head` rotates
  // every card's flex order by one while the step returns to rest, in the same
  // commit: the cards shift one slot one way and the track shifts one slot the
  // other, which is exactly the frame the slide had already reached. With the
  // transition gone by then, nothing slides back to get there.
  useEffect(() => {
    if (phase === 'rest') return
    const delta = phase === 'next' ? 1 : -1
    const timer = window.setTimeout(
      () => {
        setHead((current) => (current + delta + count) % count)
        setPhase('rest')
      },
      // The arrows are locked out until the slide lands, so under reduced
      // motion, where the global reduce block collapses the transition to
      // nothing, the wait has to collapse with it. Left at SLIDE_MS it was a
      // second of dead time after a move the reader had already seen finish,
      // and every second press of an arrow was swallowed.
      reduced ? 0 : SLIDE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [phase, count, reduced])

  if (count === 0) return null

  // Keyboard travel outranks autoplay: a card focused off the trailing edge
  // rotates to the last visible position rather than leaving the reader on a
  // card they cannot see. It jumps rather than slides, deliberately — the
  // transform only transitions mid-advance, so Tab lands immediately instead of
  // spending a second animating.
  const follow = (index: number) => {
    if (narrow || phase !== 'rest') return
    setHead((current) => {
      // Position 0 is the lead-in waiting off the leading edge, so the four on
      // screen are 1 through 4 and the card at position p is index head+p-1.
      const position = (index - current + 1 + count) % count
      if (position >= 1 && position <= VISIBLE) return current
      // Behind the window, which is where Shift+Tab arrives: bring it to the
      // leading edge, one card of travel. Ahead: to the trailing edge, so the
      // reader keeps the cards they have just passed.
      return position === 0
        ? index
        : (index - VISIBLE + 1 + count) % count
    })
  }

  // The arrows are ignored mid-slide rather than queued: a second press should
  // not bank travel the reader then has to watch play out.
  const go = (direction: 'next' | 'prev') => {
    if (phase !== 'rest') return
    setPhase(direction)
  }

  // Rest sits one card in, which is the lead-in; a direction is one card either
  // side of it. Never more than one card of travel.
  const step = phase === 'next' ? 2 : phase === 'prev' ? 0 : 1

  return (
    <section
      className="relative isolate overflow-hidden bg-ink py-24 md:py-32"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Serrated edge carried down from the intro section above (reference
          01-intro-bottom), in that section's bone so the teeth read against
          this one's ink. The backdrop drifts behind it on scroll. */}
      <span
        aria-hidden="true"
        className="lr-teeth pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-bone"
      />
      <span
        aria-hidden="true"
        className="lr-drift pointer-events-none absolute inset-x-0 -top-[10%] -z-10 h-[120%] bg-[radial-gradient(70%_50%_at_50%_10%,color-mix(in_srgb,var(--color-gold)_9%,transparent)_0%,transparent_70%)]"
      />

      {/* The arrows sit at the header's end edge, against the start-aligned
          heading: a control belongs next to the thing it drives, and the strip
          begins directly below. They are hidden below lg, where the strip is a
          native scroll-snap row and the thumb is the control. */}
      <Container className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
        <SectionHeader
          eyebrow={readText(content, 'eyebrow')}
          heading={readText(content, 'heading')}
          subheading={readText(content, 'subheading')}
          treatment="kicker"
          align="start"
          className="flex-1 basis-[26rem]"
        />

        {count > VISIBLE ? (
          <div className="lr-reveal hidden shrink-0 gap-2 lg:flex">
            <button
              type="button"
              onClick={() => go('prev')}
              aria-label={dict.actions.previous}
              className="flex size-11 items-center justify-center border border-gold/35 text-gold transition-colors duration-300 hover:border-gold hover:bg-gold/10"
            >
              {/* Logical flip: "previous" points at the start edge, which is
                  the right-hand side in Arabic. */}
              <CaretLeftIcon aria-hidden="true" className="size-4 rtl:hidden" />
              <CaretRightIcon
                aria-hidden="true"
                className="hidden size-4 rtl:block"
              />
            </button>
            <button
              type="button"
              onClick={() => go('next')}
              aria-label={dict.actions.next}
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
        ) : null}
      </Container>

      {/* One `.lr-plate` on the strip rather than one per card: the whole
          filmstrip settles in as a single plate, and a view() timeline on a
          card INSIDE this scroll container would resolve against the container
          instead of the page and never fire.

          `overflow-clip` at lg, not `hidden`: hidden still scrolls
          programmatically, so the browser's own scroll-a-focused-element-into-
          view slides the strip sideways and desyncs it from the transform.
          Below lg the scroll container is the point, so there it stays auto. */}
      <div
        className="lr-fav-strip lr-plate mt-14 snap-x snap-mandatory overflow-x-auto overflow-y-hidden px-5 sm:px-8 lg:mt-20 lg:snap-none lg:overflow-clip lg:px-0"
      >
        <ul
          data-motion={phase}
          style={{ '--lr-fav-step': step } as CSSProperties}
          className="lr-fav-track flex items-start gap-4 lg:h-full lg:items-stretch lg:gap-0"
        >
          {items.map((item, index) => (
            <li
              key={item.slug}
              style={
                {
                  '--lr-fav-order': (index - head + 1 + count) % count,
                } as CSSProperties
              }
              className="@container relative aspect-square snap-center lg:aspect-auto"
            >
              <Card
                item={item}
                locale={locale}
                viewLabel={dict.actions.viewDetails}
                onFocus={() => follow(index)}
              />
            </li>
          ))}
        </ul>
      </div>

      <Container className="lr-reveal mt-16 flex justify-center">
        <Cta href={localePath(locale, '/menu')} variant="outline">
          {readText(content, 'cta_label')}
        </Cta>
      </Container>
    </section>
  )
}
