import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { SectionCta } from '@/components/sections/section-cta'
import { CmsHeader } from '@/components/sections/cms/header'
import { type Bag, readList, readText } from '@/components/sections/content'
import { formatDate } from '@/lib/format'
import { type Locale, localePath } from '@/lib/i18n/config'
import { postCardSchema } from '@/lib/schemas'

export function PostList({ section, locale }: { section: { content: Bag; payload: Bag }; locale: Locale }) {
  const posts = readList(section.content, 'posts', postCardSchema)
  if (posts.length === 0) return null

  return (
    <section className="bg-bone py-20 text-ink md:py-28">
      <Container>
        <CmsHeader content={section.content} tone="light" className="mb-14" />
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={localePath(locale, post.url)} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Figure src={post.cover} alt="" shot={post.title} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="absolute inset-0" imageClassName="transition-transform duration-700 ease-brand group-hover:scale-[1.04]" />
                </div>
                {post.published_at ? <p className="mt-5 text-sm text-ink-soft">{formatDate(post.published_at, locale)}</p> : null}
                <h3 className="lr-display mt-2 text-2xl leading-snug group-hover:text-gold-ink">{post.title}</h3>
                {post.excerpt ? <p className="mt-3 text-base leading-relaxed text-ink-soft">{post.excerpt}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-14 flex justify-center">
          <SectionCta payload={section.payload} locale={locale} label={readText(section.content, 'cta_label')} variant="outline" tone="light" />
        </div>
      </Container>
    </section>
  )
}
