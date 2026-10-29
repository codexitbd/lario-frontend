import Link from 'next/link'
import { Figure } from '@/components/ui/figure'
import { formatDate } from '@/lib/format'
import { type Locale, localePath } from '@/lib/i18n/config'
import type { PostCard as Post } from '@/lib/schemas'

/**
 * A blog post in a list, read top to bottom: a 16:9 photograph, the category
 * and date, the title, the excerpt (client request 2026-10-29). On hover (or
 * keyboard focus) the photograph darkens and a "Read more" button sits in its
 * middle. That button is only a picture of the affordance: the whole card is
 * already the link.
 *
 * One link per card: the title's anchor stretches over the whole card with an
 * ::after, so the photograph is clickable without a second tab stop.
 */
function PostCard({
  post,
  locale,
  tone,
  readMore,
  priority = false,
}: {
  post: Post
  locale: Locale
  tone: 'dark' | 'light'
  readMore: string
  priority?: boolean
}) {
  const light = tone === 'light'
  const meta = [post.category?.name, post.published_at ? formatDate(post.published_at, locale) : null].filter(Boolean)

  return (
    <article className="group relative">
      <div className="lr-plate relative aspect-video overflow-hidden">
        <Figure
          src={post.card_image ?? post.cover}
          alt={post.cover_alt ?? ''}
          shot={post.title}
          sizes="(min-width: 1400px) 640px, (min-width: 768px) 46vw, 100vw"
          priority={priority}
          className="absolute inset-0"
          imageClassName="transition-transform duration-[1200ms] ease-brand group-hover:scale-[1.04]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-500 ease-brand group-focus-within:opacity-100 group-hover:opacity-100"
        >
          <span className="translate-y-2 border border-ivory/70 px-7 py-3 text-[0.75rem] font-medium tracking-[0.18em] text-ivory uppercase transition-transform duration-500 ease-brand group-focus-within:translate-y-0 group-hover:translate-y-0">
            {readMore}
          </span>
        </span>
      </div>

      {meta.length > 0 ? (
        <p className={`mt-6 flex flex-wrap gap-x-3 text-sm ${light ? 'text-gold-ink' : 'text-gold'}`}>
          {meta.map((item, index) => (
            <span key={index} className={index > 0 ? (light ? 'text-ink-soft' : 'text-ivory-dim') : ''}>
              {item}
            </span>
          ))}
        </p>
      ) : null}

      <h3
        className={`lr-display mt-3 text-[clamp(1.625rem,1.25rem+1.2vw,2.375rem)] leading-[1.15] text-balance transition-colors duration-300 ${
          light ? 'text-ink group-hover:text-gold-ink' : 'text-ivory group-hover:text-gold-pale'
        }`}
      >
        <Link href={localePath(locale, post.url)} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-gold">
          {post.title}
        </Link>
      </h3>

      {post.excerpt ? (
        <p className={`mt-3 max-w-[60ch] text-base leading-relaxed text-pretty ${light ? 'text-ink-soft' : 'text-ivory-dim'}`}>
          {post.excerpt}
        </p>
      ) : null}
    </article>
  )
}

/** The list: two posts to a row, one on phones (client request 2026-10-29). */
export function PostGrid({
  posts,
  locale,
  tone,
  readMore,
  priority = false,
}: {
  posts: Post[]
  locale: Locale
  tone: 'dark' | 'light'
  readMore: string
  /** The first row is the page's largest picture: load it first. */
  priority?: boolean
}) {
  return (
    <div className="grid gap-y-16 md:grid-cols-2 md:gap-x-10 md:gap-y-20 lg:gap-x-12">
      {posts.map((post, index) => (
        <PostCard key={post.slug} post={post} locale={locale} tone={tone} readMore={readMore} priority={priority && index < 2} />
      ))}
    </div>
  )
}
