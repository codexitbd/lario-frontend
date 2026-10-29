import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PostGrid } from '@/components/journal/post-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Container } from '@/components/ui/container'
import { getPage } from '@/lib/api/pages'
import { getPosts } from '@/lib/api/posts'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, localePath } from '@/lib/i18n/config'
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
 * /blog. Words and SEO from the admin page "blog"; the posts from GET /posts,
 * all of them in the static HTML (up to the API's 48).
 *
 * The title and intro on the dark opening band, then every post on bone in one
 * card style, two to a row, each a 16:9 photograph over category and date,
 * title and excerpt (client request 2026-10-29, which replaced the
 * lead-beside-headline and the wide/tall spread).
 *
 * No topic filter: with a handful of posts it is machinery for its own sake,
 * and a query-string filter would make the route dynamic. Each card names its
 * topic instead.
 */
export default async function BlogPage({ params }: { params: Params }) {
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

  return (
    <main id="main-content">
      <section className="bg-ink pt-36 pb-16 text-ivory md:pt-44 md:pb-20">
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

          {posts.length === 0 ? <p className="mt-12 max-w-[44ch] text-lg text-ivory-dim">{dict.journal.empty}</p> : null}
        </Container>
      </section>

      {posts.length > 0 ? (
        <section className="bg-bone py-20 text-ink md:py-28">
          <Container>
            <h2 className="sr-only">{dict.journal.allStories}</h2>
            <PostGrid posts={posts} locale={locale} tone="light" readMore={dict.journal.readStory} priority />
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
