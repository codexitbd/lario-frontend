import { DishCard } from '@/components/menu/dish-card'
import { Container } from '@/components/ui/container'
import { CmsHeader } from '@/components/sections/cms/header'
import type { Bag } from '@/components/sections/content'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import type { MenuItemCard } from '@/lib/schemas'

export function DishGrid({
  section,
  locale,
  dict,
}: {
  section: { content: Bag; items?: MenuItemCard[] }
  locale: Locale
  dict: Dictionary
}) {
  const items = section.items ?? []
  if (items.length === 0) return null

  return (
    <section className="bg-ink py-20 md:py-28">
      <Container>
        <CmsHeader content={section.content} className="mb-14" />
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.slug}>
              <DishCard item={item} locale={locale} dict={dict} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
