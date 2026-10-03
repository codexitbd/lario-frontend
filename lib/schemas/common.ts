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
  keywords: z.array(z.string()).optional(),
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
// The `(?!\/)` matters: "//evil.example/x.jpg" is a PROTOCOL-RELATIVE URL, not
// a root-relative path. It starts with a slash, so a bare /^\/…/ accepted it,
// and a browser resolves it against the page's scheme and loads it from
// evil.example — a third-party origin smuggled in through a field whose whole
// job is to be safe to render verbatim.
export const imageUrlSchema = z.union([
  z.url(),
  z
    .string()
    .regex(
      /^\/(?!\/)[^\s]*$/,
      'image must be an absolute URL or a root-relative path',
    ),
])

export const categoryRefSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
})

export const settingsSchema = z.object({
  site_name: z.string(),
  default_locale: localeSchema,
  locales: z.array(localeSchema),
  // Every contact value is optional in the admin; an empty field renders nothing.
  contact: z.object({
    phone: z.string().nullable(),
    whatsapp: z.string().nullable(),
    email: z.email().nullable(),
    address: z.string().nullable().optional(),
  }),
  // platform -> url. The admin manages any number of platforms (Settings → General).
  social: z.record(z.string(), z.string()),
  socials: z
    .array(z.object({ platform: z.string(), url: z.string() }))
    .default([]),
  copyright: z.string().nullable().optional(),
  branding: z
    .object({
      logo: z.url().nullable(),
      logo_light: z.url().nullable(),
      favicon: z.url().nullable(),
      apple_touch_icon: z.url().nullable(),
    })
    .partial()
    .default({}),
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
    description: z.string().nullable().optional(),
    allow_indexing: z.boolean().default(true),
    google_verification: z.string().nullable().optional(),
    bing_verification: z.string().nullable().optional(),
    robots_txt: z.string().nullable().optional(),
  }),
  // Every tracker is off while its id is empty (Settings → Tracking & scripts).
  tracking: z
    .object({
      ga4_id: z.string().nullable(),
      gtm_id: z.string().nullable(),
      meta_pixel_id: z.string().nullable(),
      tiktok_pixel_id: z.string().nullable(),
      snap_pixel_id: z.string().nullable(),
      custom_head: z.string().nullable(),
      custom_body_start: z.string().nullable(),
      custom_body_end: z.string().nullable(),
      extra_script_domains: z.array(z.string()),
    })
    .partial()
    .default({}),
  reservations: z
    .object({
      enabled: z.boolean(),
      max_party_size: z.number().int(),
      days_ahead: z.number().int(),
      min_notice_minutes: z.number().int(),
      disabled_message: z.string().nullable(),
    })
    .partial()
    .default({}),
})
export type Settings = z.infer<typeof settingsSchema>
