import type { CSSProperties } from 'react'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import { HeroVideo } from '@/components/sections/hero-video'
import { readImage, readText, type Bag } from '@/components/sections/content'
import { localePath } from '@/lib/i18n/config'
import { PLACEHOLDER_HERO_VIDEO, placeholderFor } from '@/lib/placeholders'
import type { Locale } from '@/lib/i18n/config'

const HERO_SLOT = 'home.hero'

/**
 * Reference 00-hero: the film fills the viewport, the type sits over it, and
 * nothing else competes.
 *
 * Full-bleed and full-height. Three text elements and a pair of CTAs, and
 * deliberately nothing beneath them — no branch strip, no scroll cue, no
 * shaped bottom edge. The hero's job is the value proposition and the primary
 * action; the branches get a whole section of their own further down.
 *
 * The photograph is the LCP element and carries `priority`; the YouTube film
 * layers on top once the browser is idle. See hero-video.tsx for why that
 * order is not negotiable.
 *
 * The scrim is neutral, not emerald. Tinting it with --color-ink pushed green
 * through the whole frame and made the footage look colour-graded rather than
 * lit.
 */
export function Hero({
  section,
  locale,
}: {
  section: { payload: Bag; content: Bag }
  locale: Locale
}) {
  const { payload, content } = section
  const heading = readText(content, 'heading')
  const background = readImage(payload, 'background_image')
  // The scrim follows what will actually render, not just the fixture: a
  // stand-in photograph needs scrimming exactly as much as a real one, and the
  // empty plate needs the lighter vignette instead.
  const hasPhoto = Boolean(background ?? placeholderFor(HERO_SLOT))
  // `payload.video` is the contract's own field (03-api-contract.md). Null
  // until the client supplies their film, so a stand-in stands in.
  const videoId = readText(payload, 'video') || PLACEHOLDER_HERO_VIDEO

  return (
    <section className="relative isolate flex min-h-[100dvh] flex-col justify-center overflow-hidden py-24">
      <Figure
        src={background}
        slot={HERO_SLOT}
        alt=""
        shot="Wide hero. The room and the fire, evening service."
        sizes="100vw"
        priority
        labelPosition="bottom"
        className="absolute inset-0 -z-20"
      />

      {videoId ? <HeroVideo videoId={videoId} title={heading} /> : null}

      {hasPhoto ? (
        <>
          {/* Light enough to keep the footage's own colour, heavy enough to
              hold the type at AA. A flat full-cover tint is what made this
              read as a green wash, so the weight lives in the edges and in a
              soft pool behind the copy instead. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-[5] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-scrim)_80%,transparent)_0%,color-mix(in_srgb,var(--color-scrim)_20%,transparent)_30%,color-mix(in_srgb,var(--color-scrim)_26%,transparent)_64%,color-mix(in_srgb,var(--color-scrim)_86%,transparent)_100%)]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-[5] bg-[radial-gradient(56%_44%_at_50%_50%,color-mix(in_srgb,var(--color-scrim)_52%,transparent)_0%,transparent_74%)]"
          />
        </>
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-[5] bg-[radial-gradient(85%_70%_at_50%_45%,transparent_0%,color-mix(in_srgb,var(--color-ink)_70%,transparent)_100%)]"
        />
      )}

      <Container className="relative flex flex-col items-center text-center">
        {readText(content, 'eyebrow') ? (
          <p className="lr-reveal flex items-center gap-4 text-[0.6875rem] tracking-[0.24em] text-gold uppercase">
            <span aria-hidden="true" className="hidden h-px w-10 bg-gold/40 sm:block" />
            {readText(content, 'eyebrow')}
            <span aria-hidden="true" className="hidden h-px w-10 bg-gold/40 sm:block" />
          </p>
        ) : null}

        <h1
          className="lr-display lr-reveal mt-6 max-w-[26ch] text-[clamp(2.25rem,1.1rem+4.2vw,4.25rem)] leading-[1.06] text-ivory"
          style={{ '--i': 1 } as CSSProperties}
        >
          {heading}
        </h1>

        <p
          className="lr-reveal mt-6 max-w-[46ch] text-base leading-relaxed text-ivory-dim md:text-lg"
          style={{ '--i': 2 } as CSSProperties}
        >
          {readText(content, 'subheading')}
        </p>

        <div
          className="lr-reveal mt-10 flex flex-col items-center gap-4 sm:flex-row"
          style={{ '--i': 3 } as CSSProperties}
        >
          <Cta href={localePath(locale, '/reservation')} variant="solid">
            {readText(content, 'cta_label')}
          </Cta>
          <Cta href={localePath(locale, '/menu')} variant="outline">
            {readText(content, 'secondary_cta_label')}
          </Cta>
        </div>
      </Container>
    </section>
  )
}
