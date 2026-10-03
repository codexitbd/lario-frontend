import { cacheLife } from 'next/cache'
import { z } from 'zod'
import { apiFind, apiGet } from '@/lib/api/client'
import type { Locale } from '@/lib/i18n/config'
import {
  type MenuCategory,
  type MenuItemCard,
  menuCategoryDetailSchema,
  menuCategorySchema,
  menuItemCardSchema,
  menuItemSchema,
  pageSectionSchema,
} from '@/lib/schemas'

const withSections = { sections: z.array(pageSectionSchema).default([]) }

export const menuCategoryPageSchema = menuCategoryDetailSchema.extend(withSections)
export type MenuCategoryPage = z.infer<typeof menuCategoryPageSchema>

export const menuItemPageSchema = menuItemSchema.extend(withSections)
export type MenuItemPage = z.infer<typeof menuItemPageSchema>

export const dishTagSchema = z.object({
  type: z.enum(['dietary', 'allergen']),
  slug: z.string(),
  label: z.string().nullable(),
  icon: z.string().nullable(),
})
export type DishTag = z.infer<typeof dishTagSchema>

export async function getMenuCategories(locale: Locale): Promise<MenuCategory[]> {
  'use cache'
  cacheLife('max')

  return apiGet('/menu/categories', z.array(menuCategorySchema), { locale })
}

export async function getMenuItems(locale: Locale): Promise<MenuItemCard[]> {
  'use cache'
  cacheLife('max')

  return apiGet('/menu/items', z.array(menuItemCardSchema), { locale })
}

export async function getMenuCategory(
  locale: Locale,
  slug: string,
): Promise<MenuCategoryPage | null> {
  'use cache'
  cacheLife('max')

  return apiFind(`/menu/categories/${encodeURIComponent(slug)}`, menuCategoryPageSchema, { locale })
}

export async function getMenuItem(
  locale: Locale,
  slug: string,
): Promise<MenuItemPage | null> {
  'use cache'
  cacheLife('max')

  return apiFind(`/menu/items/${encodeURIComponent(slug)}`, menuItemPageSchema, { locale })
}

export async function getDishTags(locale: Locale): Promise<DishTag[]> {
  'use cache'
  cacheLife('max')

  return apiGet('/menu/tags', z.array(dishTagSchema), { locale })
}
