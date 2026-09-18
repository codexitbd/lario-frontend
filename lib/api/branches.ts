import { cacheLife, cacheTag } from 'next/cache'
import * as impl from '@/lib/api/branches.impl'
import { tags } from '@/lib/cache-tags'
import type { Locale } from '@/lib/i18n/config'
import type { Branch } from '@/lib/schemas'

export { toSchemaOpeningHours } from '@/lib/api/branches.impl'

export async function getBranches(locale: Locale): Promise<Branch[]> {
  'use cache'
  cacheTag(tags.branches())
  cacheLife('max')

  return impl.getBranches(locale)
}

export async function getBranch(
  locale: Locale,
  slug: string,
): Promise<Branch | null> {
  'use cache'
  cacheTag(tags.branch(slug))
  cacheLife('max')

  return impl.getBranch(locale, slug)
}
