import { z } from 'zod'
import { seoSchema } from '@/lib/schemas/common'
import { menuItemCardSchema } from '@/lib/schemas/menu'

export const SECTION_TYPES = [
  'hero',
  'intro',
  'featured_dishes',
  'why_lario',
  'chef_story',
  'branch_cards',
  'private_events',
  'gallery_strip',
  'testimonials',
  'faq',
  'reservation_cta',
] as const

export type SectionType = (typeof SECTION_TYPES)[number]

export const pageSectionSchema = z.object({
  type: z.string().min(1),
  sort_order: z.number().int().nonnegative(),
  payload: z.record(z.string(), z.unknown()),
  content: z.record(z.string(), z.unknown()),
  items: z.array(menuItemCardSchema).optional(),
})
export type PageSection = z.infer<typeof pageSectionSchema>

export const homeSchema = z.object({
  seo: seoSchema,
  sections: z.array(pageSectionSchema),
})
export type Home = z.infer<typeof homeSchema>

export const pageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  heading: z.string(),
  body: z.string(),
  template: z.enum(['home', 'contact', 'legal']),
  seo: seoSchema,
})
export type Page = z.infer<typeof pageSchema>

export const testimonialSchema = z.object({
  author_name: z.string().min(1),
  author_title: z.string().nullable(),
  body: z.string().min(1),
  rating: z.number().int().min(1).max(5).nullable(),
  source: z.enum(['google', 'tripadvisor', 'direct']).nullable(),
})
export type Testimonial = z.infer<typeof testimonialSchema>
