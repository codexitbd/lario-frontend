import { z } from 'zod'
import { MenuBrowser } from '@/components/menu/menu-browser'
import { Container } from '@/components/ui/container'
import { CmsHeader } from '@/components/sections/cms/header'
import { type Bag, readList } from '@/components/sections/content'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { type MenuItemCard, menuCategorySchema } from '@/lib/schemas'

export function MenuBrowserSection({
  section,
  locale,
  dict,
}: {
  section: { content: Bag; items?: MenuItemCard[] }
  locale: Locale
  dict: Dictionary
}) {
  const categories = readList(section.content, 'categories', menuCategorySchema as z.ZodType<z.infer<typeof menuCategorySchema>>)

  return (
    <section className="bg-bone pt-16 md:pt-20">
      <Container>
        <CmsHeader content={section.content} tone="light" className="mb-12" />
      </Container>
      <MenuBrowser items={section.items ?? []} categories={categories} locale={locale} dict={dict} />
    </section>
  )
}
