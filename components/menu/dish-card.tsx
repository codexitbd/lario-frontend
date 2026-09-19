import Link from 'next/link'
import { Figure } from '@/components/ui/figure'
import { formatCalories, formatPrice } from '@/lib/format'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { MenuItemCard } from '@/lib/schemas'

/**
 * One dish in the menu grid.
 *
 * Square photograph in a fine gold mount, then everything the card shape
 * actually carries: name, description, dietary tags, price and calories. An
 * earlier pass showed only name and price and masked the photo into an arch —
 * the arch cropped the plate badly at the top and the card told a reader
 * nothing they could choose on. A menu card exists to answer "what is it, can I
 * eat it, what does it cost".
 *
 * Square corners, no mask. The one photographic mask left on the site is the
 * arch on the menu's visit block, which comes from the client's reference.
 *
 * `short_description` is the card-length copy; `description` is the long form
 * for the dish page. Both are rendered from whatever the CMS holds — the card
 * simply omits the line when it is empty rather than substituting the long one.
 *
 * Not a Server Component by choice: it renders inside the client-side filter
 * island, so it has to be client-renderable. It holds no state of its own.
 */
export function DishCard({
  item,
  locale,
  dict,
}: {
  item: MenuItemCard
  locale: Locale
  dict: Dictionary
}) {
  const tags = item.dietary_tags

  return (
    <li className="group">
      <Link
        href={localePath(locale, item.url)}
        className="flex h-full flex-col items-center text-center"
      >
        <span className="relative block w-full">
          <Figure
            src={item.image}
            alt=""
            shot={item.name}
            sizes="(min-width: 1024px) 26rem, (min-width: 640px) 44vw, 90vw"
            className="relative aspect-square w-full"
            imageClassName="transition-transform duration-[900ms] ease-brand group-hover:scale-[1.05]"
          />
          {/* Mount, not a border: inset so the photograph reads as framed. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-3 border border-ivory/20 transition-colors duration-500 ease-brand group-hover:border-gold/70"
          />
          {!item.is_available ? (
            <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-2.5 text-[0.625rem] tracking-[0.2em] text-gold uppercase">
              {dict.menu.unavailable}
            </span>
          ) : null}
        </span>

        <h3 className="mt-7 text-[0.8125rem] tracking-[0.22em] text-ivory uppercase transition-colors duration-300 group-hover:text-gold-pale">
          {item.name}
        </h3>

        {item.short_description ? (
          <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-ivory-dim">
            {item.short_description}
          </p>
        ) : null}

        {tags.length > 0 ? (
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="border border-gold/30 px-2.5 py-1 text-[0.5625rem] tracking-[0.16em] text-gold/90 uppercase transition-colors duration-500 group-hover:border-gold/60"
              >
                {dict.menu.tags[tag as keyof Dictionary['menu']['tags']] ?? tag}
              </li>
            ))}
          </ul>
        ) : null}

        {/* Rule and price travel together to the bottom of the card, so prices
            line up across a row whose descriptions and tag counts differ. */}
        <span className="mt-auto flex flex-col items-center pt-6">
          <span
            aria-hidden="true"
            className="block h-px w-8 bg-gold/40 transition-[width,background-color] duration-500 ease-brand group-hover:w-14 group-hover:bg-gold"
          />

          <span className="mt-4 flex items-center gap-4">
            <span className="lr-display text-lg text-gold">
              {formatPrice(item.price, item.currency, locale)}
            </span>
            {item.calories !== null ? (
              <>
                <span
                  aria-hidden="true"
                  className="block h-4 w-px bg-gold/25"
                />
                <span className="text-[0.6875rem] tracking-[0.12em] text-ivory-dim uppercase">
                  {formatCalories(item.calories, locale)} {dict.menu.calories}
                </span>
              </>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  )
}
