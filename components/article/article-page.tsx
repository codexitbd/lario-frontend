import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { SectionList } from '@/components/sections/section-list'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { type Locale, localePath } from '@/lib/i18n/config'
import type { PageSection, Settings } from '@/lib/schemas'

/** Fixed design for a blog post or an event; the admin's extras follow below. */
export function ArticlePage({
  locale,
  dict,
  settings,
  title,
  kicker,
  lede,
  cover,
  body,
  sections,
  jsonLd,
}: {
  locale: Locale
  dict: Dictionary
  settings: Settings
  title: string
  kicker: string | null
  lede: string | null
  cover: string | null
  body: string
  sections: PageSection[]
  jsonLd: object
}) {
  return (
    <main id="main-content">
      <section className="bg-ink pt-36 pb-14 text-ivory md:pt-44">
        <Container width="narrow">
          <nav aria-label="Breadcrumb" className="text-[0.6875rem] tracking-[0.2em] text-ivory-dim uppercase">
            <Link href={localePath(locale, '/')} className="hover:text-gold">{settings.site_name}</Link>
          </nav>
          {kicker ? <p className="mt-8 text-sm text-gold">{kicker}</p> : null}
          <h1 className="lr-display mt-3 text-[clamp(2.25rem,1.4rem+3vw,3.75rem)] leading-[1.06] text-balance">{title}</h1>
          {lede ? <p className="mt-6 text-lg leading-relaxed text-ivory-dim">{lede}</p> : null}
        </Container>
      </section>
      {cover ? (
        <div className="bg-ink">
          <Container>
            <div className="relative aspect-[16/9] overflow-hidden">
              <Figure src={cover} alt="" shot={title} sizes="(min-width: 1400px) 1400px, 100vw" priority className="absolute inset-0" />
            </div>
          </Container>
        </div>
      ) : null}
      <section className="bg-bone py-16 text-ink md:py-24">
        <Container width="narrow">
          <div
            className="text-base leading-[1.85] text-ink-soft md:text-lg [&_a]:text-gold-ink [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:font-semibold [&_h3]:text-ink [&_img]:my-8 [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:mt-4 [&_ul]:list-disc [&_ul]:ps-6"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </Container>
      </section>
      <SectionList sections={sections} locale={locale} dict={dict} settings={settings} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  )
}
