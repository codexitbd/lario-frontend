import { NewsletterForm } from '@/components/layout/newsletter-form'
import { Container } from '@/components/ui/container'
import { CmsHeader } from '@/components/sections/cms/header'
import type { Bag } from '@/components/sections/content'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

export function NewsletterSection({ section, locale, dict }: { section: { content: Bag }; locale: Locale; dict: Dictionary }) {
  return (
    <section className="bg-ink py-20 text-ivory md:py-24">
      <Container width="narrow" className="flex flex-col items-center gap-10">
        <CmsHeader content={section.content} />
        <div className="w-full max-w-md"><NewsletterForm locale={locale} dict={dict} /></div>
      </Container>
    </section>
  )
}
