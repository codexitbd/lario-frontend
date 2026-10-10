import { z } from 'zod'
import { imageUrlSchema, seoSchema } from '@/lib/schemas/common'
import { pageSectionSchema } from '@/lib/schemas/page'

export const teamMemberSchema = z.object({
  slug: z.string(),
  name: z.string(),
  role: z.string().nullable(),
  bio: z.string().nullable(),
  photo: imageUrlSchema.nullable(),
  photo_alt: z.string().nullish(),
})
export type TeamMember = z.infer<typeof teamMemberSchema>

const ref = z.object({ slug: z.string(), name: z.string().nullable() })

export const postCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  cover: imageUrlSchema.nullable(),
  cover_alt: z.string().nullish(),
  // 4:3 list card photo; the API falls back to `cover`.
  card_image: imageUrlSchema.nullish(),
  published_at: z.string().nullable(),
  category: ref.nullable(),
  author: teamMemberSchema.nullable(),
  url: z.string().startsWith('/'),
})
export type PostCard = z.infer<typeof postCardSchema>

export const postSchema = postCardSchema.extend({
  body: z.string(),
  seo: seoSchema,
  sections: z.array(pageSectionSchema).default([]),
})
export type Post = z.infer<typeof postSchema>

export const eventCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  cover: imageUrlSchema.nullable(),
  cover_alt: z.string().nullish(),
  // 4:3 list card photo; the API falls back to `cover`.
  card_image: imageUrlSchema.nullish(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  branch: ref.nullable(),
  url: z.string().startsWith('/'),
})
export type EventCard = z.infer<typeof eventCardSchema>

export const eventSchema = eventCardSchema.extend({
  body: z.string(),
  seo: seoSchema,
  sections: z.array(pageSectionSchema).default([]),
})
export type Event = z.infer<typeof eventSchema>
