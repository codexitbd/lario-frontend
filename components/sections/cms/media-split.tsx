import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { SectionHeader } from '@/components/ui/section-header'
import { SectionCta } from '@/components/sections/section-cta'
import { type Bag, readImage, readText } from '@/components/sections/content'
import type { Locale } from '@/lib/i18n/config'

/** Photo beside text. `image_side` is logical: "start" is left in English, right in Arabic. */
export function MediaSplit({ section, locale }: { section: { content: Bag; payload: Bag }; locale: Locale }) {
  const { content, payload } = section
  const imageLast = payload.image_side !== 'start'

  return (
    <section className="bg-bone py-20 md:py-28">
      <Container className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className={`relative aspect-[4/5] ${imageLast ? 'md:order-last' : ''}`}>
          <Figure src={readImage(payload, 'image')} alt="" shot={readText(content, 'heading')} sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0" />
        </div>
        <div>
          <SectionHeader
            align="start"
            tone="light"
            eyebrow={readText(content, 'eyebrow')}
            heading={readText(content, 'heading')}
            subheading={readText(content, 'subheading')}
          />
          {readText(content, 'body') ? (
            <p className="mt-6 max-w-[52ch] text-base leading-[1.85] whitespace-pre-line text-ink-soft">{readText(content, 'body')}</p>
          ) : null}
          <SectionCta payload={payload} locale={locale} label={readText(content, 'cta_label')} variant="outline" tone="light" className="mt-9" />
        </div>
      </Container>
    </section>
  )
}
