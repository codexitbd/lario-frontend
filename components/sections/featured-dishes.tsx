import type { CSSProperties } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import { SectionHeader } from '@/components/ui/section-header'
import { readText, type Bag } from '@/components/sections/content'
import { formatPrice } from '@/lib/format'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { MenuItemCard } from '@/lib/schemas'

/**
 * Reference 02-featured-dishes, followed as drawn.
 *
 * Five columns over two rows. A double-width hero tile occupies the middle two
 * columns with its naming laid over the photograph; the three flanking columns
 * each split into a photo half and a flat dark naming half, and which half sits
 * on top alternates across the columns. That alternation is the composition —
 * it is what stops the row reading as four identical cards.
 *
 *   col 1        col 2-3        col 4        col 5
 *   [ photo ]  [           ]  [ naming ]  [ photo  ]
 *   [ naming]  [    HERO   ]  [ photo  ]  [ naming ]
 *
 * FOUR dishes, matching the reference's four menus. The fixture carries four
 * slugs for this reason; adding more breaks the layout rather than extending
 * it, because there is no fifth column in the reference to put them in.
 *
 * Each dish is a single link wrapping its whole column, so the photo half and
 * the naming half are one target rather than two links to the same place.
 */
type Tile = { item: MenuItemCard; photoFirst: boolean }

/** The flat naming half of a column, and the overlay on the hero tile. */
function Naming({
  item,
  locale,
  viewLabel,
  large = false,
}: {
  item: MenuItemCard
  locale: Locale
  viewLabel: string
  large?: boolean
}) {
  return (
    <span
      className={`flex flex-col items-center justify-center gap-2 px-5 text-center ${
        large ? 'gap-3 md:px-10' : 'md:px-6'
      }`}
    >
      <span className="text-[0.625rem] tracking-[0.22em] text-gold uppercase">
        {item.category.name}
      </span>
      <span
        className={`lr-display leading-tight text-ivory ${
          large
            ? 'text-[clamp(1.75rem,1.1rem+1.8vw,2.75rem)]'
            : 'text-lg md:text-xl lg:text-2xl'
        }`}
      >
        {item.name}
      </span>
      <span className="text-sm text-ivory-dim">
        {formatPrice(item.price, item.currency, locale)}
      </span>
      <span className="mt-1 border-b border-gold/40 pb-1 text-[0.6875rem] tracking-[0.18em] text-gold uppercase transition-colors duration-300 group-hover:border-gold">
        {viewLabel}
      </span>
    </span>
  )
}

/** The photo half of a column. `row` places it explicitly; see below. */
function Photo({
  item,
  sizes,
  row,
}: {
  item: MenuItemCard
  sizes: string
  row: string
}) {
  return (
    <span className={`relative block overflow-hidden ${row}`}>
      <Figure
        src={item.image}
        alt=""
        shot={item.name}
        sizes={sizes}
        className="absolute inset-0"
        imageClassName="transition-transform duration-[900ms] ease-brand group-hover:scale-[1.06]"
      />
    </span>
  )
}

export function FeaturedDishes({
  section,
  locale,
  dict,
}: {
  section: { content: Bag; items?: MenuItemCard[] }
  locale: Locale
  dict: Dictionary
}) {
  const { content, items = [] } = section
  if (items.length === 0) return null

  const [hero, ...rest] = items
  // Columns 1, 4 and 5 in the reference: photo on top, naming on top, photo on
  // top. Anything beyond the fourth dish has no column and is not rendered —
  // see the note above.
  const columns: Tile[] = rest
    .slice(0, 3)
    .map((item, index) => ({ item, photoFirst: index !== 1 }))

  return (
    <section className="relative isolate overflow-hidden bg-ink py-24 md:py-32">
      {/* Serrated edge carried down from the intro section above (reference
          01-intro-bottom), in that section's bone so the teeth read against
          this one's ink. The backdrop drifts behind it on scroll. */}
      <span
        aria-hidden="true"
        className="lr-teeth pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-bone"
      />
      <span
        aria-hidden="true"
        className="lr-drift pointer-events-none absolute inset-x-0 -top-[10%] -z-10 h-[120%] bg-[radial-gradient(70%_50%_at_50%_10%,color-mix(in_srgb,var(--color-gold)_9%,transparent)_0%,transparent_70%)]"
      />

      <Container>
        <SectionHeader
          eyebrow={readText(content, 'eyebrow')}
          heading={readText(content, 'heading')}
          subheading={readText(content, 'subheading')}
          treatment="label"
          align="center"
        />
      </Container>

      <ul className="mt-14 grid grid-cols-1 md:mt-20 lg:h-[44rem] lg:grid-cols-5 lg:grid-rows-2">
        {/* Hero: the middle two columns, full height, naming over the image. */}
        <li className="lr-reveal lg:col-span-2 lg:col-start-2 lg:row-span-2">
          <Link
            href={localePath(locale, hero.url)}
            className="group relative flex aspect-[4/5] items-end justify-center overflow-hidden sm:aspect-[16/10] lg:h-full lg:aspect-auto"
          >
            <Figure
              src={hero.image}
              alt=""
              shot={hero.name}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="absolute inset-0 -z-10"
              imageClassName="transition-transform duration-[900ms] ease-brand group-hover:scale-[1.05]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--color-ink)_2%,color-mix(in_srgb,var(--color-ink)_60%,transparent)_38%,color-mix(in_srgb,var(--color-ink)_18%,transparent)_100%)]"
            />
            <span className="relative w-full pb-12">
              <Naming
                item={hero}
                locale={locale}
                viewLabel={dict.actions.viewDetails}
                large
              />
            </span>
          </Link>
        </li>

        {columns.map((tile, index) => {
          // Columns 1, 4 and 5 of the reference, in that order.
          const placement = [
            'lg:col-start-1 lg:row-start-1 lg:row-span-2',
            'lg:col-start-4 lg:row-start-1 lg:row-span-2',
            'lg:col-start-5 lg:row-start-1 lg:row-span-2',
          ][index]

          return (
            <li
              key={tile.item.slug}
              className={`lr-reveal ${placement}`}
              style={{ '--i': index + 1 } as CSSProperties}
            >
              <Link
                href={localePath(locale, tile.item.url)}
                className="group grid min-h-56 grid-cols-2 lg:h-full lg:min-h-0 lg:grid-cols-1 lg:grid-rows-2"
              >
                <Photo
                  item={tile.item}
                  sizes="(min-width: 1024px) 20vw, 50vw"
                  row={tile.photoFirst ? 'lg:row-start-1' : 'lg:row-start-2'}
                />
                <span
                  className={`flex items-center justify-center bg-ink-raised transition-colors duration-500 ease-brand group-hover:bg-emerald ${
                    tile.photoFirst ? 'lg:row-start-2' : 'lg:row-start-1'
                  }`}
                >
                  <Naming
                    item={tile.item}
                    locale={locale}
                    viewLabel={dict.actions.viewDetails}
                  />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <Container className="lr-reveal mt-16 flex justify-center">
        <Cta href={localePath(locale, '/menu')} variant="outline">
          {readText(content, 'cta_label')}
        </Cta>
      </Container>
    </section>
  )
}
