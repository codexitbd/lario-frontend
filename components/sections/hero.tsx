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
 * Reference 00-hero: the film fills the viewport and nothing competes with it.
 *
 * BOTTOM-ANCHORED AND ASYMMETRIC, not a centred stack. The type sits on the
 * lower third as a title card, headline on the start side and the lede plus
 * both actions on the end side, which leaves the top ~60% of the frame as pure
 * film. A centred column over full-bleed media is the canonical restaurant
 * move and also the canonical AI one; splitting the base keeps the first and
 * loses the second. It mirrors correctly in RTL because the split is a grid,
 * not a float.
 *
 * THE SCRIM IS EDGE-WEIGHTED. An earlier pass pooled a radial gradient in the
 * middle of the frame to hold centred type, which dimmed the footage exactly
 * where the food is. Weight now lives at the two edges: enough at the top for
 * the fixed header, heavy at the base where the copy actually sits, and the
 * centre left alone so the film keeps its own contrast.
 *
 * MOTION IS TIME-BASED HERE, uniquely on this site. Everything else reveals on
 * a view() timeline, but the hero is above the fold, so a scroll timeline is
 * already past its range at first paint and produced no entrance at all. See
 * `.lr-hero-*` in globals.css. The delays are stated in the markup via --d so
 * the running order reads top to bottom.
 *
 * The photograph is the LCP element and carries `priority`; the YouTube film
 * layers on top once the browser is idle. See hero-video.tsx for why that
 * order is not negotiable.
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
  const eyebrow = readText(content, 'eyebrow')
  const subheading = readText(content, 'subheading')
  const background = readImage(payload, 'background_image')
  // The scrim follows what will actually render, not just the fixture: a
  // stand-in photograph needs scrimming exactly as much as a real one, and the
  // empty plate needs the lighter vignette instead.
  const hasPhoto = Boolean(background ?? placeholderFor(HERO_SLOT))
  // `payload.video` is the contract's own field (03-api-contract.md). Null
  // until the client supplies their film, so a stand-in stands in.
  const videoId = readText(payload, 'video') || PLACEHOLDER_HERO_VIDEO

  return (
    <section className="relative isolate flex min-h-[100dvh] flex-col justify-end overflow-hidden pt-32 pb-16 md:pb-20">
      <Figure
        src={background}
        slot={HERO_SLOT}
        alt=""
        shot="Wide hero. The room and the fire, evening service."
        sizes="100vw"
        priority
        labelPosition="bottom"
        className="lr-hero-plate absolute inset-0 -z-20"
      />

      {videoId ? <HeroVideo videoId={videoId} title={heading} /> : null}

      {hasPhoto ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-[5] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-scrim)_62%,transparent)_0%,color-mix(in_srgb,var(--color-scrim)_12%,transparent)_26%,color-mix(in_srgb,var(--color-scrim)_18%,transparent)_48%,color-mix(in_srgb,var(--color-scrim)_78%,transparent)_82%,color-mix(in_srgb,var(--color-scrim)_92%,transparent)_100%)]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-[5] bg-[radial-gradient(85%_70%_at_50%_45%,transparent_0%,color-mix(in_srgb,var(--color-ink)_70%,transparent)_100%)]"
        />
      )}

      <Container className="relative">
        {eyebrow ? (
          <p
            className="lr-hero-in text-[0.6875rem] tracking-[0.24em] text-gold uppercase"
            style={{ '--d': 150 } as CSSProperties}
          >
            {eyebrow}
          </p>
        ) : null}

        {/* items-end aligns the two columns on their last line, so the headline
            and the actions share a baseline no matter how either wraps. */}
        <div className="mt-6 grid items-end gap-y-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-16">
          <h1
            className="lr-display lr-hero-title max-w-[16ch] text-[clamp(2.25rem,1.1rem+4.2vw,4.25rem)] leading-[1.04] text-balance text-ivory"
            style={{ '--d': 300 } as CSSProperties}
          >
            {heading}
          </h1>

          <div>
            {subheading ? (
              <p
                className="lr-hero-in max-w-[44ch] text-base leading-relaxed text-pretty text-ivory-dim md:text-lg"
                style={{ '--d': 520 } as CSSProperties}
              >
                {subheading}
              </p>
            ) : null}

            <div
              className="lr-hero-in mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4"
              style={{ '--d': 660 } as CSSProperties}
            >
              <Cta href={localePath(locale, '/reservation')} variant="solid">
                {readText(content, 'cta_label')}
              </Cta>
              <Cta href={localePath(locale, '/menu')} variant="outline">
                {readText(content, 'secondary_cta_label')}
              </Cta>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
