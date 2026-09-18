import { cacheLife, cacheTag } from 'next/cache'
import { getPage as getPageImpl } from '@/lib/api/pages.impl'
import { tags } from '@/lib/cache-tags'
import type { Locale } from '@/lib/i18n/config'
import type { Page } from '@/lib/schemas'

export async function getPage(
  locale: Locale,
  slug: string,
): Promise<Page | null> {
  'use cache'
  cacheTag(tags.page(slug))
  cacheLife('max')

  return getPageImpl(locale, slug)
}
