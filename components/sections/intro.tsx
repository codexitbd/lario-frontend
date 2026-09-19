import type { CSSProperties } from 'react'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { SectionHeader } from '@/components/ui/section-header'
import {
  cuisineCardSchema,
  readList,
  readNestedImage,
  readText,
  type Bag,
} from '@/components/sections/content'

/**
 * Reference 01-intro: a bone ground, a centred statement, and three tall
 * portrait cards with an inset hairline frame, the cuisine named across the
 * bottom, its description arriving on hover behind a gold glow.
 *
 * The first light section on the page. The reference alternates light and dark
 * grounds and that rhythm is the design — see the note at the top of
 * globals.css before changing it.
 *
 * The cards are deliberately not links. Cuisine is not a route — the menu
 * taxonomy is course-based (decision D6), so there is no /italian page to point
 * at and inventing one breaks the moment a category is renamed.
 *
 * Touch devices have no hover, so `.lr-hover-copy` unhides the description
 * outright under `@media (hover: none)` rather than burying it behind a
 * gesture that never fires.
 */
const SHOTS: Record<string, string> = {
  italian: 'Wood-fired pizza or hand-rolled pasta.',
  turkish: 'Charcoal kebab or a mezze spread.',
  argentine: 'Asado over open coals.',
}

export function Intro({ section }: { section: { payload: Bag; content: Bag } }) {
  const { payload, content } = section
  const cards = readList(content, 'cards', cuisineCardSchema)

  return (
    <section className="relative bg-bone py-24 md:py-36">
      <Container>
        <SectionHeader
          eyebrow={readText(content, 'eyebrow')}
          heading={readText(content, 'heading')}
          subheading={readText(content, 'subheading')}
          treatment="kicker"
          align="center"
          tone="light"
        />

        <ul className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3 lg:gap-8">
          {cards.map((card, index) => (
            <li
              key={card.key}
              className="lr-reveal group relative aspect-[3/4] overflow-hidden transition-shadow duration-500 ease-brand hover:shadow-[0_0_0_1px_var(--color-gold-deep),0_30px_70px_-28px_color-mix(in_srgb,var(--color-gold-deep)_60%,transparent)]"
              style={{ '--i': index } as CSSProperties}
            >
              <Figure
                src={readNestedImage(payload, ['cuisines', card.key])}
                slot={`home.cuisine.${card.key}`}
                alt=""
                shot={SHOTS[card.key] ?? card.title}
                sizes="(min-width: 768px) 33vw, 100vw"
                className="absolute inset-0"
                imageClassName="transition-transform duration-700 ease-brand group-hover:scale-[1.06]"
              />

              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-4 border border-ivory/35 transition-colors duration-500 ease-brand group-hover:border-gold/80"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_2%,color-mix(in_srgb,var(--color-ink)_45%,transparent)_42%,transparent_78%)] transition-opacity duration-500 group-hover:opacity-95"
              />

              {/* Card copy stays ivory-on-photograph even though the section
                  ground is bone: the tile itself is a dark surface. */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-8 pb-10 text-center">
                <h3 className="lr-display text-2xl text-ivory md:text-[1.75rem]">
                  {card.title}
                </h3>
                <div className="lr-hover-copy grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-500 ease-brand group-hover:grid-rows-[1fr] group-hover:opacity-100">
                  <p className="max-w-[30ch] overflow-hidden text-sm leading-relaxed text-ivory-dim">
                    <span className="mt-3 block">{card.body}</span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
