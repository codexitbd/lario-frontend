import { cacheLife, cacheTag } from 'next/cache'
import { getHome as getHomeImpl } from '@/lib/api/home.impl'
import { tags } from '@/lib/cache-tags'
import type { Locale } from '@/lib/i18n/config'
import type { Home } from '@/lib/schemas'

export async function getHome(locale: Locale): Promise<Home> {
  'use cache'
  // Both tags. The `menu` cascade fires for any dish or category change, and
  // this payload embeds both: branch_cards inlines whole Branch objects
  // (popular_dishes included) and featured_dishes cards carry category.name
  // read from the categories fixture — so neither a repriced dish nor a
  // renamed category invalidates the homepage through `home` alone. The
  // contract cascades `home` only for is_featured dishes and branch saves;
  // everything else about this page arrives under `menu`.
  cacheTag(tags.home(), tags.menu())
  cacheLife('max')

  return getHomeImpl(locale)
}
