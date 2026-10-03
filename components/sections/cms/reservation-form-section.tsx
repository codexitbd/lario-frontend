import { Suspense } from 'react'
import { ReservationBook } from '@/components/reservation/reservation-book'
import { Container } from '@/components/ui/container'
import { CmsHeader } from '@/components/sections/cms/header'
import type { Bag } from '@/components/sections/content'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import type { Branch, Settings } from '@/lib/schemas'

export function ReservationFormSection({
  section,
  locale,
  dict,
  branches,
  settings,
}: {
  section: { content: Bag }
  locale: Locale
  dict: Dictionary
  branches: Branch[]
  settings?: Settings
}) {
  const paused = settings?.reservations.enabled === false

  return (
    <section className="bg-ink pt-8 pb-24 text-ivory md:pb-32">
      <Container>
        <CmsHeader content={section.content} className="mb-14" />
        {paused ? (
          <p className="mx-auto max-w-[52ch] text-center text-lg text-ivory-dim">{settings?.reservations.disabled_message}</p>
        ) : (
          // ReservationBook reads ?branch= on the client; Suspense keeps the page static.
          <Suspense>
            <ReservationBook branches={branches} locale={locale} dict={dict} />
          </Suspense>
        )}
      </Container>
    </section>
  )
}
