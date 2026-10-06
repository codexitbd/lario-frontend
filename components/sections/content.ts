import { z } from 'zod'
import { type Locale, localePath } from '@/lib/i18n/config'
import { branchSchema } from '@/lib/schemas/branch'
import { galleryImageSchema, type GalleryImage } from '@/lib/schemas/common'
import { testimonialSchema } from '@/lib/schemas/page'

/**
 * Readers for a section's `content` and `payload` bags.
 *
 * `pageSectionSchema` types both as `Record<string, unknown>` on purpose — each
 * of the eleven section types carries a different shape, and the contract keeps
 * the envelope loose so an editor can add a type without a schema migration.
 * That looseness stops at the component boundary: everything a section renders
 * is parsed here, so a malformed or half-translated section degrades to an
 * empty list instead of throwing on a `.map` of undefined.
 *
 * Never reach into `content[...]` directly from a component.
 */

export type Bag = Record<string, unknown>

export function readText(bag: Bag, key: string): string {
  const value = bag[key]
  return typeof value === 'string' ? value : ''
}

export function readList<T>(bag: Bag, key: string, schema: z.ZodType<T>): T[] {
  const parsed = z.array(schema).safeParse(bag[key])
  return parsed.success ? parsed.data : []
}

/** Image fields are `null` until the client's photography lands. */
export function readImage(bag: Bag, key: string): string | null {
  const value = bag[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function readNestedImage(bag: Bag, path: [string, string]): string | null {
  const [outer, inner] = path
  const parsed = z
    .record(z.string(), z.object({ image: z.string().nullable() }))
    .safeParse(bag[outer])
  if (!parsed.success) return null
  return parsed.data[inner]?.image ?? null
}

/**
 * `gallery_strip.payload.images`: photos with alt text and caption, or `null`
 * slots while the client's photography is missing.
 */
export function readImageList(bag: Bag, key: string): (GalleryImage | null)[] {
  const parsed = z.array(galleryImageSchema.nullable()).safeParse(bag[key])
  return parsed.success ? parsed.data : []
}

export const cuisineCardSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
})
export type CuisineCard = z.infer<typeof cuisineCardSchema>

export const iconPointSchema = z.object({
  icon: z.string().min(1),
  label: z.string().min(1),
})
export type IconPoint = z.infer<typeof iconPointSchema>

export const eventCardSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  image: z.string().nullable().optional(),
})
export type EventCard = z.infer<typeof eventCardSchema>

export const faqItemSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
})
export type FaqItem = z.infer<typeof faqItemSchema>

// `label` is admin-written (CMS); `key` + a UI-string unit is the original fixture shape.
export const statSchema = z.object({
  key: z.string().optional(),
  label: z.string().optional(),
  value: z.string().min(1),
})
export type Stat = z.infer<typeof statSchema>

export { branchSchema, testimonialSchema }

const linkSchema = z.object({
  href: z.string().min(1),
  new_tab: z.boolean().optional(),
  external: z.boolean().optional(),
})

export type SectionLink = { href: string; newTab: boolean }

/**
 * A button target the admin picked (payload[key] = {href, new_tab, external}).
 * Internal hrefs arrive locale-free and get the language prefix here.
 * Key absent (content written before links were editable) → `fallback`;
 * key present but null (the admin removed the link) → no button.
 */
export function readLink(
  bag: Bag,
  key: string,
  locale: Locale,
  fallback: string | null = null,
): SectionLink | null {
  if (!(key in bag)) return fallback ? { href: localePath(locale, fallback), newTab: false } : null
  const parsed = linkSchema.safeParse(bag[key])
  if (!parsed.success) return null
  const { href, external, new_tab } = parsed.data
  return { href: external ? href : localePath(locale, href), newTab: new_tab ?? false }
}
