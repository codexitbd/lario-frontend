import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticlePage } from '@/components/article/article-page'
import { apiSlugs } from '@/lib/api/client'
import { getPost, getPosts } from '@/lib/api/posts'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { interpolate } from '@/lib/i18n/dictionaries'
import { isLocale, localePath } from '@/lib/i18n/config'
import { formatDate, readingMinutes } from '@/lib/format'
import { previewToken } from '@/lib/preview'
import { buildMetadata } from '@/lib/seo/metadata'

type Params = Promise<{ locale: string; slug: string }>

export async function generateStaticParams() {
  const slugs = await apiSlugs('/posts')
  return (slugs.length > 0 ? slugs : ['__none__']).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const post = await getPost(locale, slug, await previewToken())
  return post ? buildMetadata(post.seo) : {}
}

export default async function PostPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const [post, posts, settings, dict] = await Promise.all([
    getPost(locale, slug, await previewToken()),
    getPosts(locale),
    getSettings(locale),
    getDictionary(locale),
  ])
  if (!post) notFound()

  const meta = [
    post.category?.name,
    post.published_at ? formatDate(post.published_at, locale) : null,
    interpolate(dict.journal.minutes, { count: String(readingMinutes(post.body)) }),
  ].filter((item): item is string => Boolean(item))

  return (
    <ArticlePage
      locale={locale}
      dict={dict}
      settings={settings}
      title={post.title}
      meta={meta}
      parent={{ label: dict.nav.blog, href: localePath(locale, '/blog') }}
      author={post.author}
      related={posts.filter((other) => other.slug !== post.slug).slice(0, 2)}
      lede={post.excerpt}
      cover={post.cover}
      coverAlt={post.cover_alt}
      body={post.body}
      sections={post.sections}
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        datePublished: post.published_at ?? undefined,
        image: post.cover ?? undefined,
        author: post.author ? { '@type': 'Person', name: post.author.name } : undefined,
        mainEntityOfPage: post.seo.canonical,
      }}
    />
  )
}
