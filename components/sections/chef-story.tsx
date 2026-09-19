import type { CSSProperties } from 'react'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import { readImage, readText, type Bag } from '@/components/sections/content'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'

/**
 * Reference 04-chef-story: a bone ground, a centred header with rules running
 * off both shoulders of the heading, then a notched frame offset against the
 * end edge with the story overlapping it from the start side.
 *
 * The second light section on the page, and the reference is explicit about
 * that — see the ground-alternation note at the top of globals.css.
 *
 * The reference colours one clause of its subheading gold. That means slicing
 * a translated string at a word boundary, which breaks the moment the Arabic
 * copy phrases the sentence differently.
 * ponytail: hierarchy comes from weight and colour on whole strings instead.
 */
export function ChefStory({
  section,
  locale,
}: {
  section: { payload: Bag; content: Bag }
  locale: Locale
}) {
  const { payload, content } = section

  return (
    <section className="relative overflow-hidden bg-bone py-24 md:py-36">
      <Container>
        <header className="lr-reveal flex flex-col items-center text-center">
          <p className="lr-display pb-1 text-xl leading-[1.15] text-gold-ink italic md:text-2xl">
            {readText(content, 'eyebrow')}
          </p>

          {/* Rules flank the heading itself, not a label above it. */}
          <div className="mt-5 flex w-full items-center justify-center gap-6">
            <span
              aria-hidden="true"
              className="hidden h-px max-w-40 flex-1 bg-gold-ink/35 sm:block"
            />
            <h2 className="lr-display max-w-[16ch] text-[clamp(2rem,1.2rem+3.4vw,4rem)] leading-[1.08] text-ink">
              {readText(content, 'heading')}
            </h2>
            <span
              aria-hidden="true"
              className="hidden h-px max-w-40 flex-1 bg-gold-ink/35 sm:block"
            />
          </div>

          <p className="mt-7 max-w-[54ch] text-base leading-relaxed text-ink md:text-lg">
            {readText(content, 'subheading')}
          </p>
        </header>

        <div className="mt-16 grid items-center gap-10 md:mt-24 lg:grid-cols-12 lg:gap-0">
          <div
            className="lr-reveal relative z-10 bg-bone p-8 md:p-12 lg:pe-16 lg:col-span-5 lg:me-[-4rem]"
            style={{ '--i': 1 } as CSSProperties}
          >
            <p className="max-w-[46ch] text-sm leading-[1.9] text-ink-soft md:text-base">
              {readText(content, 'body')}
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:gap-x-9">
              <Cta
                href={localePath(locale, '/branches/narjis')}
                variant="quiet"
                tone="light"
              >
                {readText(content, 'cta_label')}
              </Cta>
              <Cta
                href={localePath(locale, '/branches/al-yasmin')}
                variant="quiet"
                tone="light"
              >
                {readText(content, 'secondary_cta_label')}
              </Cta>
            </div>
          </div>

          <div
            className="lr-reveal lg:col-span-7"
            style={{ '--i': 2 } as CSSProperties}
          >
            <Figure
              src={readImage(payload, 'image')}
              alt=""
              slot="home.chef-story"
              shot="The kitchen team at the open grill."
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="lr-notch relative aspect-[4/3] w-full"
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
