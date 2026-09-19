import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import { SectionHeader } from '@/components/ui/section-header'
import { readImageList, readText, type Bag } from '@/components/sections/content'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'

/**
 * Reference 07-gallery-strip: frames pinned at slight angles, drifting past on
 * their own, straightening under the cursor while the drift holds still.
 *
 * The only marquee on this page, and it earns the place: the section's job is
 * breadth, not individual attention, and a static six-up grid says the
 * opposite. The track carries two copies of the set so the translate can loop
 * at -50% with no seam; the second copy is hidden from assistive tech so the
 * frames are not announced twice.
 *
 * Pausing and the reduced-motion stop both live in globals.css.
 */
const SHOTS = [
  'The charcoal grill in service.',
  'The main dining room, evening light.',
  'The wood-fired pizza oven.',
  'Courtyard seating.',
  'Plating at the pass.',
  'The twelve-seat private room.',
]

export function GalleryStrip({
  section,
  locale,
}: {
  section: { payload: Bag; content: Bag }
  locale: Locale
}) {
  const { payload, content } = section
  const images = readImageList(payload, 'images')
  if (images.length === 0) return null

  const href = readText(payload, 'cta_href') || '/branches'
  const frames = images.map((src, index) => ({
    src,
    shot: SHOTS[index] ?? 'Interior frame.',
    slot: `home.gallery.${index % 6}`,
    key: `${index}`,
  }))

  return (
    <section className="overflow-hidden bg-ink py-24 md:py-36">
      <Container>
        <SectionHeader
          eyebrow={readText(content, 'eyebrow')}
          heading={readText(content, 'heading')}
          subheading={readText(content, 'subheading')}
          treatment="label"
          align="center"
        />
      </Container>

      <div className="lr-marquee mt-16 md:mt-20">
        <div className="lr-marquee-track flex w-max gap-5 md:gap-7">
          {[0, 1].map((copy) =>
            frames.map((frame) => (
              <figure
                key={`${copy}-${frame.key}`}
                aria-hidden={copy === 1 ? 'true' : undefined}
                className="w-64 shrink-0 rotate-[-2.5deg] transition-transform duration-500 ease-brand even:rotate-[2deg] hover:rotate-0 md:w-[22rem]"
              >
                <Figure
                  src={frame.src}
                  slot={frame.slot}
                  alt={frame.src ? frame.shot : ''}
                  shot={frame.shot}
                  sizes="(min-width: 768px) 22rem, 16rem"
                  className="relative aspect-[4/3] w-full"
                />
              </figure>
            )),
          )}
        </div>
      </div>

      <Container className="lr-reveal mt-16 flex justify-center">
        <Cta href={localePath(locale, href)} variant="outline">
          {readText(content, 'cta_label')}
        </Cta>
      </Container>
    </section>
  )
}
