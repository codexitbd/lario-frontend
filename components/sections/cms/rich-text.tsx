import { Container } from '@/components/ui/container'
import { type Bag, readText } from '@/components/sections/content'

/** Admin-written formatted text (sanitised HTML from the CMS rich editor). */
export function RichText({ section }: { section: { content: Bag; payload: Bag } }) {
  const { content, payload } = section
  const heading = readText(content, 'heading')

  return (
    <section className="bg-bone py-16 text-ink md:py-24">
      <Container width={payload.width === 'wide' ? 'default' : 'narrow'}>
        {heading ? <h2 className="lr-display text-[clamp(1.75rem,1.2rem+1.8vw,2.75rem)] leading-tight">{heading}</h2> : null}
        <div
          className="lr-rich mt-6 text-base leading-[1.85] text-ink-soft md:text-lg [&_a]:text-gold-ink [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mt-2 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:mt-4 [&_p:first-child]:mt-0 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:ps-6"
          dangerouslySetInnerHTML={{ __html: readText(content, 'body') }}
        />
      </Container>
    </section>
  )
}
