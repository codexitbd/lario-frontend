import type { CSSProperties } from 'react'
import { z } from 'zod'
import { ForkKnifeIcon } from '@phosphor-icons/react/ssr'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import {
  eventCardSchema,
  readList,
  readText,
  statSchema,
  type Bag,
} from '@/components/sections/content'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * Reference 06-private-events, followed as drawn.
 *
 * A photographic band carries a centred ornament, an italic display headline
 * and one line of support. Beneath it sits a row of portrait cards, each a
 * photograph inside an inset hairline frame with its name centred on it — and
 * the row is pulled UP so the cards straddle the lower edge of that band, top
 * half over the photograph, bottom half over solid ink. The straddle is the
 * device; without it the section is just a header and a grid.
 *
 * The previous build shared nothing with the reference but the card count:
 * flat bordered text boxes on a tinted ground, no photographs, no ornament, no
 * straddle.
 *
 * Square corners, not the reference's rounded ones — this page keeps one corner
 * system throughout, per the client's note on this section.
 *
 * Content stays ours. The reference's cards carry a name and nothing else, so
 * the card body arrives on hover rather than being dropped, and the statistic
 * the spec asks for sits above the name in gold. Stat values are content
 * (`payload.stats`); their units are UI strings in messages/*.json, paired
 * positionally with the cards as the fixture authors them.
 */
export function PrivateEvents({
  section,
  locale,
  dict,
}: {
  section: { payload: Bag; content: Bag }
  locale: Locale
  dict: Dictionary
}) {
  const { payload, content } = section
  const cards = readList(content, 'cards', eventCardSchema)
  const stats = readList(payload, 'stats', statSchema)
  const href = z.string().safeParse(payload.cta_href).data ?? '/reservation'
  const units: Record<string, string> = dict.sections.privateEvents.stats

  return (
    <section className="relative isolate bg-ink pb-24 md:pb-32">
      {/* The photographic band. Its bottom padding is exactly what the card row
          is pulled back up through, so the two values move together. */}
      <div className="relative isolate overflow-hidden pt-24 pb-56 md:pt-32 md:pb-80">
        <Figure
          src={null}
          slot="home.private-events"
          alt=""
          shot="A table set for a private party, mid-service."
          sizes="100vw"
          className="absolute inset-0 -z-20"
        />
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/85" />
        {/* Fades the band into the solid ground the cards drop onto, so the
            straddle reads as one surface rather than two stacked blocks. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-[linear-gradient(to_bottom,transparent_0%,var(--color-ink)_92%)]"
        />

        <Container>
          <div className="lr-reveal flex flex-col items-center text-center">
            <ForkKnifeIcon
              aria-hidden="true"
              weight="thin"
              className="size-10 text-gold md:size-12"
            />

            {readText(content, 'eyebrow') ? (
              <p className="mt-6 flex items-center gap-4 text-[0.6875rem] tracking-[0.24em] text-gold uppercase">
                <span
                  aria-hidden="true"
                  className="hidden h-px w-10 bg-gold/40 sm:block"
                />
                {readText(content, 'eyebrow')}
                <span
                  aria-hidden="true"
                  className="hidden h-px w-10 bg-gold/40 sm:block"
                />
              </p>
            ) : null}

            {/* Italic, as the reference sets it. pb-2 and the loosened leading
                keep the descender in "Dining" off the line below. */}
            <h2 className="lr-display mt-5 max-w-[18ch] pb-2 text-[clamp(2rem,1.2rem+3.2vw,3.75rem)] leading-[1.2] text-ivory italic">
              {readText(content, 'heading')}
            </h2>

            <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-ivory-dim">
              {readText(content, 'subheading')}
            </p>
          </div>
        </Container>
      </div>

      <Container className="-mt-48 md:-mt-72">
        <ul className="grid gap-5 sm:grid-cols-3 lg:gap-7">
          {cards.map((card, index) => {
            const stat = stats[index]
            return (
              <li
                key={card.title}
                className="lr-reveal group relative aspect-[3/4] overflow-hidden"
                style={{ '--i': index } as CSSProperties}
              >
                <Figure
                  src={null}
                  slot={`home.events.${index}`}
                  alt=""
                  shot={card.title}
                  sizes="(min-width: 640px) 32vw, 100vw"
                  className="absolute inset-0"
                  imageClassName="transition-transform duration-700 ease-brand group-hover:scale-[1.06]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-4 z-10 border border-ivory/35 transition-colors duration-500 ease-brand group-hover:border-gold/80"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(82%_72%_at_50%_50%,color-mix(in_srgb,var(--color-ink)_86%,transparent)_0%,color-mix(in_srgb,var(--color-ink)_62%,transparent)_100%)]"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                  {stat ? (
                    <p className="flex items-baseline gap-2">
                      <span className="lr-display text-[clamp(2.25rem,1.6rem+1.6vw,3.25rem)] leading-none text-gold">
                        {stat.value}
                      </span>
                      <span className="text-[0.625rem] tracking-[0.2em] text-gold/85 uppercase">
                        {units[stat.key] ?? ''}
                      </span>
                    </p>
                  ) : null}

                  <h3 className="lr-display mt-5 text-2xl leading-snug text-ivory md:text-[1.75rem]">
                    {card.title}
                  </h3>

                  <div className="lr-hover-copy grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-500 ease-brand group-hover:grid-rows-[1fr] group-hover:opacity-100">
                    <p className="max-w-[32ch] overflow-hidden text-sm leading-relaxed text-ivory-dim">
                      <span className="mt-4 block">{card.body}</span>
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="lr-reveal mt-14 flex justify-center">
          <Cta href={localePath(locale, href)} variant="outline">
            {readText(content, 'cta_label')}
          </Cta>
        </div>
      </Container>
    </section>
  )
}
