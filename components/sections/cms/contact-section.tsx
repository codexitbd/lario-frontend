import { ContactForm } from '@/components/contact/contact-form'
import { Container } from '@/components/ui/container'
import { CmsHeader } from '@/components/sections/cms/header'
import { type Bag, readList } from '@/components/sections/content'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { formatPhone } from '@/lib/format'
import { type Branch, type Settings, branchSchema } from '@/lib/schemas'

export function ContactSection({
  section,
  locale,
  dict,
  branches,
  settings,
}: {
  section: { content: Bag; payload: Bag }
  locale: Locale
  dict: Dictionary
  branches: Branch[]
  settings?: Settings
}) {
  const shown = readList(section.content, 'branches', branchSchema)
  const rooms = shown.length > 0 ? shown : branches
  const contact = settings?.contact

  return (
    <section className="bg-ink py-20 text-ivory md:py-28">
      <Container className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <CmsHeader content={section.content} className="!items-start !text-start" />
          <dl className="mt-10 space-y-6 text-sm">
            {contact?.phone ? (
              <div><dt className="text-ivory-dim">{dict.footer.callUs}</dt><dd><a href={`tel:${contact.phone}`} className="text-lg hover:text-gold"><bdi dir="ltr">{formatPhone(contact.phone)}</bdi></a></dd></div>
            ) : null}
            {contact?.whatsapp ? (
              <div><dt className="text-ivory-dim">{dict.footer.whatsapp}</dt><dd><a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-lg hover:text-gold"><bdi dir="ltr">{formatPhone(contact.whatsapp)}</bdi></a></dd></div>
            ) : null}
            {contact?.email ? (
              <div><dt className="text-ivory-dim">{dict.footer.emailUs}</dt><dd><a href={`mailto:${contact.email}`} className="text-lg hover:text-gold">{contact.email}</a></dd></div>
            ) : null}
          </dl>
        </div>
        {section.payload.show_form !== false ? <ContactForm branches={rooms} locale={locale} dict={dict} /> : null}
      </Container>
    </section>
  )
}
