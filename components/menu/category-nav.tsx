import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { MenuCategory } from '@/lib/schemas'

/**
 * Course links across the top of the menu.
 *
 * These NAVIGATE to /menu/[category] — they do not filter this page (decision
 * D10). Course URLs are the ranking asset the whole menu taxonomy was chosen
 * for, and a pill that filtered in place would leave /menu competing with the
 * page it should be sending people to.
 *
 * Sits on the page's bone band, so gold drops to --color-gold-ink for contrast.
 *
 * Real links, so they are crawlable and open in a new tab on a middle click.
 * The in-place controls below them are buttons, and the difference in element
 * is the difference in behaviour.
 */
export function CategoryNav({
  categories,
  locale,
  dict,
  heading,
  headingHidden = false,
}: {
  categories: MenuCategory[]
  locale: Locale
  dict: Dictionary
  /** Defaults to "Browse by course"; a category page passes "Other courses". */
  heading?: string
  /** Keeps the heading in the accessibility tree but off the page. A category
      page already reads as "these are the other courses" from context, and a
      tracked-caps label above it is the section scaffold this site removed
      everywhere else. /menu keeps it visible because there it IS the primary
      navigation affordance. */
  headingHidden?: boolean
}) {
  if (categories.length === 0) return null

  return (
    <Container className="pt-16 md:pt-20">
      <h2
        className={
          headingHidden
            ? 'sr-only'
            : 'text-center text-[0.6875rem] tracking-[0.28em] text-gold-ink uppercase'
        }
      >
        {heading ?? dict.menu.browseCourses}
      </h2>

      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-10">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={localePath(locale, category.url)}
              className="group flex items-baseline gap-2 text-[0.8125rem] tracking-[0.18em] text-ink uppercase transition-colors duration-300 hover:text-gold-ink"
            >
              <span className="border-b border-transparent pb-1 transition-colors duration-300 group-hover:border-gold-ink/60">
                {category.name}
              </span>
              <span className="text-[0.625rem] text-ink-soft transition-colors duration-300 group-hover:text-gold-ink/70">
                {category.item_count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  )
}
