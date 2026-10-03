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
  'page_hero',
  'rich_text',
  'media_split',
  'menu_browser',
  'category_grid',
  'dish_grid',
  'reservation_form',
  'contact',
  'newsletter',
  'post_list',
  'event_list',
  'team_grid',
  'visit',
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
  // 'menu' is the /menu landing page. It is a page row like any other so the
  // menu index gets an editable SEO record from the start, which the brief
  // requires of every resource built in Phases 1-3.
  // 'reservation' (2026-10-01) for the same reason: /reservation needs its own
  // editable SEO record.
  // Pages are component-built now; `heading` and `body` are read from the
  // page's first "Page header" and "Text" components (lib/api/pages.ts).
  is_home: z.boolean().default(false),
  url: z.string().startsWith('/').optional(),
  // GET /pages/{slug} returns sections "when present" (03-api-contract.md).
  // Without this field Zod strips them silently and the page renders empty.
  sections: z.array(pageSectionSchema).default([]),
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
