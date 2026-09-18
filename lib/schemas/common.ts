import { z } from 'zod'

export const DECIMAL_STRING = /^\d+\.\d{2}$/

export const localeSchema = z.enum(['en', 'ar'])

export const seoSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  canonical: z.url(),
  robots: z.string(),
  og: z.object({
    title: z.string(),
    description: z.string(),
    image: z.url().nullable(),
    type: z.string(),
  }),
  twitter: z.object({ card: z.string() }),
  alternates: z.object({ en: z.url(), ar: z.url() }),
  schema_enabled: z.boolean(),
})
export type Seo = z.infer<typeof seoSchema>

export const priceSchema = z
  .string()
  .regex(DECIMAL_STRING, 'price must be a decimal string such as "189.00"')

// The contract (03-api-contract.md §Images) requires every image field to be a
// resolved URL the frontend can use verbatim — never a raw storage path. The
// live API returns absolute URLs; the static fixture layer serves from public/
// at root-relative paths. Both are usable as-is; a bare storage path such as
// "storage/app/foo.jpg" is the failure this guards against.
export const imageUrlSchema = z.union([
  z.url(),
  z.string().regex(/^\/[^\s]*$/, 'image must be an absolute URL or a root-relative path'),
])

export const categoryRefSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
})

export const settingsSchema = z.object({
  site_name: z.string(),
  default_locale: localeSchema,
  locales: z.array(localeSchema),
  contact: z.object({
    phone: z.string(),
    whatsapp: z.string(),
    email: z.email(),
  }),
  social: z.object({
    instagram: z.string(),
    tiktok: z.string(),
    snapchat: z.string(),
  }),
  analytics: z.object({
    ga4_id: z.string().nullable(),
    gtm_id: z.string().nullable(),
  }),
  seo_defaults: z.object({
    // Wire shape: already resolved for the request locale. The fixture holds
    // one suffix per locale (source shape) — see content/seo-defaults.ts.
    title_suffix: z.string(),
    // Nullable: no default social-card asset exists (content-gap item 10).
    // A URL that 404s is worse than none — crawlers cache the failure.
    og_image: z.url().nullable(),
  }),
})
export type Settings = z.infer<typeof settingsSchema>
