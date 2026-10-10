import { z } from 'zod'
import {
  categoryRefSchema,
  imageUrlSchema,
  priceSchema,
  seoSchema,
} from '@/lib/schemas/common'

export const DIETARY_TAGS = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'spicy',
  'halal',
] as const

export const ALLERGENS = [
  'gluten',
  'dairy',
  'nuts',
  'shellfish',
  'egg',
  'soy',
] as const

export const menuItemCardSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  short_description: z.string().nullable(),
  price: priceSchema,
  currency: z.string().length(3),
  calories: z.number().int().nonnegative().nullable(),
  image: imageUrlSchema.nullable(),
  image_alt: z.string().nullish(),
  // Tag keys come from the admin (Menu → Dish tags); DIETARY_TAGS lists the seeded ones.
  dietary_tags: z.array(z.string()),
  is_available: z.boolean(),
  category: categoryRefSchema,
  url: z.string().startsWith('/'),
})
export type MenuItemCard = z.infer<typeof menuItemCardSchema>

export const menuItemSchema = menuItemCardSchema.extend({
  description: z.string(),
  // The dish name in the OTHER locale, or null when the two are identical
  // (a dish nobody has translated yet, or a proper noun that does not change).
  // Riyadh diners know half this menu by its Arabic or Turkish name, so the
  // dish page shows both; spec §7.3 asks for it. Detail response only — the
  // card shape stays lean.
  name_alt: z.string().nullable(),
  ingredients_note: z.string().nullable(),
  preparation_note: z.string().nullable(),
  allergens: z.array(z.string()),
  // Square photo for the dish page; the API falls back to `image`.
  detail_image: imageUrlSchema.nullish(),
  seo: seoSchema,
  related: z.array(menuItemCardSchema),
})
export type MenuItem = z.infer<typeof menuItemSchema>

export const menuCategorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  intro_content: z.string().min(1, 'category intro copy is the ranking asset'),
  image: imageUrlSchema.nullable(),
  image_alt: z.string().nullish(),
  // Phone header photo and grid card photo; the API falls back to `image`.
  mobile_image: imageUrlSchema.nullish(),
  card_image: imageUrlSchema.nullish(),
  item_count: z.number().int().nonnegative(),
  url: z.string().startsWith('/'),
  seo: seoSchema,
})
export type MenuCategory = z.infer<typeof menuCategorySchema>

// GET /menu/categories returns the list shape above (item_count only).
// GET /menu/categories/{slug} returns the same fields PLUS the dishes.
export const menuCategoryDetailSchema = menuCategorySchema.extend({
  items: z.array(menuItemCardSchema),
})
export type MenuCategoryDetail = z.infer<typeof menuCategoryDetailSchema>
