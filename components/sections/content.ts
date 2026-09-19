import { z } from 'zod'
import { branchSchema } from '@/lib/schemas/branch'
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

/** A nullable list of image URLs, as `gallery_strip.payload.images` supplies it. */
export function readImageList(bag: Bag, key: string): (string | null)[] {
  const parsed = z.array(z.string().nullable()).safeParse(bag[key])
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
})
export type EventCard = z.infer<typeof eventCardSchema>

export const faqItemSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
})
export type FaqItem = z.infer<typeof faqItemSchema>

export const statSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
})
export type Stat = z.infer<typeof statSchema>

export { branchSchema, testimonialSchema }
