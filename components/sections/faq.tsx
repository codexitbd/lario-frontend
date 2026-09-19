import { CaretDownIcon } from '@phosphor-icons/react/ssr'
import { Container } from '@/components/ui/container'
import {
  faqItemSchema,
  readList,
  readText,
  type Bag,
} from '@/components/sections/content'

/**
 * No reference image for this section, so it is built from the language the
 * rest of the set establishes: gold kicker, Bodoni heading, hairline rules,
 * square corners, one accent.
 *
 * Native <details>, not a JavaScript accordion. It is keyboard-operable,
 * announced correctly, findable by in-page search, and costs nothing — six
 * questions do not justify a client component on a page held to a 95+ mobile
 * PageSpeed score.
 *
 * The heading column is sticky beside the list rather than centred above it,
 * so this section does not repeat the centred-header shape used earlier.
 * These items also feed the page's FAQPage JSON-LD, built in page.tsx from the
 * same fixture rows.
 */
export function Faq({ section }: { section: { content: Bag } }) {
  const { content } = section
  const items = readList(content, 'items', faqItemSchema)
  if (items.length === 0) return null

  return (
    <section className="bg-bone py-24 md:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <header className="lr-reveal lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
            <p className="lr-display pb-1 text-xl leading-[1.15] text-gold-ink italic md:text-2xl">
              {readText(content, 'eyebrow')}
            </p>
            <h2
              className="lr-display mt-4 max-w-[14ch] text-[clamp(2rem,1.2rem+3vw,3.5rem)] leading-[1.08] text-ink"
            >
              {readText(content, 'heading')}
            </h2>
            <p className="mt-6 max-w-[40ch] text-base leading-relaxed text-ink-soft">
              {readText(content, 'subheading')}
            </p>
          </header>

          <div className="lr-reveal lg:col-span-7">
            {items.map((item) => (
              <details
                key={item.q}
                name="lario-faq"
                className="group border-t border-ink/15 last:border-b"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-start text-base text-ink transition-colors duration-300 hover:text-gold-ink md:text-lg [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <CaretDownIcon
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-gold-ink transition-transform duration-300 ease-brand group-open:rotate-180"
                  />
                </summary>
                <p className="pb-7 pe-10 text-sm leading-relaxed text-ink-soft md:text-base">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
