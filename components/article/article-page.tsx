import { PostSpread } from '@/components/journal/post-card'
import { SectionList } from '@/components/sections/section-list'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import { type Dictionary, interpolate } from '@/lib/i18n/dictionaries'
import { type Locale, localePath } from '@/lib/i18n/config'
import type { PageSection, PostCard, Settings, TeamMember } from '@/lib/schemas'

/**
 * Fixed design for a blog post or an event; the admin's extras follow below.
 *
 * Read like a printed feature: a dark title page (headline, standfirst, then
 * the byline and facts in one row beneath, never a label above the headline),
 * the cover straddling the dark and bone grounds so the page turns on the
 * photograph, then a single reading column on bone (`.lr-prose` in globals.css:
 * a Bodoni drop cap in Latin, pull quotes, a 65ch measure). Posts close on two
 * more stories laid out like the journal itself.
 */
export function ArticlePage({
  locale,
  dict,
  settings,
  title,
  meta,
  lede,
  cover,
  coverAlt,
  body,
  sections,
  jsonLd,
  parent,
  author = null,
  related = [],
}: {
  locale: Locale
  dict: Dictionary
  settings: Settings
  title: string
  /** Facts for the byline row: topic, date, reading time; or an event's date and room. */
  meta: string[]
  lede: string | null
  cover: string | null
  coverAlt?: string | null
  body: string
  sections: PageSection[]
  jsonLd: object
  /** The listing page for the breadcrumb, when there is one. */
  parent?: { label: string; href: string }
  author?: TeamMember | null
  related?: PostCard[]
}) {
  return (
    <main id="main-content">
      <section className={`bg-ink pt-36 text-ivory md:pt-44 ${cover ? 'pb-16 md:pb-20' : 'pb-20 md:pb-28'}`}>
        <Container width="narrow">
          <Breadcrumb
            items={[
              { label: settings.site_name, href: localePath(locale, '/') },
              ...(parent ? [parent] : []),
            ]}
          />

          <h1 className="lr-display lr-hero-title mt-10 pb-1 text-[clamp(2.25rem,1.3rem+3.4vw,4rem)] leading-[1.06] text-balance">
            {title}
          </h1>
          {lede ? (
            <p className="lr-hero-in mt-6 text-lg leading-relaxed text-pretty text-ivory-dim md:text-xl" style={{ '--d': 200 } as React.CSSProperties}>
              {lede}
            </p>
          ) : null}

          {author || meta.length > 0 ? (
            <div className="lr-hero-in mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 text-sm" style={{ '--d': 360 } as React.CSSProperties}>
              {author ? (
                <p className="flex items-center gap-3">
                  {author.photo ? (
                    <span className="relative block size-11 shrink-0 overflow-hidden">
                      <Figure src={author.photo} alt={author.photo_alt ?? ''} shot={author.name} sizes="44px" className="absolute inset-0" />
                    </span>
                  ) : null}
                  <span className="text-ivory">{interpolate(dict.journal.by, { name: author.name })}</span>
                </p>
              ) : null}
              {meta.map((item, index) => (
                <p key={index} className={`${index === 0 ? 'text-gold' : 'text-ivory-dim'} ${author || index > 0 ? 'border-s border-ivory/15 ps-6' : ''}`}>
                  {item}
                </p>
              ))}
            </div>
          ) : null}
        </Container>
      </section>

      {cover ? (
        <div className="bg-[linear-gradient(to_bottom,var(--color-ink)_50%,var(--color-bone)_50%)]">
          <Container>
            <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:aspect-[2/1]">
              <Figure src={cover} alt={coverAlt ?? ''} shot={title} sizes="(min-width: 1400px) 1304px, 100vw" priority className="absolute inset-0" />
            </div>
          </Container>
        </div>
      ) : null}

      <section className={`bg-bone pb-24 text-ink md:pb-32 ${cover ? 'pt-16 md:pt-24' : 'pt-20 md:pt-28'}`}>
        <Container width="narrow">
          <div className="lr-prose" dangerouslySetInnerHTML={{ __html: body }} />
        </Container>
      </section>

      {related.length > 0 ? (
        <section className="bg-ink py-24 text-ivory md:py-32">
          <Container>
            <div className="mb-14 flex flex-wrap items-end justify-between gap-6 md:mb-20">
              <h2 className="lr-display lr-unmask text-[clamp(1.875rem,1.1rem+2.6vw,3.25rem)] leading-[1.08]">{dict.journal.moreStories}</h2>
              {parent ? (
                <Cta href={parent.href} variant="quiet">
                  {dict.journal.allStories}
                </Cta>
              ) : null}
            </div>
            <PostSpread posts={related} locale={locale} tone="dark" />
          </Container>
        </section>
      ) : null}

      <SectionList sections={sections} locale={locale} dict={dict} settings={settings} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  )
}
