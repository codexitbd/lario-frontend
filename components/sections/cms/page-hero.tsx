import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { type Bag, readImage, readText } from '@/components/sections/content'
import { type Locale, localePath } from '@/lib/i18n/config'

/** The opening band of an inner page: the page's only h1. */
export function PageHero({
  section,
  locale,
  homeLabel,
}: {
  section: { content: Bag; payload: Bag }
  locale: Locale
  homeLabel: string
}) {
  const { content, payload } = section
  const heading = readText(content, 'heading')
  const image = readImage(payload, 'image')

  return (
    <section className="relative isolate overflow-hidden bg-ink pt-36 pb-16 text-ivory md:pt-44 md:pb-20">
      {image ? (
        <>
          <Figure src={image} mobileSrc={readImage(payload, 'mobile_image')} alt="" shot={heading} sizes="100vw" priority className="absolute inset-0 -z-20" />
          <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        </>
      ) : null}
      <Container>
        {payload.show_breadcrumbs !== false ? (
          <nav aria-label="Breadcrumb" className="text-[0.6875rem] tracking-[0.2em] text-ivory-dim uppercase">
            <ol className="flex items-center gap-3">
              <li>
                <Link href={localePath(locale, '/')} className="transition-colors duration-300 hover:text-gold">
                  {homeLabel}
                </Link>
              </li>
              <li aria-hidden="true" className="text-gold/60">/</li>
              <li aria-current="page" className="text-ivory">{heading}</li>
            </ol>
          </nav>
        ) : null}
        {readText(content, 'eyebrow') ? (
          <p className="lr-display mt-8 text-xl italic text-gold md:text-2xl">{readText(content, 'eyebrow')}</p>
        ) : null}
        <h1 className="lr-display mt-4 max-w-[20ch] text-[clamp(2.25rem,1.4rem+3vw,4rem)] leading-[1.05] text-balance">
          {heading}
        </h1>
        {readText(content, 'subheading') ? (
          <p className="mt-6 max-w-[56ch] text-base leading-relaxed text-ivory-dim md:text-lg">
            {readText(content, 'subheading')}
          </p>
        ) : null}
      </Container>
    </section>
  )
}
