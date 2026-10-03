import { cacheLife } from 'next/cache'
import { z } from 'zod'
import { apiGet } from '@/lib/api/client'
import type { Locale } from '@/lib/i18n/config'

export type ApiMenuItem = {
  label: string
  href: string | null
  new_tab: boolean
  external: boolean
  coming_soon: boolean
  children: ApiMenuItem[]
}

const menuItemSchema: z.ZodType<ApiMenuItem> = z.lazy(() =>
  z.object({
    label: z.string(),
    href: z.string().nullable(),
    new_tab: z.boolean(),
    external: z.boolean(),
    coming_soon: z.boolean(),
    children: z.array(menuItemSchema),
  }),
)

const menusSchema = z.record(z.string(), z.object({ name: z.string(), items: z.array(menuItemSchema) }))

/** Every admin menu by handle (Pages → Menus): header, drawer, footer_explore, footer_legal… */
export async function getMenus(locale: Locale): Promise<Record<string, ApiMenuItem[]>> {
  'use cache'
  cacheLife('max')

  const menus = await apiGet('/menus', menusSchema, { locale }).catch(() => ({}))
  return Object.fromEntries(Object.entries(menus).map(([handle, menu]) => [handle, menu.items]))
}
