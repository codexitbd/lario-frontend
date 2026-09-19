'use client'

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import {
  MagnifyingGlassIcon,
  SlidersHorizontalIcon,
  XIcon,
} from '@phosphor-icons/react/ssr'
import { Container } from '@/components/ui/container'
import { DishCard } from '@/components/menu/dish-card'
import {
  EMPTY_FILTERS,
  PRICE_BANDS,
  hasAnyFilter,
  matchesFilters,
  parseFilters,
  toSearchParams,
  type BandId,
  type Filters,
} from '@/components/menu/filters'
import { formatPrice } from '@/lib/format'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { MenuCategory, MenuItemCard } from '@/lib/schemas'

/**
 * Search, dietary and price filtering over the whole menu, plus the grid it
 * produces. The one interactive part of /menu.
 *
 * The controls are COLLAPSED behind a single button. Browsing by course is the
 * common path and sits above this, always visible; search and filters are the
 * rarer, deliberate act, and three rows of chips parked permanently between the
 * courses and the food made the page read as a search tool rather than a menu.
 * A link that arrives already filtered opens the panel by itself, so nobody
 * meets a short list with no visible reason for it.
 *
 * Filtering is CLIENT-SIDE on purpose. Reading `searchParams` on the server
 * would make the route dynamic, and this page has 89 dish photographs and a
 * 95+ mobile PageSpeed target. Every dish is in the server-rendered HTML, so a
 * crawler sees the full menu; the filter only hides what is already there.
 *
 * The URL IS the filter state — there is no mirrored copy in a useState. The
 * query string is subscribed to as an external store, so a shared link, the
 * back button and a click on a chip all take the same path, and the component
 * holds no state that can drift out of step with the address bar. Writes go
 * through `replaceState` so filtering never stacks history entries or asks the
 * router to re-render the static shell.
 *
 * Category pills are NOT here: they navigate to /menu/[category] (decision
 * D10) so course URLs stay the ranking asset rather than competing with a
 * filtered /menu.
 *
 * Results stay grouped by course while filtering, which is how a menu is read.
 * A course with no matches drops out rather than showing an empty heading.
 *
 * Two grounds, deliberately: the controls finish the bone band that carries the
 * intro copy and the course list, and the grid switches to ink beneath it.
 * Plated food carries on a dark ground, and the page needs the light band to
 * breathe between the hero and 89 photographs.
 */
const URL_CHANGED = 'lr:menu-filters'

/**
 * The query string as an external store. `popstate` covers the back button;
 * the custom event covers our own replaceState writes, which fire nothing.
 */
function subscribeToUrl(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  window.addEventListener(URL_CHANGED, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(URL_CHANGED, onChange)
  }
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  )
}

export function MenuBrowser({
  items,
  categories,
  locale,
  dict,
}: {
  items: MenuItemCard[]
  categories: MenuCategory[]
  locale: Locale
  dict: Dictionary
}) {
  // The server has no location, so it snapshots an empty query string and
  // renders the unfiltered menu — which is exactly the HTML a crawler should
  // get. React reconciles to the real URL on hydration.
  const search = useSyncExternalStore(
    subscribeToUrl,
    () => window.location.search,
    () => '',
  )
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(search)),
    [search],
  )
  const { query, diet, band } = filters
  const filtered = hasAnyFilter(filters)

  // null means "the reader has not decided yet", so the panel follows the URL:
  // shut on a plain visit, open on a link that arrives filtered. Deriving it
  // rather than syncing state in an effect keeps this at one render.
  const [toggled, setToggled] = useState<boolean | null>(null)
  const open = toggled ?? filtered

  const write = useCallback((next: Filters) => {
    const qs = toSearchParams(next)
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    )
    // replaceState fires no event of its own, so the store is told directly.
    window.dispatchEvent(new Event(URL_CHANGED))
  }, [])

  const patch = (next: Partial<Filters>) => write({ ...filters, ...next })

  const matches = useMemo(
    () => items.filter((item) => matchesFilters(item, filters)),
    [items, filters],
  )

  const grouped = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          dishes: matches.filter((item) => item.category.slug === category.slug),
        }))
        .filter((group) => group.dishes.length > 0),
    [categories, matches],
  )

  const dietaryTags = useMemo(
    () => [...new Set(items.flatMap((item) => item.dietary_tags))],
    [items],
  )

  const clear = () => write(EMPTY_FILTERS)

  const money = (amount: number) =>
    formatPrice(amount.toFixed(2), items[0]?.currency ?? 'SAR', locale)

  const bandLabel = (id: BandId) => {
    const b = PRICE_BANDS.find((x) => x.id === id)!
    if (b.max === Number.POSITIVE_INFINITY)
      return interpolate(dict.menu.priceOver, { min: money(b.min) })
    if (b.min === 0)
      return interpolate(dict.menu.priceUnder, { max: money(b.max) })
    return interpolate(dict.menu.priceBetween, {
      min: money(b.min),
      max: money(b.max),
    })
  }

  // Chips sit on bone, so gold drops to --color-gold-ink to hold contrast.
  const chip = (active: boolean) =>
    `border px-5 py-2.5 text-[0.6875rem] tracking-[0.18em] uppercase transition-colors duration-300 ease-brand ${
      active
        ? 'border-gold-ink bg-gold-ink/10 text-ink'
        : 'border-ink/20 text-ink-soft hover:border-gold-ink/60 hover:text-gold-ink'
    }`

  const resultLabel =
    matches.length === 1
      ? dict.menu.resultsOne
      : interpolate(dict.menu.resultsMany, { count: String(matches.length) })

  return (
    <>
      <section className="bg-bone pt-12 pb-14 md:pb-20">
        <Container>
          <div className="flex flex-col items-center gap-5">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <button
                type="button"
                onClick={() => setToggled(!open)}
                aria-expanded={open}
                aria-controls="menu-filters"
                className="flex items-center gap-2.5 border border-ink/25 px-6 py-3 text-[0.6875rem] tracking-[0.2em] text-ink uppercase transition-colors duration-300 ease-brand hover:border-gold-ink hover:text-gold-ink"
              >
                <SlidersHorizontalIcon aria-hidden="true" className="size-4" />
                {dict.menu.filters}
              </button>

              {/* Outside the panel on purpose: with the panel shut this is the
                  only thing explaining why the list is short. */}
              {filtered ? (
                <p className="flex items-center gap-4 text-sm text-ink-soft">
                  <span aria-live="polite">{resultLabel}</span>
                  <button
                    type="button"
                    onClick={clear}
                    className="inline-flex items-center gap-1.5 border-b border-gold-ink/40 pb-0.5 text-[0.6875rem] tracking-[0.18em] text-gold-ink uppercase transition-colors duration-300 hover:border-gold-ink hover:text-ink"
                  >
                    <XIcon aria-hidden="true" className="size-3" />
                    {dict.menu.clearFilters}
                  </button>
                </p>
              ) : null}
            </div>

            {/* `inert` when shut, so collapsed controls are not focusable and
                not announced — a 0fr row still contains reachable elements. */}
            <div
              id="menu-filters"
              inert={!open}
              className={`grid w-full transition-[grid-template-rows,opacity] duration-500 ease-brand ${
                open
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-7 pt-8">
                  <label className="relative block w-full">
                    <span className="sr-only">
                      {dict.menu.searchPlaceholder}
                    </span>
                    <MagnifyingGlassIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute start-0 top-1/2 size-5 -translate-y-1/2 text-gold-ink"
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => patch({ query: event.target.value })}
                      placeholder={dict.menu.searchPlaceholder}
                      className="w-full border-b border-ink/25 bg-transparent py-4 ps-9 text-center text-lg text-ink transition-colors duration-300 placeholder:text-ink-soft/70 focus:border-gold-ink focus:outline-none"
                    />
                  </label>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => patch({ diet: null })}
                      aria-pressed={diet === null}
                      className={chip(diet === null)}
                    >
                      {dict.menu.dietaryAll}
                    </button>
                    {dietaryTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          patch({ diet: diet === tag ? null : tag })
                        }
                        aria-pressed={diet === tag}
                        className={chip(diet === tag)}
                      >
                        {dict.menu.tags[
                          tag as keyof Dictionary['menu']['tags']
                        ] ?? tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => patch({ band: null })}
                      aria-pressed={band === null}
                      className={chip(band === null)}
                    >
                      {dict.menu.priceAny}
                    </button>
                    {PRICE_BANDS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          patch({ band: band === b.id ? null : b.id })
                        }
                        aria-pressed={band === b.id}
                        className={chip(band === b.id)}
                      >
                        {bandLabel(b.id)}
                      </button>
                    ))}
                  </div>

                  {!filtered ? (
                    <p aria-live="polite" className="text-sm text-ink-soft">
                      {resultLabel}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-ink pb-24 md:pb-32">
        <Container>
          {grouped.length === 0 ? (
            <p className="py-28 text-center text-lg text-ivory-dim">
              {dict.menu.noResults}
            </p>
          ) : (
            grouped.map((group) => (
              <section key={group.category.slug} className="pt-24 md:pt-32">
                {/* The reference marks each course with a small caps title
                    between two lozenges. */}
                <h2 className="flex items-center justify-center gap-4 text-[0.8125rem] tracking-[0.3em] text-ivory uppercase">
                  <span aria-hidden="true" className="text-xs text-gold">
                    &#9671;
                  </span>
                  {group.category.name}
                  <span aria-hidden="true" className="text-xs text-gold">
                    &#9671;
                  </span>
                </h2>

                <ul className="mt-14 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-20">
                  {group.dishes.map((item) => (
                    <DishCard
                      key={item.slug}
                      item={item}
                      locale={locale}
                      dict={dict}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </Container>
      </section>
    </>
  )
}
