import type { CSSProperties } from 'react'
import { Container } from '@/components/ui/container'
import { SectionCta } from '@/components/sections/section-cta'
import { Figure } from '@/components/ui/figure'
import { readImage, readList, readText, storyRoomSchema, type Bag, type StoryRoom } from '@/components/sections/content'
import type { Locale } from '@/lib/i18n/config'

/**
 * Our story, rebuilt 2026-10-15 at client request: the reference 04 split read
 * as bland, and a first pass with one photograph on bone still read as simple.
 * Same admin fields; the composition is a layered spread on bone, every motion
 * in it CSS on a view() timeline, so it costs no JavaScript.
 *
 *   the title    the heading at poster scale, the eyebrow hung in the margin.
 *   the spread   three photographs at three depths. The main photo opens from
 *                a slit (`.lr-hearth`) over a warm glow; the admin's "Smaller
 *                photos" (`content.rooms`, up to two, each with a title and a
 *                line beneath) float over its corners at their own speeds
 *                (`.lr-float`). Seeded with the two branches, which the
 *                subheading names in order. The captions are not links: the
 *                admin's two buttons below already go to the rooms, and one
 *                intent gets one control. With no rooms the main photo stands
 *                alone at the full width of the spread.
 *   the telling  the story set large in Bodoni behind a gold initial, each word
 *                inking in as the paragraph crosses the viewport
 *                (`.lr-telling`). Words split on whitespace only, which holds
 *                for Arabic: its letters join within a word, never across.
 *
 * Every animation sits behind @supports and prefers-reduced-motion with no base
 * clip, offset or colour, so without them the section is simply fully drawn.
 */
const FRAME = 'pointer-events-none absolute inset-3 border border-ivory/45 md:inset-4'

export function ChefStory({
  section,
  locale,
}: {
  section: { payload: Bag; content: Bag }
  locale: Locale
}) {
  const { payload, content } = section
  const words = readText(content, 'body').split(/\s+/).filter(Boolean)
  const [first, second] = readList(content, 'rooms', storyRoomSchema)
  const rooms = Boolean(first || second)

  return (
    <section className="relative overflow-clip bg-bone py-24 text-ink md:py-36">
      <Container>
        <header className="grid gap-y-5 lg:grid-cols-12 lg:gap-x-12">
          <p className="lr-display lr-reveal pb-1 text-xl leading-[1.15] text-gold-ink italic md:text-2xl lg:col-span-3 lg:pt-[0.9em]">
            {readText(content, 'eyebrow')}
          </p>
          <div className="lg:col-span-9">
            <h2 className="lr-display lr-unmask max-w-[13ch] pb-2 text-[clamp(3rem,1.2rem+6.4vw,8.25rem)] leading-[0.98] text-balance">
              {readText(content, 'heading')}
            </h2>
            <p className="lr-reveal mt-8 max-w-[42ch] text-lg leading-relaxed text-pretty text-ink-soft md:mt-10 md:text-xl">
              {readText(content, 'subheading')}
            </p>
          </div>
        </header>

        <div className={`relative isolate mt-16 md:mt-24 ${rooms ? 'lg:mt-40 lg:h-[min(50rem,56vw)]' : ''}`}>
          <div
            aria-hidden="true"
            className="lr-drift pointer-events-none absolute -inset-x-[10%] -top-[20%] -z-10 h-[120%] bg-[radial-gradient(42%_48%_at_58%_52%,color-mix(in_srgb,var(--color-gold)_30%,transparent)_0%,color-mix(in_srgb,var(--color-gold)_10%,transparent)_48%,transparent_74%)]"
          />

          <div className={`lr-hearth relative aspect-[4/5] overflow-clip sm:aspect-[5/4] ${rooms ? 'lg:absolute lg:start-0 lg:top-0 lg:h-[86%] lg:w-[58%] lg:aspect-auto' : 'lg:aspect-[21/9]'}`}>
            <Figure
              src={readImage(payload, 'image')}
              alt=""
              slot="home.chef-story"
              shot="The kitchen team at the open grill."
              sizes={rooms ? '(min-width: 1400px) 760px, (min-width: 1024px) 58vw, 100vw' : '(min-width: 1400px) 1304px, 100vw'}
              className="absolute inset-0"
            />
            <span aria-hidden="true" className={FRAME} />
          </div>

          {rooms ? (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:contents">
              {first ? (
                <Room
                  room={first}
                  slot="home.chef-story.room.0"
                  sizes="(min-width: 1400px) 400px, (min-width: 1024px) 30vw, 50vw"
                  className="lg:absolute lg:end-0 lg:-top-[15%] lg:w-[30%]"
                  drift={{ '--lr-from': '5rem', '--lr-to': '-5rem' }}
                />
              ) : null}
              {second ? (
                <Room
                  room={second}
                  slot="home.chef-story.room.1"
                  sizes="(min-width: 1400px) 330px, (min-width: 1024px) 24vw, 50vw"
                  className="mt-16 lg:absolute lg:start-[50%] lg:bottom-0 lg:mt-0 lg:w-[25%]"
                  frameClassName="lg:border-[10px] lg:border-bone"
                  captionClassName="lg:absolute lg:start-full lg:bottom-3 lg:w-[16rem] lg:ps-8"
                  drift={{ '--lr-from': '8rem', '--lr-to': '-2rem' }}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-20 grid md:mt-28 lg:mt-36 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-9 lg:col-start-4">
            <p className="lr-display lr-telling text-[clamp(1.5rem,1rem+1.5vw,2.375rem)] leading-[1.32] text-pretty">
              {words.map((word, index) => (
                <span key={index} style={{ '--p': index / words.length } as CSSProperties}>
                  {word}{index < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
            <div className="lr-reveal mt-12 flex flex-col items-start gap-5 sm:flex-row sm:gap-x-10 md:mt-16">
              <SectionCta payload={payload} locale={locale} label={readText(content, 'cta_label')} variant="quiet" tone="light" />
              <SectionCta payload={payload} linkKey="secondary_cta" locale={locale} label={readText(content, 'secondary_cta_label')} variant="quiet" tone="light" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

/** One smaller photo, floating over the main one at its own depth. */
function Room({
  room,
  slot,
  sizes,
  className,
  frameClassName = '',
  captionClassName = '',
  drift,
}: {
  room: StoryRoom
  slot: string
  sizes: string
  className: string
  frameClassName?: string
  captionClassName?: string
  drift: Record<'--lr-from' | '--lr-to', string>
}) {
  return (
    <figure className={`lr-float relative z-10 ${className}`} style={drift as CSSProperties}>
      <div className={`relative aspect-[4/5] overflow-clip bg-bone ${frameClassName}`}>
        {/* Decorative: the caption beneath names what is shown. */}
        <Figure
          src={room.image ?? null}
          alt=""
          slot={slot}
          shot={room.title}
          sizes={sizes}
          className="absolute inset-0"
        />
        <span aria-hidden="true" className={FRAME} />
      </div>
      <figcaption className={`mt-4 ${captionClassName}`}>
        <span className="lr-display block text-lg leading-snug md:text-xl">{room.title}</span>
        {room.caption ? <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{room.caption}</span> : null}
      </figcaption>
    </figure>
  )
}
