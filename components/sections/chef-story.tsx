import type { CSSProperties } from 'react'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { readImage, readText, type Bag } from '@/components/sections/content'

/**
 * Our story, rebuilt 2026-10-29 at client request: "simple yet elegant". The
 * 2026-10-15 layered spread (poster heading, floating photos, word-by-word ink)
 * read as too much, and the client then dropped the two branch photos and the
 * two "meet us" buttons. What is left is a quiet split on bone:
 *
 *   start   kicker, heading, the subheading as a lead, the story in body type.
 *   end     the section photograph, portrait, with the inset hairline frame.
 *
 * Stacked on phones: words, then photograph. Motion is the site's own
 * materials, nothing bespoke.
 */
const FRAME = 'pointer-events-none absolute inset-3 border border-ivory/45 md:inset-4'

export function ChefStory({ section }: { section: { payload: Bag; content: Bag } }) {
  const { payload, content } = section

  return (
    <section className="bg-bone py-24 text-ink md:py-32">
      <Container className="grid gap-y-12 lg:grid-cols-12 lg:items-center lg:gap-x-12">
        <div className="lg:col-span-5">
          <p className="lr-display lr-reveal text-xl text-gold-ink italic md:text-2xl">
            {readText(content, 'eyebrow')}
          </p>
          <h2 className="lr-display lr-unmask mt-3 pb-1 text-[clamp(2.25rem,1.6rem+2.4vw,3.25rem)] leading-[1.05] text-balance">
            {readText(content, 'heading')}
          </h2>
          <p className="lr-reveal mt-8 max-w-[38ch] text-lg leading-relaxed text-pretty md:text-xl" style={{ '--i': 1 } as CSSProperties}>
            {readText(content, 'subheading')}
          </p>
          <p className="lr-reveal mt-6 max-w-[56ch] leading-relaxed text-pretty text-ink-soft" style={{ '--i': 2 } as CSSProperties}>
            {readText(content, 'body')}
          </p>
        </div>

        <div className="relative aspect-[4/5] lg:col-span-6 lg:col-start-7">
          <Figure
            src={readImage(payload, 'image')}
            alt=""
            slot="home.chef-story"
            shot="The kitchen team at the open grill."
            sizes="(min-width: 1400px) 640px, (min-width: 1024px) 50vw, 100vw"
            className="lr-focus absolute inset-0"
          />
          <span aria-hidden="true" className={FRAME} />
        </div>
      </Container>
    </section>
  )
}
