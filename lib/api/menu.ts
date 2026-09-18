import { cacheLife, cacheTag } from 'next/cache'
import * as impl from '@/lib/api/menu.impl'
import { tags } from '@/lib/cache-tags'
import type { Locale } from '@/lib/i18n/config'
import type {
  MenuCategory,
  MenuCategoryDetail,
  MenuItem,
  MenuItemCard,
} from '@/lib/schemas'

export { toCard, resolveItemCards } from '@/lib/api/menu.impl'

export async function getMenuCategories(
  locale: Locale,
): Promise<MenuCategory[]> {
  'use cache'
  cacheTag(tags.menu())
  cacheLife('max')

  return impl.getMenuCategories(locale)
}

export async function getMenuItems(locale: Locale): Promise<MenuItemCard[]> {
  'use cache'
  cacheTag(tags.menu())
  cacheLife('max')

  return impl.getMenuItems(locale)
}

export async function getMenuCategory(
  locale: Locale,
  slug: string,
): Promise<MenuCategoryDetail | null> {
  'use cache'
  // Both tags: a dish edit emits `menu` per the contract cascade, and this page
  // renders dishes. Without it the category page serves stale items silently.
  cacheTag(tags.menuCategory(slug), tags.menu())
  cacheLife('max')

  return impl.getMenuCategory(locale, slug)
}

export async function getMenuItem(
  locale: Locale,
  slug: string,
): Promise<MenuItem | null> {
  'use cache'
  // Both tags: this page renders `related` dishes from the same category, and
  // editing one of those dishes emits `menu` (never this item's own tag) per
  // the contract cascade. Tagging only menu-item:{slug} means an edit to a
  // related dish leaves this page stale — silently, with nothing erroring.
  // Same failure class as getMenuCategory.
  cacheTag(tags.menuItem(slug), tags.menu())
  cacheLife('max')

  return impl.getMenuItem(locale, slug)
}

export async function getFeaturedItems(
  locale: Locale,
  slugs: string[],
): Promise<MenuItemCard[]> {
  'use cache'
  cacheTag(tags.home())
  cacheLife('max')

  return impl.getFeaturedItems(locale, slugs)
}
