import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { PostSpread } from '@/components/journal/post-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { getPage } from '@/lib/api/pages'
import { getPosts } from '@/lib/api/posts'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, localePath } from '@/lib/i18n/config'
import { formatDate } from '@/lib/format'
import { absoluteUrl } from '@/content/seo-defaults'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbJsonLd } from '@/lib/seo/json-ld'

const PAGE_SLUG = 'blog'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const page = await getPage(locale, PAGE_SLUG)
  return page ? buildMetadata(page.seo) : {}
}

/**
 * /blog, the journal. Words and SEO from the admin page "blog"; the posts from
 * GET /posts, all of them in the static HTML (up to the API's 48).
 *
 * 1. THE LEAD. The newest story shares the dark opening band with the page
 *    title: a large plate on the start side, its headline set beside it. The
 *    first thing a visitor sees is a photograph and a sentence, not a grid.
 * 2. THE SPREAD. Everything else on bone, wide and tall plates alternating
 *    with a dropped second column (components/journal/post-card.tsx).
 *
 * No topic filter: with a handful of posts it is machinery for its own sake,
 * and a query-string filter would make the route dynamic. Each card names its
 * topic instead.
 */
export default async function JournalPage({ params }: { params: Params }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [page, posts, settings, dict] = await Promise.all([
    getPage(locale, PAGE_SLUG),
    getPosts(locale),
    getSettings(locale),
    getDictionary(locale),
  ])
  if (!page) notFound()

  const intro = page.sections.find((s) => s.type === 'page_hero')?.content.subheading
  const [lead, ...rest] = posts

  return (
    <main id="main-content">
      <section className="bg-ink pt-36 pb-20 text-ivory md:pt-44 md:pb-28">
        <Container>
          <Breadcrumb items={[{ label: settings.site_name, href: localePath(locale, '/') }, { label: page.title }]} />

          <h1 className="lr-display lr-hero-title mt-8 max-w-[16ch] pb-1 text-[clamp(2.5rem,1.4rem+3.6vw,4.25rem)] leading-[1.04] text-balance">
            {page.heading}
          </h1>
          {typeof intro === 'string' && intro ? (
            <p className="lr-hero-in mt-6 max-w-[52ch] text-lg leading-relaxed text-pretty text-ivory-dim" style={{ '--d': 220 } as React.CSSProperties}>
              {intro}
            </p>
          ) : null}

          {lead ? (
            <article className="group relative mt-16 grid items-end gap-y-8 md:mt-24 lg:grid-cols-12 lg:gap-x-12">
              <div className="relative aspect-[4/3] overflow-hidden lg:col-span-7">
                <Figure
                  src={lead.cover ?? lead.card_image ?? null}
                  alt={lead.cover_alt ?? ''}
                  shot={lead.title}
                  sizes="(min-width: 1400px) 780px, (min-width: 1024px) 56vw, 100vw"
                  priority
                  className="absolute inset-0"
                  imageClassName="transition-transform duration-[1400ms] ease-brand group-hover:scale-[1.03]"
                />
              </div>

              <div className="lg:col-span-5 lg:pb-2">
                <p className="flex flex-wrap gap-x-3 text-sm text-gold">
                  {lead.category?.name ? <span>{lead.category.name}</span> : null}
                  {lead.published_at ? <span className="text-ivory-dim">{formatDate(lead.published_at, locale)}</span> : null}
                </p>
                <h2 className="lr-display mt-4 text-[clamp(2rem,1.5rem+1.8vw,3.25rem)] leading-[1.08] text-balance transition-colors duration-300 group-hover:text-gold-pale">
                  <Link href={localePath(locale, lead.url)} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-gold">
                    {lead.title}
                  </Link>
                </h2>
                {lead.excerpt ? <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-pretty text-ivory-dim md:text-lg">{lead.excerpt}</p> : null}
                <span aria-hidden="true" className="mt-8 inline-flex items-center gap-3 border-b border-gold/40 pb-1 text-[0.8125rem] font-medium tracking-[0.16em] text-gold uppercase transition-colors duration-300 group-hover:border-gold">
                  {dict.journal.readStory}
                  <ArrowRightIcon size={16} className="transition-transform duration-500 ease-brand group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
                </span>
              </div>
            </article>
          ) : (
            <p className="mt-16 max-w-[44ch] text-lg text-ivory-dim">{dict.journal.empty}</p>
          )}
        </Container>
      </section>

      {rest.length > 0 ? (
        <section className="bg-bone py-24 text-ink md:py-32">
          <Container>
            <h2 className="sr-only">{dict.journal.allStories}</h2>
            <PostSpread posts={rest} locale={locale} tone="light" />
          </Container>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: settings.site_name, url: absoluteUrl(locale, '/') },
              { name: page.title, url: page.seo.canonical },
            ]),
            {
              '@context': 'https://schema.org',
              '@type': 'Blog',
              name: page.heading,
              url: page.seo.canonical,
              blogPost: posts.map((post) => ({
                '@type': 'BlogPosting',
                headline: post.title,
                url: absoluteUrl(locale, post.url),
                datePublished: post.published_at ?? undefined,
                image: post.cover ?? undefined,
              })),
            },
          ]),
        }}
      />
    </main>
  )
}
