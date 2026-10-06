import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { CmsHeader } from '@/components/sections/cms/header'
import { type Bag, readList } from '@/components/sections/content'
import { type Locale, localePath } from '@/lib/i18n/config'
import { menuCategorySchema } from '@/lib/schemas'

export function CategoryGrid({ section, locale }: { section: { content: Bag }; locale: Locale }) {
  const categories = readList(section.content, 'categories', menuCategorySchema)
  if (categories.length === 0) return null

  return (
    <section className="bg-ink py-20 md:py-28">
      <Container>
        <CmsHeader content={section.content} className="mb-14" />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link href={localePath(locale, category.url)} className="group relative block aspect-[4/3] overflow-hidden">
                <Figure src={category.image} alt={category.image_alt ?? ''} shot={category.name} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="absolute inset-0" imageClassName="transition-transform duration-700 ease-brand group-hover:scale-[1.05]" />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                <span className="absolute inset-x-6 bottom-6 flex items-baseline justify-between gap-4 text-ivory">
                  <span className="lr-display text-2xl">{category.name}</span>
                  <span className="text-sm text-gold">{category.item_count}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
