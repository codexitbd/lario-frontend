import Link from 'next/link'
import { Figure } from '@/components/ui/figure'
import { formatDate } from '@/lib/format'
import { type Locale, localePath } from '@/lib/i18n/config'
import type { PostCard as Post } from '@/lib/schemas'

/**
 * A journal entry in a list. The size is set by its place in the run, not by
 * the post: `wide` is a landscape plate, `tall` a portrait one, and the two
 * alternate down the page so the list reads as an edited spread rather than a
 * row of identical cards.
 *
 * One link per card: the title's anchor stretches over the whole card with an
 * ::after, so the photograph is clickable without a second tab stop.
 */
export function PostCard({
  post,
  locale,
  shape,
  tone,
  headingLevel = 'h3',
  className = '',
}: {
  post: Post
  locale: Locale
  shape: 'wide' | 'tall'
  tone: 'dark' | 'light'
  headingLevel?: 'h2' | 'h3'
  className?: string
}) {
  const Heading = headingLevel
  const light = tone === 'light'
  const meta = [post.category?.name, post.published_at ? formatDate(post.published_at, locale) : null].filter(Boolean)

  return (
    <article className={`group relative ${className}`}>
      <div className={`lr-plate relative overflow-hidden ${shape === 'wide' ? 'aspect-[3/2]' : 'aspect-[4/5]'}`}>
        <Figure
          src={post.card_image ?? post.cover}
          alt={post.cover_alt ?? ''}
          shot={post.title}
          sizes={shape === 'wide' ? '(min-width: 1024px) 56vw, 100vw' : '(min-width: 1024px) 40vw, 100vw'}
          className="absolute inset-0"
          imageClassName="transition-transform duration-[1200ms] ease-brand group-hover:scale-[1.04]"
        />
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

      <Heading
        className={`lr-display mt-3 max-w-[24ch] text-[clamp(1.5rem,1.2rem+1vw,2.125rem)] leading-[1.15] text-balance transition-colors duration-300 ${
          light ? 'text-ink group-hover:text-gold-ink' : 'text-ivory group-hover:text-gold-pale'
        }`}
      >
        <Link href={localePath(locale, post.url)} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-gold">
          {post.title}
        </Link>
      </Heading>

      {post.excerpt ? (
        <p className={`mt-3 max-w-[52ch] text-base leading-relaxed text-pretty ${light ? 'text-ink-soft' : 'text-ivory-dim'}`}>
          {post.excerpt}
        </p>
      ) : null}
    </article>
  )
}

/**
 * The spread: wide and tall alternate, and the second of each pair drops so the
 * two never share a top edge. A last post without a partner is set wide and
 * pulled to the centre of the grid rather than leaving a hole beside it.
 */
export function PostSpread({ posts, locale, tone }: { posts: Post[]; locale: Locale; tone: 'dark' | 'light' }) {
  return (
    <div className="grid grid-cols-1 gap-y-16 md:gap-y-20 lg:grid-cols-12 lg:gap-x-12">
      {posts.map((post, index) => {
        const pair = Math.floor(index / 2)
        const second = index % 2 === 1
        const alone = !second && index === posts.length - 1
        // Pairs alternate wide-tall then tall-wide.
        const wide = alone || (pair % 2 === 0 ? !second : second)
        const span = alone ? 'lg:col-span-8 lg:col-start-3' : wide ? 'lg:col-span-7' : 'lg:col-span-5'

        return (
          <PostCard
            key={post.slug}
            post={post}
            locale={locale}
            tone={tone}
            shape={wide ? 'wide' : 'tall'}
            className={`${span} ${second ? 'lg:mt-32' : ''}`}
          />
        )
      })}
    </div>
  )
}
