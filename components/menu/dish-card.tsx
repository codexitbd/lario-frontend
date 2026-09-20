import Link from 'next/link'
import { Figure } from '@/components/ui/figure'
import { formatCalories, formatPrice } from '@/lib/format'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { MenuItemCard } from '@/lib/schemas'

/**
 * One dish in the menu grid. Cinematic register: the plate is the argument.
 *
 * The photograph is the largest thing on the card by a wide margin and
 * everything else recedes under it. An earlier pass had the photo square and
 * then stacked five competing elements beneath it (tracked-caps name, body
 * copy, three bordered tag pills, a gold rule, a price row), so the chrome
 * outweighed the food on a page whose whole job is to make people hungry.
 *
 * What went, and why:
 *   the gold rule          a separator between two things that were already
 *                          separated by space
 *   tracked-caps naming    a dish has a name, not a label. Bodoni at reading
 *                          size reads as a menu; micro-caps reads as a badge
 *   bordered tag pills     three boxes per card, 267 boxes on /menu. Same
 *                          information as plain text, a fraction of the noise
 *
 * What deliberately STAYED: `short_description`, the dietary tags and the
 * calorie figure. Those were asked for explicitly and they are the things a
 * diner actually chooses on. They are quieter now, not gone.
 *
 * THE INSET FRAME IS BACK, reversing a call made during the de-slop pass. It
 * was cut here as decorative scaffolding, but the same frame is on the homepage
 * intro cards, the private-events portraits, the dish page's plate and the
 * visit block. Removing it from the 89-card grid alone simplified nothing; it
 * just made the menu the one place without the house treatment. It is a motif,
 * not scaffolding. The rule:
 *
 *   interactive images  inset-4, border-ivory/35, warming to gold on hover
 *   static images       inset-3, border-ivory/20, no hover
 *
 * These cards are links, so they take the interactive variant and match the
 * homepage exactly.
 *
 * Portrait 4:5 rather than square, because plated food photographed from above
 * fills a portrait frame better and it buys the image ~25% more area at the
 * same column width.
 *
 * `.lr-plate` is the reveal: the image settles from slightly oversize with its
 * clip opening from the base. Not `.lr-focus` (which adds a blur) because this
 * component renders 89 times on /menu and simultaneous blur filters are a
 * mobile frame-rate problem.
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
  const tags = item.dietary_tags.map(
    (tag) => dict.menu.tags[tag as keyof Dictionary['menu']['tags']] ?? tag,
  )

  return (
    <li className="group">
      <Link
        href={localePath(locale, item.url)}
        className="flex h-full flex-col text-start"
      >
        <span className="lr-plate relative block w-full overflow-hidden">
          <Figure
            src={item.image}
            alt=""
            shot={item.name}
            sizes="(min-width: 1024px) 26rem, (min-width: 640px) 44vw, 90vw"
            className="relative aspect-[4/5] w-full"
            imageClassName="transition-transform duration-[1200ms] ease-brand group-hover:scale-[1.04]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 border border-ivory/35 transition-colors duration-500 ease-brand group-hover:border-gold/80"
          />
          {!item.is_available ? (
            <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-2.5 text-center text-[0.625rem] tracking-[0.2em] text-gold uppercase">
              {dict.menu.unavailable}
            </span>
          ) : null}
        </span>

        <h3 className="lr-display mt-5 text-xl leading-tight text-ivory transition-colors duration-500 ease-brand group-hover:text-gold-pale">
          {item.name}
        </h3>

        {item.short_description ? (
          <p className="mt-2 max-w-[38ch] text-[0.8125rem] leading-relaxed text-ivory-dim/85">
            {item.short_description}
          </p>
        ) : null}

        {/* One quiet meta line, pushed to the card's base so prices align
            across a row whose descriptions differ in length. */}
        <span className="mt-auto flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-5">
          <span className="lr-display text-lg text-gold">
            {formatPrice(item.price, item.currency, locale)}
          </span>
          {item.calories !== null ? (
            <span className="text-[0.6875rem] tracking-[0.1em] text-ivory-dim/70 uppercase">
              {formatCalories(item.calories, locale)} {dict.menu.calories}
            </span>
          ) : null}
        </span>

        {tags.length > 0 ? (
          <span className="mt-1.5 block text-[0.6875rem] tracking-[0.1em] text-gold/60 uppercase">
            {tags.join(', ')}
          </span>
        ) : null}
      </Link>
    </li>
  )
}
