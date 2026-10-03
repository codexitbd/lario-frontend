import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { CmsHeader } from '@/components/sections/cms/header'
import { type Bag, readList } from '@/components/sections/content'
import { formatDateTime } from '@/lib/format'
import { type Locale, localePath } from '@/lib/i18n/config'
import { eventCardSchema } from '@/lib/schemas'

export function EventList({ section, locale }: { section: { content: Bag }; locale: Locale }) {
  const events = readList(section.content, 'events', eventCardSchema)
  if (events.length === 0) return null

  return (
    <section className="bg-ink py-20 text-ivory md:py-28">
      <Container>
        <CmsHeader content={section.content} className="mb-14" />
        <ul className="divide-y divide-ivory/10 border-y border-ivory/10">
          {events.map((event) => (
            <li key={event.slug}>
              <Link href={localePath(locale, event.url)} className="group grid gap-6 py-8 md:grid-cols-[14rem_1fr] md:items-center">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Figure src={event.cover} alt="" shot={event.title} sizes="(min-width: 768px) 14rem, 100vw" className="absolute inset-0" />
                </div>
                <div>
                  {event.starts_at ? <p className="text-sm text-gold">{formatDateTime(event.starts_at, locale)}{event.branch?.name ? ` · ${event.branch.name}` : ''}</p> : null}
                  <h3 className="lr-display mt-2 text-2xl group-hover:text-gold">{event.title}</h3>
                  {event.summary ? <p className="mt-3 max-w-[60ch] text-ivory-dim">{event.summary}</p> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
