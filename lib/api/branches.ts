import { cacheLife } from 'next/cache'
import { z } from 'zod'
import { apiFind, apiGet } from '@/lib/api/client'
import type { Locale } from '@/lib/i18n/config'
import { type Branch, branchSchema, pageSectionSchema } from '@/lib/schemas'

/** Branch detail plus the admin's "detail page extras" components. */
export const branchDetailSchema = branchSchema.extend({
  sections: z.array(pageSectionSchema).default([]),
})
export type BranchDetail = z.infer<typeof branchDetailSchema>

export async function getBranches(locale: Locale): Promise<Branch[]> {
  'use cache'
  cacheLife('max')

  return apiGet('/branches', z.array(branchSchema), { locale })
}

export async function getBranch(
  locale: Locale,
  slug: string,
): Promise<BranchDetail | null> {
  'use cache'
  cacheLife('max')

  return apiFind(`/branches/${encodeURIComponent(slug)}`, branchDetailSchema, { locale })
}
