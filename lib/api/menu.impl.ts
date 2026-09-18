// Pure, uncached bodies for the menu fetchers in `menu.ts`.
//
// `cacheTag()`/`cacheLife()` require a live Next.js `workUnitAsyncStorage`
// context that only exists during actual Next.js rendering — Vitest cannot
// provide it (confirmed: `test.server.deps.inline: ['next']` does not help;
// it throws `cacheTag() is only available with the cacheComponents config`
// regardless). So the logic lives here, tested directly, and `menu.ts` stays
// a thin 'use cache' + cacheTag + cacheLife wrapper around each export below.
import categoriesFixture from '@/content/menu-categories.json'
import itemsFixture from '@/content/menu-items.json'
import { buildSeo } from '@/content/seo-defaults'
import { resolveTranslation } from '@/lib/api/resolve'
import type { Locale } from '@/lib/i18n/config'
import type {
  MenuCategory,
  MenuCategoryDetail,
  MenuItem,
  MenuItemCard,
} from '@/lib/schemas'

function categoryRef(locale: Locale, slug: string) {
  const category = categoriesFixture.find((c) => c.slug === slug)
  if (!category) throw new Error(`Unknown category slug: ${slug}`)
  return { slug, name: resolveTranslation(category.translations, locale).name }
}

export function toCard(
  locale: Locale,
  item: (typeof itemsFixture)[number],
): MenuItemCard {
  const t = resolveTranslation(item.translations, locale)
  return {
    slug: item.slug,
    name: t.name,
    short_description: t.short_description,
    price: item.price,
    currency: item.currency,
    calories: item.calories,
    image: item.image,
    dietary_tags: item.dietary_tags as MenuItemCard['dietary_tags'],
    is_available: item.is_available,
    category: categoryRef(locale, item.category_slug),
    url: `/menu/${item.category_slug}/${item.slug}`,
  }
}

// Pure lookup shared by getFeaturedItems (home-tagged) and any other fetcher
// that needs to resolve slugs to cards under its OWN cache tag (branch
// popular dishes, for instance) — reusing this keeps that resolution from
// silently riding on the `home` tag.
export function resolveItemCards(locale: Locale, slugs: string[]): MenuItemCard[] {
  return slugs
    .map((slug) => itemsFixture.find((i) => i.slug === slug))
    .filter((item): item is (typeof itemsFixture)[number] => Boolean(item))
    .map((item) => toCard(locale, item))
}

export function getMenuCategories(locale: Locale): MenuCategory[] {
  return categoriesFixture
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => {
      const t = resolveTranslation(category.translations, locale)
      const path = `/menu/${category.slug}`
      return {
        slug: category.slug,
        name: t.name,
        description: t.description,
        intro_content: t.intro_content,
        image: category.image,
        item_count: itemsFixture.filter(
          (i) => i.category_slug === category.slug,
        ).length,
        url: path,
        seo: buildSeo({
          title: t.name,
          description: t.description ?? '',
          path,
          locale,
          image: category.image,
        }),
      }
    })
}

export function getMenuItems(locale: Locale): MenuItemCard[] {
  return itemsFixture.map((item) => toCard(locale, item))
}

export function getMenuCategory(
  locale: Locale,
  slug: string,
): MenuCategoryDetail | null {
  const category = getMenuCategories(locale).find((c) => c.slug === slug)
  if (!category) return null

  const items = itemsFixture
    .filter((i) => i.category_slug === slug)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => toCard(locale, item))

  return { ...category, items }
}

export function getMenuItem(locale: Locale, slug: string): MenuItem | null {
  const item = itemsFixture.find((i) => i.slug === slug)
  if (!item) return null

  const t = resolveTranslation(item.translations, locale)
  const card = toCard(locale, item)
  const related = itemsFixture
    .filter((i) => i.category_slug === item.category_slug && i.slug !== slug)
    .slice(0, 4)
    .map((i) => toCard(locale, i))

  return {
    ...card,
    description: t.description,
    ingredients_note: t.ingredients_note ?? null,
    preparation_note: t.preparation_note ?? null,
    allergens: item.allergens as MenuItem['allergens'],
    seo: buildSeo({
      title: t.name,
      description: t.short_description ?? t.description,
      path: card.url,
      locale,
      image: item.image,
      type: 'article',
    }),
    related,
  }
}

export function getFeaturedItems(locale: Locale, slugs: string[]): MenuItemCard[] {
  return resolveItemCards(locale, slugs)
}
