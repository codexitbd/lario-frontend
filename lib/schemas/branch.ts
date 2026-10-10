import { z } from 'zod'
import { galleryImageSchema, imageUrlSchema, seoSchema } from '@/lib/schemas/common'
import { menuItemCardSchema } from '@/lib/schemas/menu'

export const openingHourSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  opens_at: z.string().nullable(),
  closes_at: z.string().nullable(),
  is_closed: z.boolean(),
})

export const branchSchema = z.object({
  // Admin-created: any number of branches, any slug.
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string(),
  address: z.string(),
  city: z.string(),
  story: z.string(),
  directions_note: z.string().nullable(),
  phone: z.string(),
  whatsapp: z.string().nullable(),
  // Required, deliberately, against 02-database-schema.md's nullable column —
  // which the contract now says must become NOT NULL. This is the address a
  // reservation notification is sent to; a null here means a 201 with nobody
  // told, in the one flow the client is paying for.
  email: z.email(),
  coordinates: z.object({ latitude: z.number(), longitude: z.number() }),
  // Nullable, matching the column. The branch page hides the directions link
  // when it is absent rather than constructing a URL from coordinates.
  google_maps_url: z.url().nullable(),
  google_place_id: z.string().nullable(),
  hero_image: imageUrlSchema.nullable(),
  story_image: imageUrlSchema.nullable().optional(),
  // Admin-written alt text; null means none was written and the image stays decorative.
  hero_image_alt: z.string().nullish(),
  // Phone hero and the 5:4 card (contact, reservation picker); the API falls back to `hero_image`.
  hero_mobile_image: imageUrlSchema.nullish(),
  card_image: imageUrlSchema.nullish(),
  story_image_alt: z.string().nullish(),
  gallery: z.array(galleryImageSchema),
  facilities: z.array(
    z.object({ slug: z.string(), label: z.string(), icon: z.string().nullable().optional() }),
  ),
  opening_hours: z.array(openingHourSchema).length(7),
  schema_opening_hours: z.array(z.string()),
  popular_dishes: z.array(menuItemCardSchema),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  url: z.string().startsWith('/'),
  seo: seoSchema,
})
export type Branch = z.infer<typeof branchSchema>
