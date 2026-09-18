import { cacheLife, cacheTag } from 'next/cache'
import * as impl from '@/lib/api/branches.impl'
import { tags } from '@/lib/cache-tags'
import type { Locale } from '@/lib/i18n/config'
import type { Branch } from '@/lib/schemas'

export { toSchemaOpeningHours } from '@/lib/api/branches.impl'

export async function getBranches(locale: Locale): Promise<Branch[]> {
  'use cache'
  // Both tags, for the same reason getBranch carries both: toBranch ALWAYS
  // populates popular_dishes, so every row in this list renders dish cards,
  // and a dish edit emits `menu` — never `branches`. Tagging only `branches`
  // leaves a repriced dish showing its old price on every branch card, with
  // nothing erroring.
  cacheTag(tags.branches(), tags.menu())
  cacheLife('max')

  return impl.getBranches(locale)
}

export async function getBranch(
  locale: Locale,
  slug: string,
): Promise<Branch | null> {
  'use cache'
  // Both tags: this page renders popular_dishes, and a dish edit emits `menu`
  // (never `branch:{slug}`) per the contract cascade. Tagging only the branch
  // means a repriced dish leaves this page serving a stale price — silently,
  // with nothing erroring. Same failure class as getMenuCategory.
  cacheTag(tags.branch(slug), tags.menu())
  cacheLife('max')

  return impl.getBranch(locale, slug)
}
