import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticlePage } from '@/components/article/article-page'
import { apiSlugs } from '@/lib/api/client'
import { getEvent } from '@/lib/api/posts'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale } from '@/lib/i18n/config'
import { formatDateTime } from '@/lib/format'
import { previewToken } from '@/lib/preview'
import { buildMetadata } from '@/lib/seo/metadata'

type Params = Promise<{ locale: string; slug: string }>

export async function generateStaticParams() {
  const slugs = await apiSlugs('/events?when=all')
  return (slugs.length > 0 ? slugs : ['__none__']).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const event = await getEvent(locale, slug, await previewToken())
  return event ? buildMetadata(event.seo) : {}
}

export default async function EventPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const [event, settings, dict] = await Promise.all([getEvent(locale, slug, await previewToken()), getSettings(locale), getDictionary(locale)])
  if (!event) notFound()

  return (
    <ArticlePage
      locale={locale}
      dict={dict}
      settings={settings}
      title={event.title}
      kicker={[event.starts_at ? formatDateTime(event.starts_at, locale) : null, event.branch?.name].filter(Boolean).join(' · ') || null}
      lede={event.summary}
      cover={event.cover}
      body={event.body}
      sections={event.sections}
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        startDate: event.starts_at ?? undefined,
        endDate: event.ends_at ?? undefined,
        image: event.cover ?? undefined,
        description: event.summary ?? undefined,
        location: event.branch ? { '@type': 'Place', name: event.branch.name } : undefined,
      }}
    />
  )
}
