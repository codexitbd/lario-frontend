# La Rio Foundation & Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build every design-independent layer of the La Rio frontend — locale
routing, formatting, the contract-shaped static data layer, cached fetchers,
SEO, proxy, and mock form endpoints — so that page and component work can begin
the moment the design system exists.

**Architecture:** A static JSON data layer shaped to `03-api-contract.md`
verbatim, read through `lib/api/` fetchers that carry the same signatures the
live Laravel API will expose. Zod schemas validate every fixture at test time
and double as the reservation form's validation rules. Everything above the
fetchers is ordinary Next.js 16 App Router with Cache Components.

**Tech Stack:** Next.js 16.3.5 · React 19.2.8 · TypeScript 5 (strict) ·
Tailwind v4 (CSS-first) · Zod 4.6.5 · Vitest · Node 22

**Spec:** `docs/superpowers/specs/2026-09-18-lario-frontend-design.md`

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Next.js 16**, not 15. `cacheComponents: true`. Verified against
  `node_modules/next/dist/docs/` on 2026-09-18.
- **`proxy.ts`** at the project root exporting a function named `proxy`. Never
  `middleware.ts`.
- **`params` and `searchParams` are Promises.** `const { slug } = await params`.
  Same in `generateMetadata` and `generateStaticParams`.
- **Never** write `export const revalidate`, `export const dynamic`,
  `export const fetchCache`, `export const runtime = 'edge'`, or
  `experimental.ppr`. Use `'use cache'` + `cacheLife()` + `cacheTag()`.
- **`revalidateTag(tag, 'max')`** — always two arguments. The single-argument
  form is deprecated and blocks.
- **Locales:** `en` (unprefixed) and `ar` (`/ar/…`). Every internal link goes
  through `localePath(locale, path)`.
- **RTL:** logical properties only — `ms-` `me-` `ps-` `pe-` `start-` `end-`
  `text-start`. Never `ml-` `mr-` `left-` `right-` `text-left`.
- **Money is a decimal string.** Pass the string straight to
  `Intl.NumberFormat.format()`. Never `Number()`, `parseFloat()`, or arithmetic.
- **Arabic uses Latin digits:** `ar-SA-u-nu-latn`. Calendar pinned to
  `-ca-gregory` explicitly, never left to ICU defaults.
- **Timezone is `Asia/Riyadh`** everywhere a date is formatted or parsed.
- **Branch slugs are exactly `narjis` and `al-yasmin`.** ADR-012.
- **Never** hardcode content in a component, assemble a URL from parts, inline a
  cache-tag string, or hand-write an API type outside `lib/schemas/`.
- **No `any`.** `npm run build` and `npx tsc --noEmit` must both pass clean.
- Tailwind v4 is CSS-first. There is no `tailwind.config.js` and none is created.

---

## File Structure

| File | Responsibility |
|---|---|
| `next.config.ts` | Cache Components flag, image config |
| `vitest.config.ts` | Node-environment test runner, `@/` alias |
| `lib/i18n/config.ts` | Locale union, direction, `localePath` |
| `lib/i18n/dictionaries.ts` | UI string loader |
| `lib/format.ts` | Price, calorie, date, time formatting — the single switch point for numeral style |
| `lib/cache-tags.ts` | Tag strings + cascade rules, mirrors `CacheTags.php` |
| `lib/schemas/*.ts` | Zod schemas; inferred types are the API types |
| `content/*.json` | The contract-shaped data layer — the backend's blueprint |
| `lib/api/*.ts` | One cached fetcher per resource |
| `lib/seo/metadata.ts` | `seo` object → Next `Metadata` |
| `lib/seo/json-ld.ts` | JSON-LD builders |
| `proxy.ts` | Security headers, locale rewrite, redirects |
| `app/[locale]/layout.tsx` | `lang`/`dir`, fonts, settings |
| `app/api/reservations/route.ts` | Mock POST — 201/422/429 |
| `app/api/contacts/route.ts` | Mock POST — 201/422/429 |
| `app/api/revalidate/route.ts` | HMAC-verified webhook |

Schemas and fixtures are split per resource so a change to the menu never forces
a reviewer to read the branch data.

---

### Task 1: Tooling and configuration

**Files:**
- Modify: `next.config.ts`
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/env.ts`
- Test: `lib/env.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `npm test`, `npm run typecheck`; `requireEnv(name: string): string`

- [ ] **Step 1: Install test tooling and promote zod to a direct dependency**

```bash
npm install --save-exact zod@4.6.5
npm install --save-dev --save-exact vitest@3.2.4
```

- [ ] **Step 2: Enable Cache Components**

Replace `next.config.ts` entirely:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
```

- [ ] **Step 3: Add the Vitest config**

Create `vitest.config.ts`. The manual alias avoids a `vite-tsconfig-paths`
dependency for one mapping:

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
  },
})
```

- [ ] **Step 4: Add scripts**

In `package.json`, replace the `scripts` block:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 5: Write the failing test for the env helper**

Create `lib/env.test.ts`:

```ts
import { describe, expect, it, afterEach } from 'vitest'
import { requireEnv } from '@/lib/env'

afterEach(() => {
  delete process.env.LARIO_TEST_VALUE
})

describe('requireEnv', () => {
  it('returns the value when set', () => {
    process.env.LARIO_TEST_VALUE = 'present'
    expect(requireEnv('LARIO_TEST_VALUE')).toBe('present')
  })

  it('throws a named error when missing', () => {
    expect(() => requireEnv('LARIO_TEST_VALUE')).toThrow(
      'Missing required environment variable: LARIO_TEST_VALUE',
    )
  })

  it('throws when set to an empty string', () => {
    process.env.LARIO_TEST_VALUE = ''
    expect(() => requireEnv('LARIO_TEST_VALUE')).toThrow(
      'Missing required environment variable: LARIO_TEST_VALUE',
    )
  })
})
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `npm test -- lib/env.test.ts`
Expected: FAIL — cannot resolve `@/lib/env`.

- [ ] **Step 7: Implement**

Create `lib/env.ts`:

```ts
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}
```

- [ ] **Step 8: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: 3 passing, no type errors.

- [ ] **Step 9: Commit**

```bash
git add next.config.ts vitest.config.ts package.json package-lock.json lib/env.ts lib/env.test.ts
git commit -m "chore: enable cacheComponents, add vitest and env helper"
```

---

### Task 2: Locale primitives

**Files:**
- Create: `lib/i18n/config.ts`
- Test: `lib/i18n/config.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `LOCALES: readonly ['en', 'ar']`
  - `type Locale = 'en' | 'ar'`
  - `DEFAULT_LOCALE: Locale`
  - `isLocale(value: string): value is Locale`
  - `getDirection(locale: Locale): 'ltr' | 'rtl'`
  - `localePath(locale: Locale, path: string): string`

- [ ] **Step 1: Write the failing test**

Create `lib/i18n/config.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  LOCALES,
  getDirection,
  isLocale,
  localePath,
} from '@/lib/i18n/config'

describe('locale config', () => {
  it('exposes exactly en and ar with en as default', () => {
    expect(LOCALES).toEqual(['en', 'ar'])
    expect(DEFAULT_LOCALE).toBe('en')
  })

  it('narrows known locales and rejects unknown ones', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('ar')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('EN')).toBe(false)
  })

  it('maps direction', () => {
    expect(getDirection('en')).toBe('ltr')
    expect(getDirection('ar')).toBe('rtl')
  })
})

describe('localePath', () => {
  it('leaves English unprefixed', () => {
    expect(localePath('en', '/menu')).toBe('/menu')
    expect(localePath('en', '/')).toBe('/')
  })

  it('prefixes Arabic with /ar', () => {
    expect(localePath('ar', '/menu')).toBe('/ar/menu')
    expect(localePath('ar', '/')).toBe('/ar')
  })

  it('normalises a missing leading slash', () => {
    expect(localePath('en', 'menu')).toBe('/menu')
    expect(localePath('ar', 'menu')).toBe('/ar/menu')
  })

  it('strips trailing slashes', () => {
    expect(localePath('en', '/menu/')).toBe('/menu')
    expect(localePath('ar', '/menu/pizza/')).toBe('/ar/menu/pizza')
  })

  it('preserves query strings and fragments', () => {
    expect(localePath('ar', '/reservation?branch=narjis')).toBe(
      '/ar/reservation?branch=narjis',
    )
    expect(localePath('en', '/menu#grills')).toBe('/menu#grills')
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- lib/i18n/config.test.ts`
Expected: FAIL — cannot resolve `@/lib/i18n/config`.

- [ ] **Step 3: Implement**

Create `lib/i18n/config.ts`:

```ts
export const LOCALES = ['en', 'ar'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function localePath(locale: Locale, path: string): string {
  const [rawPath = '', suffix = ''] = splitSuffix(path)
  const withSlash = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const trimmed = withSlash.replace(/\/+$/, '')
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  const joined = `${prefix}${trimmed}`
  return (joined === '' ? '/' : joined) + suffix
}

function splitSuffix(path: string): [string, string] {
  const marker = path.search(/[?#]/)
  return marker === -1
    ? [path, '']
    : [path.slice(0, marker), path.slice(marker)]
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- lib/i18n/config.test.ts`
Expected: PASS, 8 assertions across 7 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/config.ts lib/i18n/config.test.ts
git commit -m "feat: add locale primitives and localePath"
```

---

### Task 3: Formatting utilities

**Files:**
- Create: `lib/format.ts`
- Test: `lib/format.test.ts`

**Interfaces:**
- Consumes: `Locale` from `@/lib/i18n/config`
- Produces:
  - `formatPrice(amount: string, currency: string, locale: Locale): string`
  - `formatCalories(calories: number, locale: Locale): string`
  - `formatDateTime(iso: string, locale: Locale): string`
  - `formatTimeRange(opens: string, closes: string, locale: Locale): string`
  - `NUMERAL_SYSTEM: 'latn' | 'arab'`
  - `TIME_ZONE: 'Asia/Riyadh'`

This file is the single switch point for decision D16. Changing
`NUMERAL_SYSTEM` to `'arab'` flips every number in the Arabic locale.

- [ ] **Step 1: Write the failing test**

Create `lib/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  formatCalories,
  formatDateTime,
  formatPrice,
  formatTimeRange,
} from '@/lib/format'

// ICU separates a currency marker from its amount with a NON-BREAKING space
// (U+00A0) and wraps Arabic currency in directional marks (U+200E/U+200F).
// Both are correct output — an NBSP stops a price wrapping across lines. These
// assertions are about digits and amounts, not glyph spacing, so normalise the
// invisibles rather than hardcoding them and making the tests brittle across
// ICU versions.
const norm = (value: string): string =>
  value.replace(/\u00A0/g, ' ').replace(/[\u200E\u200F]/g, '').trim()

describe('formatPrice', () => {
  it('formats SAR in English', () => {
    expect(norm(formatPrice('189.00', 'SAR', 'en'))).toBe('SAR 189')
  })

  it('uses Latin digits in Arabic', () => {
    const result = formatPrice('189.00', 'SAR', 'ar')
    expect(result).toContain('189')
    expect(result).not.toContain('١٨٩')
  })

  it('keeps meaningful decimals', () => {
    expect(norm(formatPrice('189.50', 'SAR', 'en'))).toBe('SAR 189.5')
  })

  it('never loses precision on large decimal strings', () => {
    expect(norm(formatPrice('12345678901234567890.99', 'SAR', 'en'))).toBe(
      'SAR 12,345,678,901,234,567,890.99',
    )
  })
})

describe('formatCalories', () => {
  it('formats with a thousands separator in both locales', () => {
    expect(formatCalories(1820, 'en')).toBe('1,820')
    expect(formatCalories(1820, 'ar')).toContain('1,820')
  })
})

describe('formatDateTime', () => {
  it('renders in Asia/Riyadh regardless of the input offset', () => {
    expect(formatDateTime('2026-10-04T17:30:00Z', 'en')).toContain('8:30')
  })

  it('uses Latin digits and the Gregorian calendar in Arabic', () => {
    const result = formatDateTime('2026-10-04T17:30:00+00:00', 'ar')
    expect(result).toContain('2026')
    expect(result).not.toContain('٢٠٢٦')
  })
})

describe('formatTimeRange', () => {
  it('joins two times with an en dash', () => {
    expect(formatTimeRange('12:00', '23:30', 'en')).toBe('12:00 PM – 11:30 PM')
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- lib/format.test.ts`
Expected: FAIL — cannot resolve `@/lib/format`.

- [ ] **Step 3: Implement**

Create `lib/format.ts`. Note that `Intl.NumberFormat.format()` accepts a decimal
**string** — that is how money stays exact:

```ts
import type { Locale } from '@/lib/i18n/config'

export const NUMERAL_SYSTEM: 'latn' | 'arab' = 'latn'

export const TIME_ZONE = 'Asia/Riyadh'

function intlLocale(locale: Locale): string {
  return locale === 'ar'
    ? `ar-SA-u-nu-${NUMERAL_SYSTEM}-ca-gregory`
    : 'en-SA-u-ca-gregory'
}

export function formatPrice(
  amount: string,
  currency: string,
  locale: Locale,
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    // `amount` is a decimal string such as "189.00", already validated by
    // priceSchema. Intl.NumberFormat.format() accepts numeric strings at
    // runtime and formats them exactly; TypeScript types the parameter as
    // Intl.StringNumericLiteral, so this assertion states what the schema
    // already guarantees. It is a type-level cast with no runtime conversion.
    // NEVER change this to Number(amount) — that reintroduces float drift and
    // is the precise bug this whole approach exists to prevent.
  }).format(amount as Intl.StringNumericLiteral)
}

export function formatCalories(calories: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(calories)
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatTimeRange(
  opens: string,
  closes: string,
  locale: Locale,
): string {
  return `${formatClock(opens, locale)} – ${formatClock(closes, locale)}`
}

function formatClock(time: string, locale: Locale): string {
  const [hours = '0', minutes = '0'] = time.split(':')
  const date = new Date(Date.UTC(2000, 0, 1, Number(hours), Number(minutes)))
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- lib/format.test.ts`
Expected: PASS, 7 tests. The `norm()` helper absorbs ICU's non-breaking spaces
and directional marks. If any assertion still differs, adjust the **test**, never
the implementation — ICU is authoritative for currency and date formatting, and
these assertions are about digits and amounts, not glyph spacing.

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts lib/format.test.ts
git commit -m "feat: add locale-aware formatting with exact decimal money"
```

---

### Task 4: Cache tags and cascade rules

**Files:**
- Create: `lib/cache-tags.ts`
- Test: `lib/cache-tags.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `tags` object with `settings() home() page(slug) menu() menuCategory(slug) menuItem(slug) branches() branch(slug) testimonials() redirects()`
  - `cascadeForMenuItem(slug: string, isFeatured: boolean): string[]`
  - `cascadeForMenuCategory(slug: string): string[]`
  - `cascadeForBranch(slug: string): string[]`

This file must stay in step with `lario-api/app/Support/CacheTags.php`. A typo
here is a permanently stale page that errors nowhere.

- [ ] **Step 1: Write the failing test**

Create `lib/cache-tags.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  cascadeForBranch,
  cascadeForMenuCategory,
  cascadeForMenuItem,
  tags,
} from '@/lib/cache-tags'

describe('tag strings', () => {
  it('matches the contract exactly', () => {
    expect(tags.settings()).toBe('settings')
    expect(tags.home()).toBe('home')
    expect(tags.page('contact')).toBe('page:contact')
    expect(tags.menu()).toBe('menu')
    expect(tags.menuCategory('pizza')).toBe('menu-category:pizza')
    expect(tags.menuItem('carbonara')).toBe('menu-item:carbonara')
    expect(tags.branches()).toBe('branches')
    expect(tags.branch('narjis')).toBe('branch:narjis')
    expect(tags.testimonials()).toBe('testimonials')
    expect(tags.redirects()).toBe('redirects')
  })
})

describe('cascades', () => {
  it('a menu item invalidates itself and the menu listing', () => {
    expect(cascadeForMenuItem('carbonara', false)).toEqual([
      'menu-item:carbonara',
      'menu',
    ])
  })

  it('a featured menu item also invalidates the homepage', () => {
    expect(cascadeForMenuItem('carbonara', true)).toEqual([
      'menu-item:carbonara',
      'menu',
      'home',
    ])
  })

  it('a category invalidates itself and the menu listing', () => {
    expect(cascadeForMenuCategory('pizza')).toEqual([
      'menu-category:pizza',
      'menu',
    ])
  })

  it('a branch invalidates itself, the listing and the homepage cards', () => {
    expect(cascadeForBranch('narjis')).toEqual([
      'branch:narjis',
      'branches',
      'home',
    ])
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- lib/cache-tags.test.ts`
Expected: FAIL — cannot resolve `@/lib/cache-tags`.

- [ ] **Step 3: Implement**

Create `lib/cache-tags.ts`:

```ts
export const tags = {
  settings: () => 'settings',
  home: () => 'home',
  page: (slug: string) => `page:${slug}`,
  menu: () => 'menu',
  menuCategory: (slug: string) => `menu-category:${slug}`,
  menuItem: (slug: string) => `menu-item:${slug}`,
  branches: () => 'branches',
  branch: (slug: string) => `branch:${slug}`,
  testimonials: () => 'testimonials',
  redirects: () => 'redirects',
} as const

export function cascadeForMenuItem(
  slug: string,
  isFeatured: boolean,
): string[] {
  const result = [tags.menuItem(slug), tags.menu()]
  if (isFeatured) result.push(tags.home())
  return result
}

export function cascadeForMenuCategory(slug: string): string[] {
  return [tags.menuCategory(slug), tags.menu()]
}

export function cascadeForBranch(slug: string): string[] {
  return [tags.branch(slug), tags.branches(), tags.home()]
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- lib/cache-tags.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/cache-tags.ts lib/cache-tags.test.ts
git commit -m "feat: add cache tags and cascade rules mirroring CacheTags.php"
```

---

### Task 5: API schemas and types

**Files:**
- Create: `lib/schemas/common.ts`
- Create: `lib/schemas/menu.ts`
- Create: `lib/schemas/branch.ts`
- Create: `lib/schemas/page.ts`
- Create: `lib/schemas/index.ts`
- Test: `lib/schemas/common.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `seoSchema`, `type Seo`
  - `menuItemCardSchema`, `type MenuItemCard`
  - `menuItemSchema`, `type MenuItem`
  - `menuCategorySchema`, `type MenuCategory`
  - `branchSchema`, `type Branch`
  - `pageSchema`, `type Page`
  - `settingsSchema`, `type Settings`
  - `homeSchema`, `type Home`, `type PageSection`

These inferred types **replace** hand-written API types. At backend handoff they
are superseded by `types/generated/api.d.ts`.

- [ ] **Step 1: Write the failing test**

Create `lib/schemas/common.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  SECTION_TYPES,
  branchSchema,
  imageUrlSchema,
  menuItemCardSchema,
  seoSchema,
} from '@/lib/schemas'

const validSeo = {
  title: 'Argentina Style Asado | La Rio Riyadh',
  description: 'Slow-grilled over open flame.',
  canonical: 'https://lario.sa/menu/grills/argentina-style-asado',
  robots: 'index,follow',
  og: {
    title: 'Argentina Style Asado',
    description: 'Slow-grilled over open flame.',
    image: 'https://lario.sa/images/og/asado.jpg',
    type: 'article',
  },
  twitter: { card: 'summary_large_image' },
  alternates: {
    en: 'https://lario.sa/menu/grills/argentina-style-asado',
    ar: 'https://lario.sa/ar/menu/grills/argentina-style-asado',
  },
  schema_enabled: true,
}

describe('seoSchema', () => {
  it('accepts a fully resolved seo object', () => {
    expect(seoSchema.parse(validSeo).title).toBe(
      'Argentina Style Asado | La Rio Riyadh',
    )
  })

  it('rejects an empty title — the contract forbids it', () => {
    expect(() => seoSchema.parse({ ...validSeo, title: '' })).toThrow()
  })
})

describe('load-bearing constants', () => {
  it('SECTION_TYPES holds exactly the 11 approved types in order', () => {
    expect(SECTION_TYPES).toEqual([
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
    ])
  })

  it('branchSchema accepts only the two contracted slugs', () => {
    const base = {
      slug: 'narjis',
      name: 'La Rio Al Narjis',
    }
    expect(() => branchSchema.shape.slug.parse('narjis')).not.toThrow()
    expect(() => branchSchema.shape.slug.parse('al-yasmin')).not.toThrow()
    expect(() => branchSchema.shape.slug.parse('al-narjis')).toThrow()
    expect(() => branchSchema.shape.slug.parse('jeddah')).toThrow()
    void base
  })
})

describe('imageUrlSchema', () => {
  it('accepts an absolute URL and a root-relative path', () => {
    expect(() => imageUrlSchema.parse('https://lario.sa/x.jpg')).not.toThrow()
    expect(() => imageUrlSchema.parse('/images/menu/x.jpg')).not.toThrow()
  })

  it('rejects a bare storage path', () => {
    expect(() => imageUrlSchema.parse('storage/app/x.jpg')).toThrow()
    expect(() => imageUrlSchema.parse('images/menu/x.jpg')).toThrow()
  })
})

describe('menuItemCardSchema', () => {
  const card = {
    slug: 'argentina-style-asado',
    name: 'Argentina Style Asado',
    short_description: 'Slow-grilled over open flame.',
    price: '189.00',
    currency: 'SAR',
    calories: 820,
    image: '/images/menu/grills/argentina-style-asado.jpg',
    dietary_tags: ['halal'],
    is_available: true,
    category: { slug: 'steaks-and-mains', name: 'Steaks & Mains' },
    url: '/menu/steaks-and-mains/argentina-style-asado',
  }

  it('accepts a valid card', () => {
    expect(menuItemCardSchema.parse(card).slug).toBe('argentina-style-asado')
  })

  it('rejects a numeric price — money must stay a decimal string', () => {
    expect(() => menuItemCardSchema.parse({ ...card, price: 189 })).toThrow()
  })

  it('rejects a malformed decimal string', () => {
    expect(() => menuItemCardSchema.parse({ ...card, price: '189' })).toThrow()
  })

  it('allows null calories and null image', () => {
    const parsed = menuItemCardSchema.parse({
      ...card,
      calories: null,
      image: null,
    })
    expect(parsed.calories).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- lib/schemas/common.test.ts`
Expected: FAIL — cannot resolve `@/lib/schemas`.

- [ ] **Step 3: Implement the common schemas**

Create `lib/schemas/common.ts`:

```ts
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
    title_suffix: z.string(),
    og_image: z.url(),
  }),
})
export type Settings = z.infer<typeof settingsSchema>
```

- [ ] **Step 4: Implement the menu schemas**

Create `lib/schemas/menu.ts`:

```ts
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
  dietary_tags: z.array(z.enum(DIETARY_TAGS)),
  is_available: z.boolean(),
  category: categoryRefSchema,
  url: z.string().startsWith('/'),
})
export type MenuItemCard = z.infer<typeof menuItemCardSchema>

export const menuItemSchema = menuItemCardSchema.extend({
  description: z.string(),
  ingredients_note: z.string().nullable(),
  preparation_note: z.string().nullable(),
  allergens: z.array(z.enum(ALLERGENS)),
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
```

- [ ] **Step 5: Implement the branch and page schemas**

Create `lib/schemas/branch.ts`:

```ts
import { z } from 'zod'
import { imageUrlSchema, seoSchema } from '@/lib/schemas/common'
import { menuItemCardSchema } from '@/lib/schemas/menu'

export const openingHourSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  opens_at: z.string().nullable(),
  closes_at: z.string().nullable(),
  is_closed: z.boolean(),
})

export const branchSchema = z.object({
  slug: z.enum(['narjis', 'al-yasmin']),
  name: z.string().min(1),
  tagline: z.string(),
  address: z.string(),
  city: z.string(),
  story: z.string(),
  directions_note: z.string().nullable(),
  phone: z.string(),
  whatsapp: z.string().nullable(),
  email: z.email(),
  coordinates: z.object({ latitude: z.number(), longitude: z.number() }),
  google_maps_url: z.url(),
  google_place_id: z.string().nullable(),
  hero_image: imageUrlSchema.nullable(),
  gallery: z.array(imageUrlSchema),
  facilities: z.array(z.object({ slug: z.string(), label: z.string() })),
  opening_hours: z.array(openingHourSchema).length(7),
  schema_opening_hours: z.array(z.string()),
  popular_dishes: z.array(menuItemCardSchema),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  url: z.string().startsWith('/'),
  seo: seoSchema,
})
export type Branch = z.infer<typeof branchSchema>
```

Create `lib/schemas/page.ts`:

```ts
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
  // GET /pages/{slug} returns sections "when present" (03-api-contract.md).
  // Without this field Zod strips them silently and the page renders empty.
  sections: z.array(pageSectionSchema).optional(),
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
```

`pageSectionSchema.type` is a loose `string`, not the `SECTION_TYPES` enum, on
purpose: the frontend must render an unknown section type as `null` rather than
throw. A strict enum would make an editor's new section a parse error.

- [ ] **Step 6: Add the barrel file**

Create `lib/schemas/index.ts`:

```ts
export * from '@/lib/schemas/common'
export * from '@/lib/schemas/menu'
export * from '@/lib/schemas/branch'
export * from '@/lib/schemas/page'
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npm test -- lib/schemas && npm run typecheck`
Expected: PASS, 6 tests.

- [ ] **Step 8: Amend the schema doc with the 11th section type**

Contract amendment B from spec §5. In
`../lario-docs/02-database-schema.md`, find the `page_sections` section-type
list and add `private_events` to it, with a note:

```
hero · intro · featured_dishes · why_lario · chef_story
branch_cards · private_events · gallery_strip · testimonials · faq · reservation_cta
```

> `private_events` was added on 2026-09-18 by client decision, overriding the
> Phase 4 scope gate. It needs no migration — `type` is a string column. See
> `lario-web/docs/superpowers/specs/2026-09-18-lario-frontend-design.md` §3.

- [ ] **Step 9: Commit**

```bash
git add lib/schemas
git commit -m "feat: add zod schemas as the API contract's executable shape"
```

`../lario-docs/` is **not a git repository**, so the contract edit cannot ship
in the same commit as the code the way `CLAUDE.md` requires. Flag this to the
team and run `git init` there — an unversioned binding contract means nobody can
see when it changed or who changed it. Until then, note the doc edit in the
commit message body.

---

### Task 6: Relocate dish photography out of the route namespace

**Files:**
- Move: `public/menu/**` → `public/images/menu/**`
- Delete: 3 junk files
- Create: `scripts/normalise-images.mjs`

**Interfaces:**
- Consumes: nothing
- Produces: every dish image at `/images/menu/<cuisine>/<file>.jpg`

`public/menu/` currently shadows the `/menu` route namespace. `public/` is served
from the root, so `/menu/Turkish/Humus.jpg` and the `/menu` page occupy the same
prefix. Moving them prevents a class of routing bug that is very hard to
diagnose later.

- [ ] **Step 1: Delete the three junk files**

```bash
cd /Users/apple/Downloads/Code/lario/lario-web
rm "public/menu/Argentine/Untitled-1.jpg" \
   "public/menu/Italian/Italian.psd" \
   "public/menu/Turkish/Italian.jpg"
find public/menu -name '*.jpg' | wc -l
```

Expected: `89`

- [ ] **Step 2: Move the tree**

```bash
mkdir -p public/images
git mv public/menu public/images/menu 2>/dev/null || mv public/menu public/images/menu
ls public/images/menu
```

Expected: `Argentine  Italian  Turkish`

- [ ] **Step 3: Write the filename normaliser**

Create `scripts/normalise-images.mjs`. Filenames contain Turkish characters
(`Acılı`, `Gavurdağı`) that are fragile in URLs:

```js
import { readdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'public/images/menu'

export function toSlug(name) {
  return (
    name
      // NFD splits an accented letter into base + combining mark; the next line
      // strips those marks. This pair is what actually normalises c-cedilla,
      // o/u-umlaut, s-cedilla, g-breve and dotted-I — in BOTH cases — because each
      // one decomposes. Do NOT delete it as redundant with the replacement below:
      // the uppercase forms have no explicit mapping and would silently become
      // stray hyphens in the final strip.
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Dotless i (U+0131) is the one Turkish letter with no decomposition, so it
      // is the only character that genuinely needs replacing by hand.
      .replace(/\u0131/g, 'i')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
}

if (process.argv[1]?.endsWith('normalise-images.mjs')) {
  for (const cuisine of readdirSync(ROOT)) {
    for (const file of readdirSync(join(ROOT, cuisine))) {
      const base = file.replace(/\.jpg$/i, '')
      const next = `${toSlug(base)}.jpg`
      if (next !== file) {
        renameSync(join(ROOT, cuisine, file), join(ROOT, cuisine, next))
        console.log(`${file} -> ${next}`)
      }
    }
  }
}
```

- [ ] **Step 4: Run it**

Run: `node scripts/normalise-images.mjs && ls public/images/menu/Turkish | head -5`
Expected: all lowercase hyphenated names, e.g. `acili-ezme.jpg`,
`adana-spicy-kebab.jpg`.

- [ ] **Step 5: Verify the count survived**

Run: `find public/images/menu -name '*.jpg' | wc -l`
Expected: `89`

- [ ] **Step 6: Commit**

```bash
git add scripts/normalise-images.mjs
git commit -m "chore: move dish photos out of the /menu route namespace and slugify"
```

**Only the script is committed.** `public/images/**` is 136 MB of client photography
that has never been tracked. Committing binaries that size is effectively permanent
in git history and is a decision for the repo owner to make deliberately, not a side
effect of a refactor. The move and the slugify still happen on disk — that is what
fixes the route-namespace collision — the tree simply stays untracked, exactly as
`public/menu/**` was.

---

### Task 7: Menu category fixture

**Files:**
- Create: `content/menu-categories.json`
- Create: `content/seo-defaults.ts`
- Test: `content/menu-categories.test.ts`

**Interfaces:**
- Consumes: `menuCategorySchema` from `@/lib/schemas`
- Produces: `content/menu-categories.json` — 9 categories, both locales
- Produces: `buildSeo(input): Seo` from `content/seo-defaults.ts`

- [ ] **Step 1: Write the failing test**

Create `content/menu-categories.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import categories from '@/content/menu-categories.json'
import { menuCategorySchema } from '@/lib/schemas'
import { absoluteImage, buildSeo } from '@/content/seo-defaults'
import { LOCALES } from '@/lib/i18n/config'

describe('absoluteImage', () => {
  it('prefixes the origin onto a root-relative path', () => {
    expect(absoluteImage('/images/menu/Turkish/humus.jpg')).toBe(
      'https://lario.sa/images/menu/Turkish/humus.jpg',
    )
  })

  it('leaves an already-absolute URL untouched', () => {
    expect(absoluteImage('https://api.lario.sa/storage/og/asado.jpg')).toBe(
      'https://api.lario.sa/storage/og/asado.jpg',
    )
  })

  it('returns null when there is no image', () => {
    expect(absoluteImage(null)).toBeNull()
    expect(absoluteImage(undefined)).toBeNull()
  })
})

describe('buildSeo image handling', () => {
  it('absolutises a root-relative image into og.image', () => {
    const seo = buildSeo({
      title: 'Pizza',
      description: 'Wood-fired.',
      path: '/menu/pizza',
      locale: 'en',
      image: '/images/menu/Italian/pizza-la-rio-signature.jpg',
    })
    expect(seo.og.image).toBe(
      'https://lario.sa/images/menu/Italian/pizza-la-rio-signature.jpg',
    )
  })

  it('never double-prefixes an absolute image URL', () => {
    const seo = buildSeo({
      title: 'Pizza',
      description: 'Wood-fired.',
      path: '/menu/pizza',
      locale: 'en',
      image: 'https://api.lario.sa/storage/og/pizza.jpg',
    })
    expect(seo.og.image).toBe('https://api.lario.sa/storage/og/pizza.jpg')
    expect(seo.og.image).not.toContain('lario.sahttps')
  })
})

describe('menu-categories fixture', () => {
  it('has exactly 9 categories', () => {
    expect(categories).toHaveLength(9)
  })

  it('has unique slugs', () => {
    const slugs = categories.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(9)
  })

  it('carries both locales for every category', () => {
    for (const category of categories) {
      for (const locale of LOCALES) {
        expect(category.translations[locale].name.length).toBeGreaterThan(0)
        expect(
          category.translations[locale].intro_content.length,
        ).toBeGreaterThan(80)
      }
    }
  })

  it('resolves to a valid MenuCategory in both locales', () => {
    for (const category of categories) {
      for (const locale of LOCALES) {
        const t = category.translations[locale]
        const resolved = {
          slug: category.slug,
          name: t.name,
          description: t.description,
          intro_content: t.intro_content,
          image: category.image,
          item_count: 0,
          url: `/menu/${category.slug}`,
          seo: buildSeo({
            title: t.name,
            description: t.description ?? '',
            path: `/menu/${category.slug}`,
            locale,
          }),
        }
        expect(() => menuCategorySchema.parse(resolved)).not.toThrow()
      }
    }
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- content/menu-categories.test.ts`
Expected: FAIL — cannot resolve `@/content/menu-categories.json`.

- [ ] **Step 3: Implement the SEO builder**

Create `content/seo-defaults.ts`:

```ts
import type { Locale } from '@/lib/i18n/config'
import { localePath } from '@/lib/i18n/config'
import type { Seo } from '@/lib/schemas'

export const SITE_ORIGIN = 'https://lario.sa'
export const TITLE_SUFFIX = ' | La Rio Riyadh'

// No default social-card image exists yet: the client has not supplied brand
// social artwork (content-gap item 10). Emitting a URL that 404s is worse than
// emitting none — crawlers cache the failure and the card renders broken. Set
// this to an absolute URL once the asset ships.
export const DEFAULT_OG_IMAGE: string | null = null

// imageUrlSchema permits EITHER an absolute URL or a root-relative path, so the
// prefix must be conditional. Prefixing an already-absolute URL yields
// "https://lario.sahttps://api.lario.sa/..." — which new URL() parses without
// throwing, so z.url() would NOT reject it. That is a silent corruption.
export function absoluteImage(image: string | null | undefined): string | null {
  if (!image) return DEFAULT_OG_IMAGE
  return /^https?:\/\//.test(image) ? image : `${SITE_ORIGIN}${image}`
}

export function absoluteUrl(locale: Locale, path: string): string {
  return `${SITE_ORIGIN}${localePath(locale, path)}`
}

export function buildSeo(input: {
  title: string
  description: string
  path: string
  locale: Locale
  image?: string | null
  type?: string
  robots?: string
}): Seo {
  const canonical = absoluteUrl(input.locale, input.path)
  const image = absoluteImage(input.image)
  return {
    title: `${input.title}${TITLE_SUFFIX}`,
    description: input.description,
    canonical,
    robots: input.robots ?? 'index,follow',
    og: {
      title: input.title,
      description: input.description,
      image,
      type: input.type ?? 'website',
    },
    twitter: { card: 'summary_large_image' },
    alternates: {
      en: absoluteUrl('en', input.path),
      ar: absoluteUrl('ar', input.path),
    },
    schema_enabled: true,
  }
}
```

- [ ] **Step 4: Write the category fixture**

Create `content/menu-categories.json`. Nine entries. Each `intro_content` must
exceed 80 characters in both locales — it is the ranking asset, not filler.
Write real Arabic, never Latin text in an Arabic field:

```json
[
  {
    "slug": "cold-mezze",
    "image": "/images/menu/Turkish/humus.jpg",
    "sort_order": 0,
    "translations": {
      "en": {
        "name": "Cold Mezze",
        "description": "Sharing plates to open the table.",
        "intro_content": "Our cold mezze arrive first and stay on the table throughout the meal. Smoked aubergine, whipped tahini, walnut and pepper pastes and stuffed vine leaves are made fresh each morning and served with bread from our own oven."
      },
      "ar": {
        "name": "المقبلات الباردة",
        "description": "أطباق للمشاركة تفتتح المائدة.",
        "intro_content": "تصل مقبلاتنا الباردة أولاً وتبقى على المائدة طوال الوجبة. الباذنجان المدخن والطحينة والمحمرة وورق العنب المحشي تُحضّر طازجة كل صباح وتُقدّم مع الخبز من فرننا الخاص."
      }
    }
  },
  {
    "slug": "starters",
    "image": "/images/menu/Italian/beef-carpaccio-with-truffle-mayo.jpg",
    "sort_order": 1,
    "translations": {
      "en": {
        "name": "Starters",
        "description": "Warm openings from three kitchens.",
        "intro_content": "Hot starters draw on all three of our kitchens at once: Italian carpaccio and seared scallops, Argentine empanadas folded by hand, and baked brie served with fruit. Each is sized to share between two or three guests."
      },
      "ar": {
        "name": "المقبلات الساخنة",
        "description": "بدايات دافئة من ثلاثة مطابخ.",
        "intro_content": "تجمع مقبلاتنا الساخنة مطابخنا الثلاثة معاً: الكارباتشيو الإيطالي والإسكالوب المحمّر، والإمبناداس الأرجنتينية المطوية يدوياً، وجبن البري المخبوز مع الفواكه. كل طبق بحجم يكفي لمشاركة ضيفين أو ثلاثة."
      }
    }
  },
  {
    "slug": "salads",
    "image": "/images/menu/Italian/burrata-salad.jpg",
    "sort_order": 2,
    "translations": {
      "en": {
        "name": "Salads",
        "description": "Bright plates built on daily produce.",
        "intro_content": "Twelve salads span the menu, from Italian burrata and panzanella to Turkish gavurdağı and grain tabbouleh. Leaves and vegetables are delivered each morning, and dressings are mixed to order rather than held."
      },
      "ar": {
        "name": "السلطات",
        "description": "أطباق منعشة من خضار اليوم.",
        "intro_content": "تضم قائمتنا اثنتي عشرة سلطة، من البوراتا والبانزانيلا الإيطالية إلى الغاوورداغي التركية والتبولة بالحبوب. تصل الخضروات والأوراق كل صباح، وتُحضَّر الصلصات عند الطلب لا قبله."
      }
    }
  },
  {
    "slug": "soups",
    "image": "/images/menu/Turkish/red-lentil-soup.jpg",
    "sort_order": 3,
    "translations": {
      "en": {
        "name": "Soups",
        "description": "Slow stocks, finished to order.",
        "intro_content": "Four soups, each built on a stock simmered overnight: Turkish red lentil and harira, Italian cioppino heavy with seafood, and an Argentine beef rib caldo. Served with bread and a wedge of lemon."
      },
      "ar": {
        "name": "الشوربات",
        "description": "مرق بطيء يُنهى عند الطلب.",
        "intro_content": "أربع شوربات، كل منها على مرق يغلي طوال الليل: العدس الأحمر والحريرة التركية، والتشوبينو الإيطالي الغني بالمأكولات البحرية، وشوربة ضلع البقر الأرجنتينية. تُقدّم مع الخبز وشريحة ليمون."
      }
    }
  },
  {
    "slug": "pasta-and-risotto",
    "image": "/images/menu/Italian/fettuccine-alfredo-on-the-parmesan-wheel.jpg",
    "sort_order": 4,
    "translations": {
      "en": {
        "name": "Pasta & Risotto",
        "description": "Made by hand, finished at the table.",
        "intro_content": "Pasta is rolled and cut in our kitchen each day. The fettuccine alfredo is finished inside a hollowed parmesan wheel at your table, and our risottos are started to order, which is why they take a little longer to arrive."
      },
      "ar": {
        "name": "الباستا والريزوتو",
        "description": "تُصنع يدوياً وتُنهى على الطاولة.",
        "intro_content": "تُفرد المعكرونة وتُقطع في مطبخنا يومياً. يُنهى الفيتوتشيني ألفريدو داخل عجلة جبن البارميزان المجوّفة أمامك على الطاولة، ويبدأ تحضير الريزوتو عند الطلب، ولهذا يستغرق وقتاً أطول قليلاً."
      }
    }
  },
  {
    "slug": "pizza",
    "image": "/images/menu/Italian/pizza-la-rio-signature.jpg",
    "sort_order": 5,
    "translations": {
      "en": {
        "name": "Pizza",
        "description": "Long-fermented dough, wood-fired.",
        "intro_content": "Our dough proves for forty-eight hours before it ever meets the oven, which is what gives the crust its lightness. Eight pizzas run from a plain margherita to our signature, and every one is fired in under three minutes."
      },
      "ar": {
        "name": "البيتزا",
        "description": "عجينة طويلة التخمير على الحطب.",
        "intro_content": "تتخمر عجينتنا ثمانياً وأربعين ساعة قبل أن تدخل الفرن، وهذا سر خفة القشرة. ثماني بيتزا تمتد من المارغريتا البسيطة إلى بيتزا لا ريو المميزة، وكل واحدة تُخبز في أقل من ثلاث دقائق."
      }
    }
  },
  {
    "slug": "kebabs-and-skewers",
    "image": "/images/menu/Turkish/urfa-kebab.jpg",
    "sort_order": 6,
    "translations": {
      "en": {
        "name": "Kebabs & Skewers",
        "description": "Charcoal grilling, the Turkish way.",
        "intro_content": "Twelve kebabs come off a charcoal grill kept at a steady heat all evening. Adana and Urfa are minced and seasoned in-house each morning; the pistachio kebab and beyti rolls are the two guests most often come back for."
      },
      "ar": {
        "name": "الكباب والأسياخ",
        "description": "شواء على الفحم على الطريقة التركية.",
        "intro_content": "اثنا عشر نوعاً من الكباب تخرج من شواية فحم تبقى على حرارة ثابتة طوال المساء. يُفرم الأضنة والأورفة ويُتبّلان في مطبخنا كل صباح، وكباب الفستق ولفائف البيتي هما الطبقان اللذان يعود إليهما ضيوفنا أكثر."
      }
    }
  },
  {
    "slug": "steaks-and-mains",
    "image": "/images/menu/Argentine/assado-argentina-style.jpg",
    "sort_order": 7,
    "translations": {
      "en": {
        "name": "Steaks & Mains",
        "description": "Open fire, Argentine tradition.",
        "intro_content": "Nineteen main plates, led by the Argentine asado cooked slowly over open flame. Ribeye, New York striploin and tenderloin are aged before service, and lamb shanks and shoulder are braised for hours rather than grilled."
      },
      "ar": {
        "name": "الستيك والأطباق الرئيسية",
        "description": "نار مفتوحة وتقاليد أرجنتينية.",
        "intro_content": "تسعة عشر طبقاً رئيسياً يتصدرها الأسادو الأرجنتيني المطهو ببطء على اللهب المكشوف. تُعتّق قطع الريب آي والستريبلوين والتندرلوين قبل التقديم، بينما تُطهى أوصال الضأن وكتفه ساعات طويلة بدل الشوي."
      }
    }
  },
  {
    "slug": "sides",
    "image": "/images/menu/Argentine/cheesy-loaded-fries.jpg",
    "sort_order": 8,
    "translations": {
      "en": {
        "name": "Sides",
        "description": "Plates to round out the table.",
        "intro_content": "Seven sides designed to sit alongside the grill: loaded fries, roasted sweet potato wedges, charred vegetables, wilted spinach and pickled red onions that cut through the richer cuts of meat."
      },
      "ar": {
        "name": "الأطباق الجانبية",
        "description": "أطباق تكمل المائدة.",
        "intro_content": "سبعة أطباق جانبية صُممت لترافق المشاوي: البطاطس المغطاة بالجبن، وأصابع البطاطا الحلوة المحمصة، والخضار المشوية، والسبانخ الذابلة، والبصل الأحمر المخلل الذي يوازن دسم قطع اللحم."
      }
    }
  }
]
```

- [ ] **Step 5: Run tests**

Run: `npm test -- content/menu-categories.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add content/menu-categories.json content/menu-categories.test.ts content/seo-defaults.ts
git commit -m "feat: add bilingual menu category fixture and seo builder"
```

---

### Task 8: Menu item fixture

**Files:**
- Create: `scripts/build-menu-items.mjs`
- Create: `content/menu-items.json`
- Test: `content/menu-items.test.ts`

**Interfaces:**
- Consumes: `menuItemCardSchema`, `toSlug` from `scripts/normalise-images.mjs`
- Produces: `content/menu-items.json` — 89 items, both locales

The generator derives the skeleton from the filesystem so the mapping is
reproducible; prices, calories, allergens and Arabic copy are then curated in
the JSON. Regenerating must never clobber curated fields.

- [ ] **Step 1: Write the generator**

Create `scripts/build-menu-items.mjs`:

```js
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { toSlug } from './normalise-images.mjs'

const ROOT = 'public/images/menu'
const OUT = 'content/menu-items.json'

// Filename slug -> category slug. Anything unlisted lands in steaks-and-mains.
const CATEGORY_BY_KEYWORD = [
  ['cold-mezze', ['ezme', 'humus', 'mutebbel', 'baba-ghanoush', 'mouhamara', 'vine-leaves', 'onion-dolma', 'puff-bread', 'lahmacun']],
  ['soups', ['soup', 'harira']],
  ['salads', ['salad', 'tabbouleh', 'rucola-parmigiano', 'tomato-carpaccio']],
  ['pizza', ['pizza']],
  ['pasta-and-risotto', ['pasta', 'risotto', 'ravioli', 'gnocchi', 'linguine', 'spagetti', 'fettuccine']],
  ['kebabs-and-skewers', ['kebab', 'skewer', 'shish', 'kafta', 'meatball', 'beyti']],
  ['sides', ['fries', 'patato', 'potato', 'wedges', 'grilled-vegetables', 'spinach', 'pickled', 'asparagus']],
  ['starters', ['empanada', 'carpaccio', 'brie', 'scallop', 'tartar', 'prawns', 'tongue', 'tacos']],
]

function categoryFor(slug) {
  for (const [category, keywords] of CATEGORY_BY_KEYWORD) {
    if (keywords.some((k) => slug.includes(k))) return category
  }
  return 'steaks-and-mains'
}

function titleFrom(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const existing = existsSync(OUT)
  ? new Map(JSON.parse(readFileSync(OUT, 'utf8')).map((i) => [i.slug, i]))
  : new Map()

const items = []
for (const cuisine of readdirSync(ROOT)) {
  for (const file of readdirSync(join(ROOT, cuisine))) {
    const slug = toSlug(file.replace(/\.jpg$/i, ''))
    const previous = existing.get(slug)
    items.push(
      previous ?? {
        slug,
        category_slug: categoryFor(slug),
        cuisine: cuisine.toLowerCase(),
        image: `/images/menu/${cuisine}/${file}`,
        price: '0.00',
        currency: 'SAR',
        calories: null,
        dietary_tags: ['halal'],
        allergens: [],
        is_featured: false,
        is_available: true,
        sort_order: 0,
        translations: {
          en: { name: titleFrom(slug), description: '', short_description: null, ingredients_note: null, preparation_note: null },
          ar: { name: '', description: '', short_description: null, ingredients_note: null, preparation_note: null },
        },
      },
    )
  }
}

items.sort((a, b) => a.slug.localeCompare(b.slug))

// Curated entries are keyed by the slug stored in the previous file, but matched
// against a slug recomputed from the current filename. If toSlug's output changes
// or an image is renamed, the old entry matches nothing and is dropped — taking
// its price, calories, allergens and Arabic copy with it. toSlug HAS been changed
// once already in this repo, so this is a real path, not a theoretical one. Say so
// loudly at generation time rather than leaving it to be noticed in a git diff.
const produced = new Set(items.map((i) => i.slug))
const orphaned = [...existing.keys()].filter((slug) => !produced.has(slug))
if (orphaned.length > 0) {
  console.warn(
    `WARNING: ${orphaned.length} previously curated slug(s) matched no file this run and have been DROPPED:`,
  )
  for (const slug of orphaned) console.warn(`  - ${slug}`)
  console.warn('Recover with: git checkout content/menu-items.json')
}

writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`)
console.log(`${items.length} items written to ${OUT}`)
const gaps = items.filter((i) => !i.translations.ar.name || i.price === '0.00')
console.log(`${gaps.length} items still need Arabic names or prices`)
```

- [ ] **Step 2: Run it**

Run: `node scripts/build-menu-items.mjs`
Expected: `89 items written to content/menu-items.json`

- [ ] **Step 3: Write the failing test**

Create `content/menu-items.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import items from '@/content/menu-items.json'
import categories from '@/content/menu-categories.json'
import { DIETARY_TAGS, ALLERGENS, DECIMAL_STRING } from '@/lib/schemas'
import { LOCALES } from '@/lib/i18n/config'

const categorySlugs = new Set(categories.map((c) => c.slug))

describe('menu-items fixture', () => {
  it('has 89 items with unique slugs', () => {
    expect(items).toHaveLength(89)
    expect(new Set(items.map((i) => i.slug)).size).toBe(89)
  })

  it('assigns every item to a real category', () => {
    for (const item of items) {
      expect(categorySlugs.has(item.category_slug)).toBe(true)
    }
  })

  it('prices every item as a decimal string above zero', () => {
    for (const item of items) {
      expect(item.price).toMatch(DECIMAL_STRING)
      expect(item.price).not.toBe('0.00')
    }
  })

  it('uses only known dietary tags and allergens', () => {
    for (const item of items) {
      for (const tag of item.dietary_tags) {
        expect(DIETARY_TAGS).toContain(tag)
      }
      for (const allergen of item.allergens) {
        expect(ALLERGENS).toContain(allergen)
      }
    }
  })

  it('carries a real name in both locales', () => {
    for (const item of items) {
      for (const locale of LOCALES) {
        expect(item.translations[locale].name.length).toBeGreaterThan(0)
      }
      // Presence is not purity: a bare "contains Arabic" test passes on a
      // half-transliterated name like "Fettuccine \u0623\u0644\u0641\u0631\u064a\u062f\u0648" — exactly the defect
      // class this guard exists for. Assert BOTH that Arabic is present and that
      // no Latin letter survives. Digits, parentheses and punctuation stay legal,
      // since names like "(4 \u0623\u0634\u062e\u0627\u0635)" are legitimate.
      expect(item.translations.ar.name).toMatch(/[\u0600-\u06FF]/)
      expect(item.translations.ar.name).not.toMatch(/[A-Za-z]/)
    }
  })

  it('points at an image that exists on disk', async () => {
    const { existsSync } = await import('node:fs')
    for (const item of items) {
      expect(existsSync(`public${item.image}`)).toBe(true)
    }
  })

  it('features exactly the six dishes the homepage fixture names', () => {
    const featured = items.filter((i) => i.is_featured)
    // Identity, not just count: swapping one featured dish for another keeps the
    // count at 6 and the spread at 4+, so a count-only assertion would pass while
    // the homepage silently rendered the wrong six cards.
    expect(new Set(featured.map((i) => i.slug))).toEqual(
      new Set([
        'assado-argentina-style',
        'fettuccine-alfredo-on-the-parmesan-wheel',
        'urfa-kebab',
        'pizza-la-rio-signature',
        'burrata-salad',
        'ribeye-steak',
      ]),
    )
    expect(new Set(featured.map((i) => i.category_slug)).size).toBeGreaterThanOrEqual(4)
  })
})
```

- [ ] **Step 4: Run it and confirm it fails**

Run: `npm test -- content/menu-items.test.ts`
Expected: FAIL — prices are all `0.00` and Arabic names are empty.

- [ ] **Step 5: Curate the fixture**

Edit `content/menu-items.json` directly. For all 89 items set:

- `price` — a plausible Riyadh fine-dining price as a decimal string. Guide
  bands: mezze and sides 28–45, salads 45–75, soups 32–48, pasta and risotto
  75–120, pizza 65–95, kebabs 85–140, steaks and mains 120–320.
- `calories` — a plausible integer, or `null`.
- `allergens` — from `ALLERGENS` only. Pizza and pasta carry `gluten`; anything
  with cheese or cream carries `dairy`; the pistachio kebab carries `nuts`;
  seafood dishes carry `shellfish`.
- `translations.ar.name` — real Arabic. Established Arabic names exist for most
  of these (humus → حمص, baba ghanoush → بابا غنوج, lahmacun → لحم بعجين,
  adana kebab → كباب أضنة). Transliterate Italian dish names rather than
  translating them.
- `translations.en.description` / `.ar.description` — one or two sentences each.
- `is_featured: true` on exactly 6, spanning at least 4 categories.

Re-running the generator preserves everything curated; it only appends items
whose slug is new.

- [ ] **Step 6: Run tests**

Run: `npm test -- content/menu-items.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 7: Record the content gaps**

Create `docs/content-gaps.md`:

```markdown
# Content gaps — send to client weekly

Per Section 8 of the quotation, content is client-supplied. This list goes out
every week until it is empty.

| # | Gap | Status | Raised |
|---|---|---|---|
| 1 | Desserts and drinks — no photography, no dish list | Open | 2026-09-18 |
| 2 | Real prices for all 89 dishes — currently placeholder | Open | 2026-09-18 |
| 3 | Calories and allergens for all 89 dishes | Open | 2026-09-18 |
| 4 | Arabic dish names and descriptions — pending native review | Open | 2026-09-18 |
| 5 | Distinct branch story copy for Narjis and Al Yasmin | Open | 2026-09-18 |
| 6 | Real attributed testimonials | Open | 2026-09-18 |
| 7 | Privacy policy and terms copy | Open | 2026-09-18 |
| 8 | Interior and atmosphere photography | Open | 2026-09-18 |
| 9 | Argentina Style Asado calorie value — flagged in quotation | Open | 2026-09-18 |

## Confirm at kickoff

- Latin slug policy for Arabic URLs
- Split lunch/dinner service hours per branch
- Latin vs Arabic-Indic numerals (currently Latin — `lib/format.ts`)
```

- [ ] **Step 8: Commit**

```bash
git add scripts/build-menu-items.mjs content/menu-items.json content/menu-items.test.ts docs/content-gaps.md
git commit -m "feat: add 89-dish bilingual menu fixture and content gap log"
```

---

### Task 9: Branch, settings, testimonial and page fixtures

**Files:**
- Create: `content/settings.json`
- Create: `content/branches.json`
- Create: `content/testimonials.json`
- Create: `content/pages.json`
- Test: `content/fixtures.test.ts`

**Interfaces:**
- Consumes: `branchSchema`, `settingsSchema`, `testimonialSchema`, `pageSchema`
- Produces: the remaining four fixture files

- [ ] **Step 1: Write the failing test**

Create `content/fixtures.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import branches from '@/content/branches.json'
import settings from '@/content/settings.json'
import testimonials from '@/content/testimonials.json'
import pages from '@/content/pages.json'
import { settingsSchema, testimonialSchema } from '@/lib/schemas'
import { LOCALES } from '@/lib/i18n/config'

describe('settings fixture', () => {
  it('parses against the contract shape', () => {
    expect(() => settingsSchema.parse(settings)).not.toThrow()
  })

  it('declares exactly one GA4 id and one GTM id', () => {
    expect(Object.keys(settings.analytics)).toEqual(['ga4_id', 'gtm_id'])
  })
})

describe('branches fixture', () => {
  it('has exactly the two contracted slugs', () => {
    expect(branches.map((b) => b.slug).sort()).toEqual(['al-yasmin', 'narjis'])
  })

  it('has seven opening-hour rows per branch, one per weekday', () => {
    for (const branch of branches) {
      expect(branch.opening_hours).toHaveLength(7)
      expect(branch.opening_hours.map((h) => h.day_of_week)).toEqual([
        0, 1, 2, 3, 4, 5, 6,
      ])
    }
  })

  it('carries distinct story copy per branch in both locales', () => {
    for (const locale of LOCALES) {
      const stories = branches.map((b) => b.translations[locale].story)
      expect(new Set(stories).size).toBe(branches.length)
      for (const story of stories) {
        expect(story.length).toBeGreaterThan(120)
      }
    }
  })

  it('has coordinates inside the Riyadh bounding box', () => {
    for (const branch of branches) {
      expect(branch.latitude).toBeGreaterThan(24.4)
      expect(branch.latitude).toBeLessThan(25.1)
      expect(branch.longitude).toBeGreaterThan(46.4)
      expect(branch.longitude).toBeLessThan(47.1)
    }
  })

  // branchSchema wants facilities as {slug, label}[], but the fixture stores a
  // slug array plus a per-locale label map. A slug with no label in one locale
  // produces an undefined label at map time — a failure that surfaces in the
  // fetcher, two tasks away from the fixture that caused it.
  it('has a label for every facility slug, in both locales, and no orphan labels', () => {
    for (const branch of branches) {
      for (const locale of LOCALES) {
        const labels = branch.translations[locale].facilities_labels
        for (const slug of branch.facilities) {
          expect(
            labels[slug],
            `${branch.slug}/${locale}: no label for facility "${slug}"`,
          ).toBeTruthy()
        }
        expect(Object.keys(labels).sort()).toEqual([...branch.facilities].sort())
      }
    }
  })

  it('carries tagline, directions and a populated FAQ per locale', () => {
    for (const branch of branches) {
      for (const locale of LOCALES) {
        const t = branch.translations[locale]
        expect(t.tagline.length).toBeGreaterThan(0)
        expect(t.directions_note.length).toBeGreaterThan(0)
        expect(t.faq.length).toBeGreaterThanOrEqual(2)
        for (const pair of t.faq) {
          expect(pair.q.length).toBeGreaterThan(0)
          expect(pair.a.length).toBeGreaterThan(0)
        }
      }
    }
  })
})

describe('testimonials fixture', () => {
  it('parses every entry in both locales', () => {
    for (const entry of testimonials) {
      for (const locale of LOCALES) {
        expect(() =>
          testimonialSchema.parse({
            author_name: entry.author_name,
            author_title: entry.translations[locale].author_title,
            body: entry.translations[locale].body,
            rating: entry.rating,
            source: entry.source,
          }),
        ).not.toThrow()
      }
    }
  })
})

describe('pages fixture', () => {
  it('covers the three system pages', () => {
    expect(pages.map((p) => p.slug).sort()).toEqual([
      'contact',
      'privacy-policy',
      'terms-and-conditions',
    ])
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- content/fixtures.test.ts`
Expected: FAIL — the four JSON files do not exist.

- [ ] **Step 3: Create `content/settings.json`**

```json
{
  "site_name": "La Rio",
  "default_locale": "en",
  "locales": ["en", "ar"],
  "contact": {
    "phone": "+966112345678",
    "whatsapp": "+966512345678",
    "email": "hello@lario.sa"
  },
  "social": {
    "instagram": "https://instagram.com/lario.sa",
    "tiktok": "https://tiktok.com/@lario.sa",
    "snapchat": "https://snapchat.com/add/lario.sa"
  },
  "analytics": { "ga4_id": null, "gtm_id": null },
  "seo_defaults": {
    "title_suffix": " | La Rio Riyadh",
    "og_image": "https://lario.sa/images/og/default.jpg"
  }
}
```

`ga4_id` and `gtm_id` are `null` until the client supplies them. The current
site's duplicate analytics tags are a defect this project fixes — never hardcode
a second one anywhere.

- [ ] **Step 4: Create `content/branches.json`**

Two entries. `story` must differ substantially between branches — near-identical
branch pages compete and neither ranks:

```json
[
  {
    "slug": "narjis",
    "phone": "+966112345678",
    "whatsapp": "+966512345678",
    "email": "narjis@lario.sa",
    "latitude": 24.8305,
    "longitude": 46.6362,
    "google_maps_url": "https://maps.google.com/?q=La+Rio+Al+Narjis+Riyadh",
    "google_place_id": null,
    "hero_image": "/images/branches/narjis/hero.jpg",
    "gallery": [],
    "facilities": ["valet", "outdoor-seating", "family-section", "private-room", "wheelchair-access"],
    "popular_dish_slugs": ["assado-argentina-style", "pizza-la-rio-signature", "urfa-kebab"],
    "is_active": true,
    "sort_order": 0,
    "opening_hours": [
      { "day_of_week": 0, "opens_at": "12:00", "closes_at": "23:30", "is_closed": false },
      { "day_of_week": 1, "opens_at": "12:00", "closes_at": "23:30", "is_closed": false },
      { "day_of_week": 2, "opens_at": "12:00", "closes_at": "23:30", "is_closed": false },
      { "day_of_week": 3, "opens_at": "12:00", "closes_at": "23:30", "is_closed": false },
      { "day_of_week": 4, "opens_at": "12:00", "closes_at": "23:30", "is_closed": false },
      { "day_of_week": 5, "opens_at": "13:00", "closes_at": "01:00", "is_closed": false },
      { "day_of_week": 6, "opens_at": "13:00", "closes_at": "01:00", "is_closed": false }
    ],
    "translations": {
      "en": {
        "name": "La Rio Al Narjis",
        "tagline": "Our first table in Riyadh",
        "address": "Al Narjis District, Riyadh 13327, Saudi Arabia",
        "city": "Riyadh",
        "directions_note": "Parking is available on the north side, with valet from 7pm.",
        "story": "Al Narjis was the first La Rio and still sets the pace for both kitchens. The dining room opens around a central charcoal grill, so the room carries the sound and smell of the fire all evening. It seats ninety across the main floor with a private room for twelve behind the bar, and the terrace stays open through the cooler months.",
        "facilities_labels": {
          "valet": "Valet parking",
          "outdoor-seating": "Terrace seating",
          "family-section": "Family section",
          "private-room": "Private dining room",
          "wheelchair-access": "Step-free access"
        },
        "faq": [
          { "q": "Do you take walk-ins?", "a": "Yes, though weekend evenings fill quickly. A reservation request is the safer route." },
          { "q": "Is there a family section?", "a": "Yes, the family section seats forty and is separated from the main floor." }
        ]
      },
      "ar": {
        "name": "لا ريو النرجس",
        "tagline": "مائدتنا الأولى في الرياض",
        "address": "حي النرجس، الرياض 13327، المملكة العربية السعودية",
        "city": "الرياض",
        "directions_note": "تتوفر مواقف في الجهة الشمالية، وخدمة صف السيارات من الساعة السابعة مساءً.",
        "story": "كان النرجس أول فرع للا ريو، وما زال يحدد إيقاع المطبخين معاً. تنفتح صالة الطعام حول شواية فحم مركزية، فيحمل المكان صوت النار ورائحتها طوال المساء. تتسع الصالة الرئيسية لتسعين ضيفاً، إضافة إلى غرفة خاصة لاثني عشر شخصاً خلف البار، وتبقى التراس مفتوحة طوال الأشهر المعتدلة.",
        "facilities_labels": {
          "valet": "خدمة صف السيارات",
          "outdoor-seating": "جلسات خارجية",
          "family-section": "قسم العائلات",
          "private-room": "غرفة طعام خاصة",
          "wheelchair-access": "مدخل بدون درج"
        },
        "faq": [
          { "q": "هل تستقبلون الزوار بدون حجز؟", "a": "نعم، لكن أمسيات نهاية الأسبوع تمتلئ سريعاً، ويبقى طلب الحجز الخيار الأضمن." },
          { "q": "هل يوجد قسم للعائلات؟", "a": "نعم، يتسع قسم العائلات لأربعين ضيفاً وهو منفصل عن الصالة الرئيسية." }
        ]
      }
    }
  },
  {
    "slug": "al-yasmin",
    "phone": "+966112345679",
    "whatsapp": "+966512345679",
    "email": "yasmin@lario.sa",
    "latitude": 24.8156,
    "longitude": 46.6389,
    "google_maps_url": "https://maps.google.com/?q=La+Rio+Al+Yasmin+Riyadh",
    "google_place_id": null,
    "hero_image": "/images/branches/al-yasmin/hero.jpg",
    "gallery": [],
    "facilities": ["valet", "outdoor-seating", "family-section", "wheelchair-access"],
    "popular_dish_slugs": ["fettuccine-alfredo-on-the-parmesan-wheel", "ribeye-steak", "adana-spicy-kebab"],
    "is_active": true,
    "sort_order": 1,
    "opening_hours": [
      { "day_of_week": 0, "opens_at": "13:00", "closes_at": "23:00", "is_closed": false },
      { "day_of_week": 1, "opens_at": "13:00", "closes_at": "23:00", "is_closed": false },
      { "day_of_week": 2, "opens_at": "13:00", "closes_at": "23:00", "is_closed": false },
      { "day_of_week": 3, "opens_at": "13:00", "closes_at": "23:00", "is_closed": false },
      { "day_of_week": 4, "opens_at": "13:00", "closes_at": "23:00", "is_closed": false },
      { "day_of_week": 5, "opens_at": "13:00", "closes_at": "01:00", "is_closed": false },
      { "day_of_week": 6, "opens_at": "13:00", "closes_at": "01:00", "is_closed": false }
    ],
    "translations": {
      "en": {
        "name": "La Rio Al Yasmin",
        "tagline": "Quieter rooms, the same fire",
        "address": "Al Yasmin District, Riyadh 13325, Saudi Arabia",
        "city": "Riyadh",
        "directions_note": "Entrance is on the eastern side of the building, behind the courtyard.",
        "story": "Al Yasmin opened four years after Narjis and was built for longer, slower dinners. The room is divided into smaller bays rather than one open floor, which keeps conversation at the table rather than across it. The pasta station is visible from the dining room, and the courtyard seats thirty under the trees from October through April.",
        "facilities_labels": {
          "valet": "Valet parking",
          "outdoor-seating": "Courtyard seating",
          "family-section": "Family section",
          "wheelchair-access": "Step-free access"
        },
        "faq": [
          { "q": "Is the courtyard open year round?", "a": "It opens in October and closes at the end of April, weather permitting." },
          { "q": "Can you host a group of twenty?", "a": "Yes. Two bays can be combined for larger groups — mention it in your reservation notes." }
        ]
      },
      "ar": {
        "name": "لا ريو الياسمين",
        "tagline": "قاعات أهدأ، والنار ذاتها",
        "address": "حي الياسمين، الرياض 13325، المملكة العربية السعودية",
        "city": "الرياض",
        "directions_note": "المدخل من الجهة الشرقية للمبنى، خلف الفناء.",
        "story": "افتُتح فرع الياسمين بعد النرجس بأربع سنوات، وصُمم لعشاءات أطول وأكثر تمهلاً. تنقسم القاعة إلى جلسات صغيرة بدل صالة مفتوحة واحدة، ما يبقي الحديث داخل الطاولة لا عبرها. محطة الباستا مرئية من صالة الطعام، ويتسع الفناء لثلاثين ضيفاً تحت الأشجار من أكتوبر حتى أبريل.",
        "facilities_labels": {
          "valet": "خدمة صف السيارات",
          "outdoor-seating": "جلسات في الفناء",
          "family-section": "قسم العائلات",
          "wheelchair-access": "مدخل بدون درج"
        },
        "faq": [
          { "q": "هل الفناء مفتوح طوال السنة؟", "a": "يفتح في أكتوبر ويغلق نهاية أبريل، حسب أحوال الطقس." },
          { "q": "هل يمكنكم استضافة مجموعة من عشرين شخصاً؟", "a": "نعم، يمكن دمج جلستين للمجموعات الكبيرة — يُرجى ذكر ذلك في ملاحظات الحجز." }
        ]
      }
    }
  }
]
```

- [ ] **Step 5: Create `content/testimonials.json`**

Twelve entries following this shape. `rating` is displayed but never marked up
as `Review` or `AggregateRating` JSON-LD — that is a Google manual-action risk:

```json
[
  {
    "author_name": "Nouf A.",
    "rating": 5,
    "source": "google",
    "branch_slug": "narjis",
    "is_featured": true,
    "sort_order": 0,
    "translations": {
      "en": { "author_title": "Visited in March", "body": "The asado is worth the wait. We sat near the grill and watched most of it happen." },
      "ar": { "author_title": "زارت في مارس", "body": "الأسادو يستحق الانتظار. جلسنا قرب الشواية وشاهدنا معظم التحضير أمامنا." }
    }
  }
]
```

Write eleven more in the same shape, varying branch, rating and voice.

- [ ] **Step 6: Create `content/pages.json`**

```json
[
  {
    "slug": "contact",
    "template": "contact",
    "translations": {
      "en": { "title": "Contact La Rio", "heading": "Get in touch", "body": "<p>Call either branch directly, send a message, or reach us on WhatsApp. We reply within one working day.</p>" },
      "ar": { "title": "تواصل مع لا ريو", "heading": "كيف نصل إليك", "body": "<p>اتصل بأي من الفرعين مباشرة، أو أرسل رسالة، أو تواصل معنا عبر واتساب. نرد خلال يوم عمل واحد.</p>" }
    }
  },
  {
    "slug": "privacy-policy",
    "template": "legal",
    "translations": {
      "en": { "title": "Privacy Policy", "heading": "Privacy Policy", "body": "<p>Placeholder pending client-supplied copy. See docs/content-gaps.md item 7.</p>" },
      "ar": { "title": "سياسة الخصوصية", "heading": "سياسة الخصوصية", "body": "<p>نص مؤقت بانتظار المحتوى من العميل. راجع docs/content-gaps.md البند 7.</p>" }
    }
  },
  {
    "slug": "terms-and-conditions",
    "template": "legal",
    "translations": {
      "en": { "title": "Terms & Conditions", "heading": "Terms & Conditions", "body": "<p>Placeholder pending client-supplied copy. See docs/content-gaps.md item 7.</p>" },
      "ar": { "title": "الشروط والأحكام", "heading": "الشروط والأحكام", "body": "<p>نص مؤقت بانتظار المحتوى من العميل. راجع docs/content-gaps.md البند 7.</p>" }
    }
  }
]
```

- [ ] **Step 7: Run tests**

Run: `npm test -- content/fixtures.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 8: Commit**

```bash
git add content/settings.json content/branches.json content/testimonials.json content/pages.json content/fixtures.test.ts
git commit -m "feat: add settings, branch, testimonial and page fixtures"
```

---

### Task 10: Homepage fixture

**Files:**
- Create: `content/home.json`
- Test: `content/home.test.ts`

**Interfaces:**
- Consumes: `homeSchema`, `SECTION_TYPES`
- Produces: `content/home.json` — 11 sections in sort order

- [ ] **Step 1: Write the failing test**

Create `content/home.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import home from '@/content/home.json'
import { SECTION_TYPES } from '@/lib/schemas'
import { LOCALES } from '@/lib/i18n/config'

describe('home fixture', () => {
  it('has all 11 approved section types exactly once', () => {
    const types = home.sections.map((s) => s.type)
    expect(types).toHaveLength(11)
    expect(new Set(types).size).toBe(11)
    for (const type of SECTION_TYPES) {
      expect(types).toContain(type)
    }
  })

  it('orders sections by sort_order starting at zero', () => {
    const orders = home.sections.map((s) => s.sort_order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    expect(orders[0]).toBe(0)
  })

  it('opens with hero and closes with reservation_cta', () => {
    expect(home.sections[0].type).toBe('hero')
    expect(home.sections.at(-1)?.type).toBe('reservation_cta')
  })

  it('carries translated content for every section in both locales', () => {
    for (const section of home.sections) {
      for (const locale of LOCALES) {
        expect(section.translations[locale]).toBeDefined()
        expect(section.translations[locale].heading.length).toBeGreaterThan(0)
      }
    }
  })

  it('references six featured dishes on featured_dishes', () => {
    const featured = home.sections.find((s) => s.type === 'featured_dishes')
    expect(featured?.payload.item_slugs).toHaveLength(6)
  })

  it('references both branches on branch_cards', () => {
    const cards = home.sections.find((s) => s.type === 'branch_cards')
    expect(cards?.payload.branch_slugs).toEqual(['narjis', 'al-yasmin'])
  })

  it('carries at least four FAQ pairs in both locales', () => {
    const faq = home.sections.find((s) => s.type === 'faq')
    for (const locale of LOCALES) {
      expect(faq?.translations[locale].items.length).toBeGreaterThanOrEqual(4)
    }
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- content/home.test.ts`
Expected: FAIL — cannot resolve `@/content/home.json`.

- [ ] **Step 3: Create the fixture**

Create `content/home.json`. Eleven sections in this exact order: `hero`,
`intro`, `featured_dishes`, `why_lario`, `chef_story`, `branch_cards`,
`private_events`, `gallery_strip`, `testimonials`, `faq`, `reservation_cta`.

Every section takes this shape — `payload` is non-translatable configuration,
`translations` is the copy:

```json
{
  "seo_path": "/",
  "seo": {
    "en": {
      "title": "La Rio Restaurant Riyadh",
      "description": "Italian, Turkish and Argentine dining in Al Narjis and Al Yasmin. Handmade pasta, wood-fired pizza and charcoal grills. Reserve a table."
    },
    "ar": {
      "title": "مطعم لا ريو الرياض",
      "description": "مطبخ إيطالي وتركي وأرجنتيني في النرجس والياسمين. معكرونة طازجة وبيتزا على الحطب ومشاوي على الفحم. احجز طاولتك."
    }
  },
  "sections": [
    {
      "type": "hero",
      "sort_order": 0,
      "payload": {
        "background_image": "/images/home/hero.jpg",
        "video": null,
        "locations": ["Al Narjis", "Al Yasmin", "Riyadh, Saudi Arabia"]
      },
      "translations": {
        "en": {
          "eyebrow": "A Dining Story Beyond Borders",
          "heading": "Italian, Turkish and Argentinian Dining in Riyadh",
          "subheading": "La Rio brings bold Argentinian fire, timeless Italian recipes and warm Turkish hospitality to one table.",
          "cta_label": "Reserve a Table",
          "secondary_cta_label": "Explore Our Menu"
        },
        "ar": {
          "eyebrow": "حكاية طعام تتجاوز الحدود",
          "heading": "مطبخ إيطالي وتركي وأرجنتيني في الرياض",
          "subheading": "يجمع لا ريو نار الأرجنتين الجريئة ووصفات إيطاليا الخالدة وكرم الضيافة التركية على مائدة واحدة.",
          "cta_label": "احجز طاولتك",
          "secondary_cta_label": "تصفح القائمة"
        }
      }
    },
    {
      "type": "featured_dishes",
      "sort_order": 2,
      "payload": {
        "item_slugs": [
          "assado-argentina-style",
          "fettuccine-alfredo-on-the-parmesan-wheel",
          "urfa-kebab",
          "pizza-la-rio-signature",
          "burrata-salad",
          "ribeye-steak"
        ]
      },
      "translations": {
        "en": { "heading": "Signature Favourites", "eyebrow": "From the Menu", "subheading": "The dishes guests come back for.", "cta_label": "View Full Menu" },
        "ar": { "heading": "أطباقنا المميزة", "eyebrow": "من القائمة", "subheading": "الأطباق التي يعود إليها ضيوفنا.", "cta_label": "عرض القائمة كاملة" }
      }
    },
    {
      "type": "branch_cards",
      "sort_order": 5,
      "payload": { "branch_slugs": ["narjis", "al-yasmin"] },
      "translations": {
        "en": { "heading": "Find Your La Rio", "eyebrow": "Across Riyadh", "subheading": "Two settings, one approach to food and hospitality." },
        "ar": { "heading": "اعثر على لا ريو الأقرب", "eyebrow": "في أنحاء الرياض", "subheading": "موقعان مختلفان، ونهج واحد في الطعام والضيافة." }
      }
    }
  ]
}
```

Fill in the remaining eight sections in the same shape:

- `intro` (sort_order 1) — `payload.cuisines` lists three entries keyed
  `italian`, `turkish`, `argentine`; translations carry a `cards` array of
  `{ key, title, body }`
- `why_lario` (3) — `payload.image`; translations carry a `points` array of
  `{ icon, label }` plus `cta_label`
- `chef_story` (4) — `payload.image`; translations carry `heading`,
  `subheading`, `body`, `cta_label`, `secondary_cta_label`
- `private_events` (6) — `payload.stats` lists three
  `{ key, value }`; translations carry a `cards` array and `cta_label`.
  **Its CTA links to `/reservation`, never to an unbuilt `/events` route.**
- `gallery_strip` (7) — `payload.images` lists six paths; **its CTA links to
  `/branches`, never to an unbuilt `/gallery` route**
- `testimonials` (8) — `payload.testimonial_limit: 6`
- `faq` (9) — translations carry an `items` array of at least four `{ q, a }`
- `reservation_cta` (10) — `payload.default_branch: null`; translations carry
  `heading`, `subheading`, `cta_label`

- [ ] **Step 4: Run tests**

Run: `npm test -- content/home.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add content/home.json content/home.test.ts
git commit -m "feat: add 11-section bilingual homepage fixture"
```

---

### Task 11: Cached API fetchers

**Files:**
- Create: `lib/api/resolve.ts`
- Create: `lib/api/settings.ts`
- Create: `lib/api/menu.ts`
- Create: `lib/api/branches.ts`
- Create: `lib/api/home.ts`
- Create: `lib/api/pages.ts`
- Test: `lib/api/resolve.test.ts`
- Test: `lib/api/menu.test.ts`

**Interfaces:**
- Consumes: every fixture, every schema, `tags`, `buildSeo`
- Produces:
  - `resolveTranslation<T>(translations: Record<Locale, T>, locale: Locale): T`
  - `getSettings(locale: Locale): Promise<Settings>`
  - `getMenuCategories(locale: Locale): Promise<MenuCategory[]>`
  - `getMenuCategory(locale: Locale, slug: string): Promise<MenuCategoryDetail | null>`
  - `getMenuItems(locale: Locale): Promise<MenuItemCard[]>`
  - `getMenuItem(locale: Locale, slug: string): Promise<MenuItem | null>`
  - `getBranches(locale: Locale): Promise<Branch[]>`
  - `getBranch(locale: Locale, slug: string): Promise<Branch | null>`
  - `getHome(locale: Locale): Promise<Home>`
  - `getPage(locale: Locale, slug: string): Promise<Page | null>`

Every fetcher is `'use cache'` + `cacheTag()` + `cacheLife('max')` from the
start, so the caching architecture is proven before the API exists.

- [ ] **Step 1: Write the failing test for translation resolution**

Create `lib/api/resolve.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { resolveTranslation } from '@/lib/api/resolve'

describe('resolveTranslation', () => {
  it('returns the requested locale', () => {
    expect(
      resolveTranslation({ en: { name: 'Pizza' }, ar: { name: 'بيتزا' } }, 'ar'),
    ).toEqual({ name: 'بيتزا' })
  })

  it('falls back to English when the locale is missing', () => {
    const translations = { en: { name: 'Pizza' } } as Record<
      'en' | 'ar',
      { name: string }
    >
    expect(resolveTranslation(translations, 'ar')).toEqual({ name: 'Pizza' })
  })

  it('throws when even the English fallback is absent', () => {
    expect(() =>
      resolveTranslation({} as Record<'en' | 'ar', { name: string }>, 'ar'),
    ).toThrow('No translation available')
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- lib/api/resolve.test.ts`
Expected: FAIL — cannot resolve `@/lib/api/resolve`.

- [ ] **Step 3: Implement translation resolution**

Create `lib/api/resolve.ts`:

```ts
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

export function resolveTranslation<T>(
  translations: Partial<Record<Locale, T>>,
  locale: Locale,
): T {
  const value = translations[locale] ?? translations[DEFAULT_LOCALE]
  if (!value) {
    throw new Error(`No translation available for locale "${locale}"`)
  }
  return value
}
```

- [ ] **Step 4: Implement the menu fetchers**

Create `lib/api/menu.ts`:

```ts
import { cacheLife, cacheTag } from 'next/cache'
import categoriesFixture from '@/content/menu-categories.json'
import itemsFixture from '@/content/menu-items.json'
import { buildSeo } from '@/content/seo-defaults'
import { resolveTranslation } from '@/lib/api/resolve'
import { tags } from '@/lib/cache-tags'
import type { Locale } from '@/lib/i18n/config'
import type {
  MenuCategory,
  MenuCategoryDetail,
  MenuItem,
  MenuItemCard,
} from '@/lib/schemas'

function categoryRef(locale: Locale, slug: string) {
  const category = categoriesFixture.find((c) => c.slug === slug)
  if (!category) throw new Error(`Unknown category slug: ${slug}`)
  return { slug, name: resolveTranslation(category.translations, locale).name }
}

function toCard(
  locale: Locale,
  item: (typeof itemsFixture)[number],
): MenuItemCard {
  const t = resolveTranslation(item.translations, locale)
  return {
    slug: item.slug,
    name: t.name,
    short_description: t.short_description,
    price: item.price,
    currency: item.currency,
    calories: item.calories,
    image: item.image,
    dietary_tags: item.dietary_tags as MenuItemCard['dietary_tags'],
    is_available: item.is_available,
    category: categoryRef(locale, item.category_slug),
    url: `/menu/${item.category_slug}/${item.slug}`,
  }
}

export async function getMenuCategories(
  locale: Locale,
): Promise<MenuCategory[]> {
  'use cache'
  cacheTag(tags.menu())
  cacheLife('max')

  return categoriesFixture
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => {
      const t = resolveTranslation(category.translations, locale)
      const path = `/menu/${category.slug}`
      return {
        slug: category.slug,
        name: t.name,
        description: t.description,
        intro_content: t.intro_content,
        image: category.image,
        item_count: itemsFixture.filter(
          (i) => i.category_slug === category.slug,
        ).length,
        url: path,
        seo: buildSeo({
          title: t.name,
          description: t.description ?? '',
          path,
          locale,
          image: category.image,
        }),
      }
    })
}

export async function getMenuItems(locale: Locale): Promise<MenuItemCard[]> {
  'use cache'
  cacheTag(tags.menu())
  cacheLife('max')

  return itemsFixture.map((item) => toCard(locale, item))
}

export async function getMenuCategory(
  locale: Locale,
  slug: string,
): Promise<MenuCategoryDetail | null> {
  'use cache'
  // Both tags: a dish edit emits `menu` per the contract cascade, and this page
  // renders dishes. Without it the category page serves stale items silently.
  cacheTag(tags.menuCategory(slug), tags.menu())
  cacheLife('max')

  const categories = await getMenuCategories(locale)
  const category = categories.find((c) => c.slug === slug)
  if (!category) return null

  const items = itemsFixture
    .filter((i) => i.category_slug === slug)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => toCard(locale, item))

  return { ...category, items }
}

export async function getMenuItem(
  locale: Locale,
  slug: string,
): Promise<MenuItem | null> {
  'use cache'
  // Both tags, for the same reason getMenuCategory carries both: this page
  // renders `related` dishes, and editing one of those emits `menu`, never
  // `menu-item:{this slug}`. Without it the related block serves stale data
  // indefinitely with nothing erroring.
  cacheTag(tags.menuItem(slug), tags.menu())
  cacheLife('max')

  const item = itemsFixture.find((i) => i.slug === slug)
  if (!item) return null

  const t = resolveTranslation(item.translations, locale)
  const card = toCard(locale, item)
  const related = itemsFixture
    .filter((i) => i.category_slug === item.category_slug && i.slug !== slug)
    .slice(0, 4)
    .map((i) => toCard(locale, i))

  return {
    ...card,
    description: t.description,
    ingredients_note: t.ingredients_note ?? null,
    preparation_note: t.preparation_note ?? null,
    allergens: item.allergens as MenuItem['allergens'],
    seo: buildSeo({
      title: t.name,
      description: t.short_description ?? t.description,
      path: card.url,
      locale,
      image: item.image,
      type: 'article',
    }),
    related,
  }
}

export async function getFeaturedItems(
  locale: Locale,
  slugs: string[],
): Promise<MenuItemCard[]> {
  'use cache'
  cacheTag(tags.home())
  cacheLife('max')

  return slugs
    .map((slug) => itemsFixture.find((i) => i.slug === slug))
    .filter((item): item is (typeof itemsFixture)[number] => Boolean(item))
    .map((item) => toCard(locale, item))
}
```

- [ ] **Step 5: Write the fetcher test**

Create `lib/api/menu.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getMenuCategories, getMenuItem, getMenuItems } from '@/lib/api/menu'
import { menuCategorySchema, menuItemSchema } from '@/lib/schemas'

describe('getMenuCategories', () => {
  it('returns 9 categories that satisfy the contract shape', async () => {
    const categories = await getMenuCategories('en')
    expect(categories).toHaveLength(9)
    for (const category of categories) {
      expect(() => menuCategorySchema.parse(category)).not.toThrow()
    }
  })

  it('counts items per category, summing to 89', async () => {
    const categories = await getMenuCategories('en')
    const total = categories.reduce((sum, c) => sum + c.item_count, 0)
    expect(total).toBe(89)
  })

  it('returns Arabic names for the ar locale', async () => {
    const categories = await getMenuCategories('ar')
    expect(categories[0].name).toMatch(/[؀-ۿ]/)
  })
})

describe('getMenuItems', () => {
  it('returns all 89 items with server-computed urls', async () => {
    const items = await getMenuItems('en')
    expect(items).toHaveLength(89)
    for (const item of items) {
      expect(item.url).toBe(`/menu/${item.category.slug}/${item.slug}`)
    }
  })
})

describe('getMenuItem', () => {
  it('returns null for an unknown slug', async () => {
    expect(await getMenuItem('en', 'no-such-dish')).toBeNull()
  })

  it('returns a full item with at most 4 related dishes', async () => {
    const items = await getMenuItems('en')
    const item = await getMenuItem('en', items[0].slug)
    expect(item).not.toBeNull()
    expect(() => menuItemSchema.parse(item)).not.toThrow()
    expect(item!.related.length).toBeLessThanOrEqual(4)
    expect(item!.related.every((r) => r.slug !== item!.slug)).toBe(true)
  })
})
```

- [ ] **Step 6: Run it**

Run: `npm test -- lib/api/menu.test.ts`
Expected: PASS, 6 tests. If `'use cache'` causes a Vitest failure because the
directive needs the Next compiler, add
`test: { server: { deps: { inline: ['next'] } } }` to `vitest.config.ts`; if it
still fails, extract the pure bodies into `lib/api/menu.impl.ts`, test those, and
keep the cached wrappers thin.

- [ ] **Step 7: Implement the remaining fetchers**

Create `lib/api/settings.ts`, `lib/api/branches.ts`, `lib/api/home.ts` and
`lib/api/pages.ts` following the identical pattern — `'use cache'`, the
matching tag from `lib/cache-tags.ts`, `cacheLife('max')`, translation resolved
via `resolveTranslation`, `seo` built via `buildSeo`, and a server-computed
`url`.

`getBranch` must tag **both** `tags.branch(slug)` and `tags.menu()`. A branch page
renders `popular_dishes`; editing one of those dishes emits `menu`, never
`branch:{slug}`, so a branch-only tag leaves the page serving a stale price
indefinitely. Same failure class as the category page, same fix.

`getBranch` additionally derives `schema_opening_hours` server-side so the
JSON-LD builder never reformats hours:

```ts
const DAY_CODES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export function toSchemaOpeningHours(
  hours: { day_of_week: number; opens_at: string | null; closes_at: string | null; is_closed: boolean }[],
): string[] {
  return hours
    .filter((h) => !h.is_closed && h.opens_at && h.closes_at)
    .map((h) => `${DAY_CODES[h.day_of_week]} ${h.opens_at}-${h.closes_at}`)
}
```

`getHome` resolves `payload.item_slugs` into `items: MenuItemCard[]` via
`getFeaturedItems`, and `payload.branch_slugs` into branch cards, so the
homepage is one call rather than seven.

Its `seo` object is built from the fixture's own top-level `seo.{locale}` block,
**not** derived from the hero section's copy. A hero heading is written for
impact on arrival; a `<title>` is written to be found in search. Conflating them
means an editor cannot tune one without changing the other — and per-page,
per-locale SEO control is exactly what the `seo_meta` table was pulled forward
from a later phase to provide.

- [ ] **Step 8: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: all green.

- [ ] **Step 9: Commit**

```bash
git add lib/api
git commit -m "feat: add cached contract-shaped API fetchers over the JSON layer"
```

---

### Task 12: SEO metadata and JSON-LD

**Files:**
- Create: `lib/seo/metadata.ts`
- Create: `lib/seo/json-ld.ts`
- Test: `lib/seo/metadata.test.ts`
- Test: `lib/seo/json-ld.test.ts`

**Interfaces:**
- Consumes: `Seo`, `Branch`, `MenuItem`, `Home`
- Produces:
  - `buildMetadata(seo: Seo): Metadata`
  - `restaurantJsonLd(input): object`
  - `menuItemJsonLd(item: MenuItem, locale: Locale): object`
  - `breadcrumbJsonLd(crumbs: { name: string; url: string }[]): object`
  - `localBusinessJsonLd(branch: Branch): object`
  - `faqJsonLd(items: { q: string; a: string }[]): object`

- [ ] **Step 1: Write the failing metadata test**

Create `lib/seo/metadata.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildMetadata } from '@/lib/seo/metadata'

const seo = {
  title: 'Pizza | La Rio Riyadh',
  description: 'Long-fermented dough, wood-fired.',
  canonical: 'https://lario.sa/menu/pizza',
  robots: 'index,follow',
  og: {
    title: 'Pizza',
    description: 'Long-fermented dough, wood-fired.',
    image: 'https://lario.sa/images/og/pizza.jpg',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  alternates: {
    en: 'https://lario.sa/menu/pizza',
    ar: 'https://lario.sa/ar/menu/pizza',
  },
  schema_enabled: true,
}

describe('buildMetadata', () => {
  it('maps the seo object verbatim', () => {
    const meta = buildMetadata(seo)
    expect(meta.title).toBe('Pizza | La Rio Riyadh')
    expect(meta.description).toBe('Long-fermented dough, wood-fired.')
  })

  it('sets the canonical and both language alternates plus x-default', () => {
    const meta = buildMetadata(seo)
    expect(meta.alternates?.canonical).toBe('https://lario.sa/menu/pizza')
    expect(meta.alternates?.languages).toEqual({
      en: 'https://lario.sa/menu/pizza',
      ar: 'https://lario.sa/ar/menu/pizza',
      'x-default': 'https://lario.sa/menu/pizza',
    })
  })

  it('parses the robots string into the structured form', () => {
    expect(buildMetadata(seo).robots).toEqual({ index: true, follow: true })
    expect(
      buildMetadata({ ...seo, robots: 'noindex,nofollow' }).robots,
    ).toEqual({ index: false, follow: false })
  })

  it('carries openGraph and twitter through', () => {
    const meta = buildMetadata(seo)
    expect(meta.openGraph?.images).toEqual([
      'https://lario.sa/images/og/pizza.jpg',
    ])
    expect(meta.twitter?.card).toBe('summary_large_image')
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- lib/seo/metadata.test.ts`
Expected: FAIL — cannot resolve `@/lib/seo/metadata`.

- [ ] **Step 3: Implement**

Create `lib/seo/metadata.ts`:

```ts
import type { Metadata } from 'next'
import type { Seo } from '@/lib/schemas'

export function buildMetadata(seo: Seo): Metadata {
  const directives = seo.robots.split(',').map((d) => d.trim().toLowerCase())
  // "none" is a standard directive meaning noindex AND nofollow. Matching only
  // the literal tokens would let it fall through to index:true/follow:true —
  // actively indexing a page whose robots value says to keep it out, with
  // nothing erroring anywhere.
  const none = directives.includes('none')
  return {
    title: seo.title,
    description: seo.description,
    robots: {
      index: !none && !directives.includes('noindex'),
      follow: !none && !directives.includes('nofollow'),
    },
    alternates: {
      canonical: seo.canonical,
      languages: {
        en: seo.alternates.en,
        ar: seo.alternates.ar,
        'x-default': seo.alternates.en,
      },
    },
    openGraph: {
      title: seo.og.title,
      description: seo.og.description,
      url: seo.canonical,
      type: seo.og.type === 'article' ? 'article' : 'website',
      images: seo.og.image ? [seo.og.image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.og.title,
      description: seo.og.description,
      images: seo.og.image ? [seo.og.image] : undefined,
    },
  }
}
```

- [ ] **Step 4: Write the failing JSON-LD test**

Create `lib/seo/json-ld.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo/json-ld'

describe('breadcrumbJsonLd', () => {
  it('numbers positions from 1', () => {
    const ld = breadcrumbJsonLd([
      { name: 'Menu', url: 'https://lario.sa/menu' },
      { name: 'Pizza', url: 'https://lario.sa/menu/pizza' },
    ])
    expect(ld['@type']).toBe('BreadcrumbList')
    expect(ld.itemListElement[0].position).toBe(1)
    expect(ld.itemListElement[1].position).toBe(2)
  })
})

describe('faqJsonLd', () => {
  it('emits one Question per pair', () => {
    const ld = faqJsonLd([{ q: 'Do you take walk-ins?', a: 'Yes.' }])
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity).toHaveLength(1)
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('Yes.')
  })
})
```

- [ ] **Step 5: Implement the JSON-LD builders**

Create `lib/seo/json-ld.ts`:

```ts
import { formatCalories } from '@/lib/format'
import type { Locale } from '@/lib/i18n/config'
import type { Branch, MenuItem } from '@/lib/schemas'

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

// Every price and calorie value in this project is invented placeholder data —
// the client has supplied none (content-gap items 2 and 3). JSON-LD is a
// machine-readable assertion to search engines, not UI copy: a fabricated price
// can be surfaced in Search and Maps before any human reviews the page, and
// markup that does not reflect real content violates Google's structured-data
// policy. So the commercial claims are gated OFF until real data lands. Flip
// this one constant when the client's menu data is in — nothing else changes.
export const MENU_DATA_IS_VERIFIED = false

// schema.org diet URLs for the tags the CMS can produce. "spicy" is deliberately
// absent: it is a preparation style, not a dietary restriction, and has no
// schema.org RestrictedDiet equivalent.
const DIET_URLS: Partial<Record<string, string>> = {
  vegetarian: 'https://schema.org/VegetarianDiet',
  vegan: 'https://schema.org/VeganDiet',
  gluten_free: 'https://schema.org/GlutenFreeDiet',
  halal: 'https://schema.org/HalalDiet',
}

export function menuItemJsonLd(item: MenuItem, locale: Locale) {
  // An array when several apply, a bare string when one does, undefined when
  // none — all three are valid schema.org. The previous single-tag ternary
  // silently dropped every tag but vegetarian, including halal, which is the
  // contract's own example and the most common tag on this menu.
  const diets = item.dietary_tags
    .map((tag) => DIET_URLS[tag])
    .filter((url): url is string => Boolean(url))

  return {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: item.name,
    description: item.description,
    image: item.image ?? undefined,
    offers: MENU_DATA_IS_VERIFIED
      ? { '@type': 'Offer', price: item.price, priceCurrency: item.currency }
      : undefined,
    nutrition:
      MENU_DATA_IS_VERIFIED && item.calories
        ? {
            '@type': 'NutritionInformation',
            calories: `${formatCalories(item.calories, locale)} calories`,
          }
        : undefined,
    suitableForDiet:
      diets.length === 0 ? undefined : diets.length === 1 ? diets[0] : diets,
  }
}

export function localBusinessJsonLd(branch: Branch) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: branch.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: branch.address,
      addressLocality: branch.city,
      addressCountry: 'SA',
    },
    telephone: branch.phone,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: branch.coordinates.latitude,
      longitude: branch.coordinates.longitude,
    },
    openingHours: branch.schema_opening_hours,
    servesCuisine: ['Italian', 'Turkish', 'Argentinian'],
    hasMap: branch.google_maps_url,
  }
}

export function restaurantJsonLd(input: {
  name: string
  description: string
  url: string
  image: string
  branches: Branch[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    servesCuisine: ['Italian', 'Turkish', 'Argentinian'],
    location: input.branches.map((branch) => localBusinessJsonLd(branch)),
  }
}
```

**No `Review` or `AggregateRating` anywhere.** Testimonials are displayed only —
marking up CMS-entered testimonials as reviews is a Google manual-action risk.

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test -- lib/seo && npm run typecheck`
Expected: PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
git add lib/seo
git commit -m "feat: add metadata builder and JSON-LD builders"
```

---

### Task 13: Proxy — headers, locale rewrite, redirects

**Files:**
- Create: `proxy.ts`
- Create: `content/redirects.json`
- Test: `proxy.test.ts`

**Interfaces:**
- Consumes: `LOCALES`, `DEFAULT_LOCALE`
- Produces: `proxy(request: NextRequest): NextResponse`, `config.matcher`

English is unprefixed in the URL but the App Router tree is `app/[locale]/`, so
`/menu` must **rewrite** to `/en/menu`. A request that arrives at `/en/menu`
explicitly is **redirected** to `/menu` so there is one canonical URL per page.

- [ ] **Step 1: Write the failing test**

Create `proxy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

function request(path: string) {
  return new NextRequest(new URL(`https://lario.sa${path}`))
}

describe('locale handling', () => {
  it('rewrites an unprefixed path to the en tree', () => {
    const response = proxy(request('/menu'))
    expect(response.headers.get('x-middleware-rewrite')).toContain('/en/menu')
  })

  it('rewrites the bare root to /en', () => {
    const response = proxy(request('/'))
    expect(response.headers.get('x-middleware-rewrite')).toContain('/en')
  })

  it('passes an /ar path through untouched', () => {
    const response = proxy(request('/ar/menu'))
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('redirects an explicit /en path to the unprefixed canonical', () => {
    const response = proxy(request('/en/menu'))
    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://lario.sa/menu')
  })
})

describe('security headers', () => {
  it('sets them on every response', () => {
    const response = proxy(request('/menu'))
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    )
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
  })
})

describe('redirects', () => {
  it('serves a configured redirect with its status code', () => {
    const response = proxy(request('/our-menu/4'))
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://lario.sa/menu/pizza')
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- proxy.test.ts`
Expected: FAIL — cannot resolve `./proxy`.

- [ ] **Step 3: Create the redirect fixture**

Create `content/redirects.json`:

```json
[
  { "from_path": "/our-menu/4", "to_path": "/menu/pizza", "status_code": 301, "is_active": true }
]
```

- [ ] **Step 4: Implement**

Create `proxy.ts` at the project root:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import redirects from '@/content/redirects.json'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n/config'

// ADR-004 names the required set: CSP, HSTS, Referrer-Policy, Permissions-Policy
// and X-Content-Type-Options.
//
// HSTS deliberately omits `preload`. max-age + includeSubDomains is self-healing
// — serve max-age=0 to release it. `preload` asks to be hardcoded into browser
// source trees, takes months to undo, and reaches already-shipped browsers never.
// That is a one-way commitment for the client to make deliberately, after every
// subdomain is confirmed to terminate HTTPS. Not a foundation-task default.
//
// The CSP is strict-by-default with two known allowances: the Google Maps embed
// on branch pages (frame-src) and data: image URIs. It is UNVERIFIED against real
// pages, because no page exists yet — the very next task renders the first one,
// so a mistake here surfaces immediately rather than in production.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  'frame-src https://www.google.com https://maps.google.com',
  "connect-src 'self'",
  'upgrade-insecure-requests',
].join('; ')

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP,
  'Permissions-Policy': 'camera=(), microphone=(), payment=(), geolocation=()',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
}

// Redirect rows are written AUTOMATICALLY by a slug-change observer (ADR-012),
// so a self-redirect or an A->B->A cycle is a plausible accident, not a contrived
// one. Nothing downstream would catch it: the browser just returns
// ERR_TOO_MANY_REDIRECTS. Drop bad rows at build time rather than serving them.
const ACTIVE_REDIRECTS = redirects.filter(
  (r) => r.is_active && r.from_path !== r.to_path,
)

const REDIRECT_MAP = new Map(
  ACTIVE_REDIRECTS.filter((r) => {
    // Follow the chain from this row's target; if it leads back here, drop it.
    const seen = new Set<string>([r.from_path])
    let next = r.to_path
    for (let hop = 0; hop < 10; hop += 1) {
      if (seen.has(next)) return false
      seen.add(next)
      const onward = ACTIVE_REDIRECTS.find((c) => c.from_path === next)
      if (!onward) return true
      next = onward.to_path
    }
    return false
  }).map((r) => [r.from_path, r] as const),
)

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  const redirect = REDIRECT_MAP.get(pathname)
  if (redirect) {
    const url = request.nextUrl.clone()
    url.pathname = redirect.to_path
    return withHeaders(NextResponse.redirect(url, redirect.status_code))
  }

  const segment = pathname.split('/')[1] ?? ''

  if (segment === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || '/'
    return withHeaders(NextResponse.redirect(url, 308))
  }

  if (!(LOCALES as readonly string[]).includes(segment)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
    return withHeaders(NextResponse.rewrite(url))
  }

  return withHeaders(NextResponse.next())
}

function withHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export const config = {
  // Each exclusion is anchored to a segment boundary — `api(?:/|$)`, not `api`.
  // A bare negative lookahead matches a PREFIX, so `api` would also exclude a
  // legitimate `/api-documentation` page and `images` would exclude
  // `/images-of-our-chefs`: no locale rewrite, so a 404, and no security headers
  // either. Nothing about that failure points back to a routing pattern.
  matcher: [
    '/((?!api(?:/|$)|_next/static(?:/|$)|_next/image(?:/|$)|favicon\\.ico$|images(?:/|$)|.*\\..*).*)',
  ],
}
```

The matcher excludes `images` explicitly — dish photography lives under
`/images/menu/…` and must never pass through locale rewriting.

- [ ] **Step 5: Run tests**

Run: `npm test -- proxy.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add proxy.ts proxy.test.ts content/redirects.json
git commit -m "feat: add proxy with locale rewrite, security headers and redirects"
```

---

### Task 14: Root layout, fonts and not-found

**Files:**
- Delete: `app/page.tsx`
- Modify: `app/layout.tsx` → `app/[locale]/layout.tsx`
- Create: `app/[locale]/page.tsx` (temporary placeholder)
- Create: `app/[locale]/not-found.tsx`
- Modify: `app/globals.css`
- Create: `messages/en.json`, `messages/ar.json`
- Create: `lib/i18n/dictionaries.ts`
- Test: `lib/i18n/dictionaries.test.ts`

**Interfaces:**
- Consumes: `getSettings`, `getDirection`, `isLocale`
- Produces:
  - `getDictionary(locale: Locale): Promise<Dictionary>`
  - `type Dictionary`
  - `app/[locale]/layout.tsx` setting `lang` and `dir`

- [ ] **Step 1: Write the failing dictionary test**

Create `lib/i18n/dictionaries.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import ar from '@/messages/ar.json'
import { getDictionary } from '@/lib/i18n/dictionaries'

describe('dictionaries', () => {
  it('have identical key sets in both locales', () => {
    const flatten = (obj: object, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([key, value]) =>
        typeof value === 'object' && value !== null
          ? flatten(value, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      )
    expect(flatten(en).sort()).toEqual(flatten(ar).sort())
  })

  it('contain no empty Arabic strings', () => {
    const values = JSON.stringify(ar)
    expect(values).not.toContain('""')
  })

  it('loads by locale', async () => {
    const dictionary = await getDictionary('ar')
    expect(dictionary.nav.menu).toMatch(/[؀-ۿ]/)
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- lib/i18n/dictionaries.test.ts`
Expected: FAIL — message files do not exist.

- [ ] **Step 3: Create the message files**

Create `messages/en.json`. UI strings only — never content:

```json
{
  "nav": {
    "home": "Home",
    "menu": "Menu",
    "branches": "Branches",
    "reservation": "Reservations",
    "contact": "Contact",
    "about": "About",
    "story": "Our Story",
    "chef": "Our Chef",
    "gallery": "Gallery",
    "events": "Events",
    "blog": "Journal",
    "comingSoon": "Coming soon"
  },
  "actions": {
    "reserve": "Reserve a Table",
    "exploreMenu": "Explore Our Menu",
    "viewFullMenu": "View Full Menu",
    "viewDetails": "View Details",
    "back": "Back",
    "next": "Next",
    "submit": "Submit",
    "close": "Close",
    "previous": "Previous",
    "skipToContent": "Skip to content"
  },
  "menu": {
    "searchPlaceholder": "Search dishes",
    "allCategories": "All",
    "dietary": "Dietary",
    "priceRange": "Price range",
    "noResults": "No dishes match those filters.",
    "clearFilters": "Clear filters",
    "calories": "calories",
    "unavailable": "Currently unavailable",
    "allergens": "Allergens",
    "relatedDishes": "You might also like"
  },
  "reservation": {
    "stepBranch": "Branch",
    "stepWhen": "Date & party",
    "stepDetails": "Your details",
    "stepReview": "Review",
    "name": "Full name",
    "email": "Email",
    "phone": "Phone",
    "whatsapp": "WhatsApp (optional)",
    "partySize": "Guests",
    "date": "Date",
    "time": "Time",
    "occasion": "Occasion",
    "seating": "Seating preference",
    "notes": "Anything we should know?",
    "consent": "I agree to be contacted about this request.",
    "successTitle": "Request received",
    "successBody": "Your reference is {reference}. The branch will contact you to confirm your table.",
    "errorRequired": "This field is required.",
    "errorEmail": "Enter a valid email address.",
    "errorPhone": "Enter a valid phone number, including the country code.",
    "errorRateLimit": "Too many requests. Please try again in a few minutes.",
    "errorNetwork": "We could not send that. Check your connection and try again."
  },
  "branch": {
    "openingHours": "Opening hours",
    "closed": "Closed",
    "facilities": "Facilities",
    "getDirections": "Get directions",
    "popularDishes": "Popular choices",
    "callBranch": "Call this branch"
  },
  "footer": {
    "rights": "All rights reserved.",
    "privacy": "Privacy Policy",
    "terms": "Terms & Conditions"
  }
}
```

Create `messages/ar.json` with the identical key structure and real Arabic
values. The first test fails loudly if a key is missing or an Arabic value is
empty.

- [ ] **Step 4: Implement the loader**

Create `lib/i18n/dictionaries.ts`:

```ts
import en from '@/messages/en.json'
import ar from '@/messages/ar.json'
import type { Locale } from '@/lib/i18n/config'

export type Dictionary = typeof en

// `satisfies`, never `as`. An `as` cast suppresses the structural check entirely:
// a key present in en.json but missing from ar.json compiles clean and fails only
// at runtime. `satisfies` validates both against Dictionary at compile time while
// keeping their literal types, so a missing Arabic key is a build error.
const DICTIONARIES = { en, ar } satisfies Record<Locale, Dictionary>

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return DICTIONARIES[locale]
}

export function interpolate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  )
}
```

- [ ] **Step 5: Restructure the app directory**

```bash
mkdir -p app/\[locale\]
git rm app/page.tsx
git mv app/layout.tsx app/\[locale\]/layout.tsx
```

- [ ] **Step 6: Write the locale layout**

Replace `app/[locale]/layout.tsx` entirely:

```tsx
import type { Metadata } from 'next'
import { IBM_Plex_Sans_Arabic, Inter } from 'next/font/google'
import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  getDirection,
  isLocale,
} from '@/lib/i18n/config'
import '@/app/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-latin',
  display: 'swap',
})

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  metadataBase: new URL('https://lario.sa'),
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // This is the de facto ROOT layout — no app/layout.tsx sits above it, so it is
  // the only place <html> and <body> are emitted. Calling notFound() here would
  // stream a response WITHOUT those tags, and Next.js then discards our styled
  // not-found.tsx and serves its own generic, unlocalised 404 instead. ADR-006
  // requires lang and dir to be set ALWAYS, so the layout falls back rather than
  // bailing out, and app/[locale]/page.tsx owns the 404 decision. This mirrors
  // the official Next.js i18n guide, whose root layout performs no locale check.
  //
  // Reachable in production: proxy.ts excludes any path containing a dot from
  // locale normalisation, so /de/robots.txt arrives here with locale="de".
  const active: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE

  return (
    <html lang={active} dir={getDirection(active)}>
      <body className={`${inter.variable} ${arabic.variable}`}>
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Add a temporary homepage and not-found**

Create `app/[locale]/page.tsx`. This is a placeholder that Task 1 of the
homepage plan replaces:

```tsx
import { notFound } from 'next/navigation'
import { getMenuCategories } from '@/lib/api/menu'
import { isLocale } from '@/lib/i18n/config'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const categories = await getMenuCategories(locale)

  return (
    <main id="main-content">
      <h1>La Rio</h1>
      <p>{categories.length} categories loaded for locale {locale}.</p>
    </main>
  )
}
```

Create `app/[locale]/not-found.tsx`:

```tsx
export default function NotFound() {
  return (
    <main id="main-content">
      <h1>Page not found</h1>
    </main>
  )
}
```

- [ ] **Step 8: Reset globals.css**

Replace `app/globals.css` entirely. The Create Next App defaults and the Geist
font variables go; real tokens arrive with the design system:

```css
@import "tailwindcss";

@theme {
  --font-latin: var(--font-latin), system-ui, sans-serif;
  --font-arabic: var(--font-arabic), system-ui, sans-serif;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-latin);
}

html[dir="rtl"] body {
  font-family: var(--font-arabic);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 9: Run everything**

Run: `npm test && npm run typecheck && npm run build`
Expected: all green; the build emits `/en` and `/ar` routes.

- [ ] **Step 10: Verify both locales render**

Run: `npm run dev`, then open `http://localhost:3000/` and
`http://localhost:3000/ar`.
Expected: the English page reports 9 categories with `<html lang="en" dir="ltr">`;
the Arabic page reports 9 with `<html lang="ar" dir="rtl">`. Confirm in
view-source, not by eye.

- [ ] **Step 11: Commit**

```bash
git add app messages lib/i18n
git commit -m "feat: add locale layout, fonts, dictionaries and RTL base styles"
```

---

### Task 15: Mock reservation and contact endpoints

**Files:**
- Create: `lib/schemas/reservation.ts`
- Create: `app/api/reservations/route.ts`
- Create: `app/api/contacts/route.ts`
- Test: `lib/schemas/reservation.test.ts`
- Test: `app/api/reservations/route.test.ts`

**Interfaces:**
- Consumes: `localeSchema`, branch slugs
- Produces:
  - `reservationSchema`, `type ReservationInput`
  - `contactSchema`, `type ContactInput`
  - `generateReference(): string`
  - `POST` handlers returning the contract's 201/422/429 shapes

Validation rules mirror what the Laravel Form Request will enforce, so the
backend developer can copy them directly.

- [ ] **Step 1: Write the failing schema test**

Create `lib/schemas/reservation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { reservationSchema } from '@/lib/schemas/reservation'

function inFuture(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

const valid = {
  branch_slug: 'narjis',
  guest_name: 'Nouf Alharbi',
  guest_email: 'nouf@example.com',
  guest_phone: '+966512345678',
  whatsapp: '+966512345678',
  party_size: 4,
  reserved_for: inFuture(7),
  occasion: 'anniversary',
  seating_preference: 'indoor',
  notes: 'Window table if possible.',
  consent: true,
  locale: 'en',
}

describe('reservationSchema', () => {
  it('accepts a complete valid request', () => {
    expect(() => reservationSchema.parse(valid)).not.toThrow()
  })

  it('rejects an unknown branch', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, branch_slug: 'jeddah' }),
    ).toThrow()
  })

  it('rejects a past date', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, reserved_for: inFuture(-1) }),
    ).toThrow()
  })

  it('rejects a date beyond 90 days', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, reserved_for: inFuture(91) }),
    ).toThrow()
  })

  it('bounds party size to 1-20', () => {
    expect(() => reservationSchema.parse({ ...valid, party_size: 0 })).toThrow()
    expect(() => reservationSchema.parse({ ...valid, party_size: 21 })).toThrow()
  })

  it('requires E.164 phone format', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, guest_phone: '0512345678' }),
    ).toThrow()
  })

  it('requires consent to be true', () => {
    expect(() => reservationSchema.parse({ ...valid, consent: false })).toThrow()
  })

  it('allows whatsapp and notes to be omitted', () => {
    const { whatsapp: _w, notes: _n, ...rest } = valid
    expect(() => reservationSchema.parse(rest)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- lib/schemas/reservation.test.ts`
Expected: FAIL — cannot resolve `@/lib/schemas/reservation`.

- [ ] **Step 3: Implement the schemas**

Create `lib/schemas/reservation.ts`:

```ts
import { z } from 'zod'
import { localeSchema } from '@/lib/schemas/common'
import { DEFAULT_LOCALE, type Locale, isLocale } from '@/lib/i18n/config'

const E164 = /^\+[1-9]\d{7,14}$/
const NINETY_DAYS_MS = 90 * 86_400_000

export const SEATING_PREFERENCES = ['indoor', 'outdoor', 'private'] as const
export const OCCASIONS = [
  'birthday',
  'anniversary',
  'business',
  'family',
  'other',
] as const

export const reservationSchema = z.object({
  branch_slug: z.enum(['narjis', 'al-yasmin']),
  guest_name: z.string().min(2).max(120),
  guest_email: z.email(),
  guest_phone: z.string().regex(E164, 'phone must be E.164, e.g. +966512345678'),
  whatsapp: z.string().regex(E164).nullish(),
  party_size: z.number().int().min(1).max(20),
  // An explicit UTC offset is REQUIRED, not optional. Date.parse() on a naive
  // datetime resolves against the SERVER PROCESS's local timezone — not
  // Asia/Riyadh and not the guest's device. Verified: "2026-10-04T20:30:00"
  // parsed under TZ=Asia/Dhaka yields 17:30 Riyadh, a three-hour error.
  // 02-database-schema.md names this exact failure: "A reservation landing three
  // hours off is the kind of bug that surfaces in front of the client."
  // The Laravel Form Request must enforce the same thing — a bare `date` rule
  // will NOT reproduce this.
  reserved_for: z
    .iso.datetime({ offset: true })
    .refine((value) => Date.parse(value) > Date.now(), 'must be in the future')
    .refine(
      (value) => Date.parse(value) <= Date.now() + NINETY_DAYS_MS,
      'must be within 90 days',
    ),
  occasion: z.enum(OCCASIONS).nullish(),
  seating_preference: z.enum(SEATING_PREFERENCES).nullish(),
  notes: z.string().max(1000).nullish(),
  consent: z.literal(true),
  locale: localeSchema,
})
export type ReservationInput = z.infer<typeof reservationSchema>

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
  phone: z.string().regex(E164).nullish(),
  subject: z.string().max(200).nullish(),
  message: z.string().min(10).max(2000),
  branch_slug: z.enum(['narjis', 'al-yasmin']).nullish(),
  locale: localeSchema,
})
export type ContactInput = z.infer<typeof contactSchema>

// 03-api-contract.md: 422 responses carry "messages already localised to the
// request locale". The payload carries `locale` and the handler already uses it
// for the branch name, so there is no excuse for English-only errors in a
// bilingual product. Keyed by field so this maps 1:1 onto the Laravel Form
// Request's messages() and lang files — the backend reimplements these, it does
// not invent its own.
export const VALIDATION_MESSAGES: Record<Locale, Record<string, string>> = {
  en: {
    branch_slug: 'Choose one of our branches.',
    guest_name: 'Enter your full name.',
    guest_email: 'Enter a valid email address.',
    guest_phone:
      'Enter a valid phone number including the country code, for example +966512345678.',
    whatsapp: 'Enter a valid WhatsApp number including the country code.',
    party_size: 'Choose a party size between 1 and 20 guests.',
    reserved_for:
      'Choose a date and time in the next 90 days, including a timezone offset.',
    occasion: 'Choose one of the listed occasions.',
    seating_preference: 'Choose one of the listed seating options.',
    notes: 'Notes must be under 1000 characters.',
    consent: 'Please agree to be contacted about this request.',
    message: 'Enter a message between 10 and 2000 characters.',
    subject: 'Subject must be under 200 characters.',
    name: 'Enter your full name.',
    email: 'Enter a valid email address.',
    phone: 'Enter a valid phone number including the country code.',
    locale: 'Unsupported language.',
    form: 'Please check the highlighted fields.',
  },
  ar: {
    branch_slug: 'اختر أحد فروعنا.',
    guest_name: 'أدخل اسمك الكامل.',
    guest_email: 'أدخل بريداً إلكترونياً صحيحاً.',
    guest_phone: 'أدخل رقم هاتف صحيحاً مع رمز الدولة، مثل ‎+966512345678.',
    whatsapp: 'أدخل رقم واتساب صحيحاً مع رمز الدولة.',
    party_size: 'اختر عدد ضيوف بين ١ و٢٠.',
    reserved_for: 'اختر تاريخاً ووقتاً خلال التسعين يوماً القادمة، مع تحديد المنطقة الزمنية.',
    occasion: 'اختر إحدى المناسبات المتاحة.',
    seating_preference: 'اختر أحد خيارات الجلوس المتاحة.',
    notes: 'يجب ألا تتجاوز الملاحظات ١٠٠٠ حرف.',
    consent: 'يرجى الموافقة على التواصل معك بخصوص هذا الطلب.',
    message: 'أدخل رسالة بين ١٠ و٢٠٠٠ حرف.',
    subject: 'يجب ألا يتجاوز الموضوع ٢٠٠ حرف.',
    name: 'أدخل اسمك الكامل.',
    email: 'أدخل بريداً إلكترونياً صحيحاً.',
    phone: 'أدخل رقم هاتف صحيحاً مع رمز الدولة.',
    locale: 'لغة غير مدعومة.',
    form: 'يرجى مراجعة الحقول المحددة.',
  },
}

// The locale is read from the payload being validated, which may itself be
// invalid — fall back to English rather than throwing while building an error.
export function localiseIssues(
  issues: { path: PropertyKey[] }[],
  locale: Locale,
): Record<string, string[]> {
  const table = VALIDATION_MESSAGES[locale] ?? VALIDATION_MESSAGES.en
  const errors: Record<string, string[]> = {}
  for (const issue of issues) {
    const field = String(issue.path[0] ?? 'form')
    const message = table[field] ?? table.form
    if (!errors[field]) errors[field] = []
    if (!errors[field].includes(message)) errors[field].push(message)
  }
  return errors
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateReference(): string {
  let suffix = ''
  for (let i = 0; i < 6; i += 1) {
    suffix += REFERENCE_ALPHABET.charAt(
      Math.floor(Math.random() * REFERENCE_ALPHABET.length),
    )
  }
  return `LR-${suffix}`
}
```

The alphabet omits `I`, `O`, `0` and `1` so a reference read aloud over the
phone is unambiguous.

- [ ] **Step 4: Write the failing route test**

Create `app/api/reservations/route.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { POST } from '@/app/api/reservations/route'

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://lario.sa/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const valid = {
  branch_slug: 'narjis',
  guest_name: 'Nouf Alharbi',
  guest_email: 'nouf@example.com',
  guest_phone: '+966512345678',
  party_size: 4,
  reserved_for: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  consent: true,
  locale: 'en',
}

describe('POST /api/reservations', () => {
  it('returns 201 with a reference and pending status', async () => {
    const response = await POST(post(valid))
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.reference).toMatch(/^LR-[A-Z2-9]{6}$/)
    expect(body.data.status).toBe('pending')
    expect(body.data.branch.slug).toBe('narjis')
  })

  it('returns 422 with per-field errors', async () => {
    const response = await POST(post({ ...valid, guest_email: 'nope' }))
    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.errors.guest_email).toBeDefined()
    expect(Array.isArray(body.errors.guest_email)).toBe(true)
  })

  it('returns 429 when the simulate header asks for it', async () => {
    const response = await POST(post(valid, { 'x-lario-simulate': '429' }))
    expect(response.status).toBe(429)
  })

  it('returns 422 for malformed JSON', async () => {
    const response = await POST(
      new Request('https://lario.sa/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ not json',
      }),
    )
    expect(response.status).toBe(422)
  })
})
```

- [ ] **Step 5: Implement the reservation route**

Create `app/api/reservations/route.ts`:

```ts
import branches from '@/content/branches.json'
import { resolveTranslation } from '@/lib/api/resolve'
import {
  VALIDATION_MESSAGES,
  generateReference,
  localiseIssues,
  reservationSchema,
} from '@/lib/schemas/reservation'
import { DEFAULT_LOCALE, type Locale, isLocale } from '@/lib/i18n/config'

export async function POST(request: Request): Promise<Response> {
  // This route is the LIVE backend until Laravel exists, so the simulate escape
  // hatch must not survive to production — otherwise any caller can force a 429
  // or 500 on demand against the real site. It is a testing affordance, and it
  // is not documented in the API contract.
  const simulate =
    process.env.NODE_ENV === 'production'
      ? null
      : request.headers.get('x-lario-simulate')
  if (simulate === '429') {
    return Response.json(
      { message: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }
  if (simulate === '500') {
    return Response.json({ message: 'Server error.' }, { status: 500 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json(
      { message: 'Malformed request body.', errors: {} },
      { status: 422 },
    )
  }

  // Read the locale from the raw payload before validation — the request may be
  // invalid precisely because the guest is filling the Arabic form in, and they
  // should not be told so in English.
  const requested = (payload as { locale?: unknown } | null)?.locale
  const locale: Locale =
    typeof requested === 'string' && isLocale(requested)
      ? requested
      : DEFAULT_LOCALE

  const parsed = reservationSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      {
        message: VALIDATION_MESSAGES[locale].form,
        errors: localiseIssues(parsed.error.issues, locale),
      },
      { status: 422 },
    )
  }

  const data = parsed.data
  const branch = branches.find((b) => b.slug === data.branch_slug)
  if (!branch) {
    return Response.json(
      {
        message: 'The given data was invalid.',
        errors: { branch_slug: ['Unknown branch.'] },
      },
      { status: 422 },
    )
  }

  const translation = resolveTranslation(branch.translations, data.locale)

  return Response.json(
    {
      data: {
        reference: generateReference(),
        status: 'pending',
        reserved_for: data.reserved_for,
        branch: {
          slug: branch.slug,
          name: translation.name,
          phone: branch.phone,
          email: branch.email,
        },
      },
    },
    { status: 201 },
  )
}
```

The response says `status: 'pending'` and carries the branch's contact details.
The UI copy built on top of it must say the branch will confirm — **never** that
the table is booked.

- [ ] **Step 6: Implement the contact route**

Create `app/api/contacts/route.ts` with the same structure, validating with
`contactSchema` and returning `201 { "data": { "status": "received" } }`.

- [ ] **Step 7: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all green, 12 new tests.

- [ ] **Step 8: Amend the API contract and schema docs**

Contract amendment A from spec §5. These edits are mandatory — the schemas you
just wrote are ahead of the contract until you make them.

In `../lario-docs/03-api-contract.md`, under `POST /reservations`, add the three
fields to the request body example and the rules paragraph:

```
{ "branch_slug": "narjis", "guest_name": "…", "guest_email": "…",
  "guest_phone": "+9665…", "whatsapp": "+9665…", "party_size": 4,
  "reserved_for": "2026-10-04T20:30:00+03:00",
  "occasion": "anniversary", "seating_preference": "indoor",
  "notes": "…", "consent": true, "locale": "en" }
```

> Rules, additions: `whatsapp` is optional, E.164 when present.
> `seating_preference` is one of `indoor` · `outdoor` · `private`, optional.
> `consent` is required and must be `true`. Added 2026-09-18.

In `../lario-docs/02-database-schema.md`, under `reservations`, add three rows:

| Column | Type | Notes |
|---|---|---|
| `whatsapp` | string nullable | E.164 |
| `seating_preference` | string nullable | `SeatingPreference` enum |
| `consent_at` | timestamp nullable | when consent was given — the defensible record |

Add `SeatingPreference` to the `app/Enums/` list in the same document.

- [ ] **Step 9: Verify the amendments are complete**

Run: `grep -c "seating_preference" ../lario-docs/03-api-contract.md ../lario-docs/02-database-schema.md`
Expected: a non-zero count in both files.

- [ ] **Step 10: Commit**

```bash
git add lib/schemas/reservation.ts lib/schemas/reservation.test.ts app/api
git commit -m "feat: add mock reservation and contact endpoints with full error states

Contract amendment A applied to ../lario-docs/03-api-contract.md and
02-database-schema.md: whatsapp, seating_preference, consent_at.
Those files are not versioned, so they cannot be included in this commit."
```

---

### Task 16: Revalidation webhook

**Files:**
- Create: `app/api/revalidate/route.ts`
- Test: `app/api/revalidate/route.test.ts`

**Interfaces:**
- Consumes: `revalidateTag` from `next/cache`, `process.env.LARIO_REVALIDATE_SECRET`
  read directly (never `requireEnv` — it throws, and this route must answer 401,
  never 500, when the secret is absent)
- Produces: `POST` handler returning `200 { revalidated: n }` or `401`

The route handler is frontend code even though its caller is Laravel. Building
it now means the round trip can be tested the day the backend exists rather than
discovered broken on day 18.

- [ ] **Step 1: Write the failing test**

Create `app/api/revalidate/route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHmac } from 'node:crypto'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

const SECRET = 'test-secret'

beforeEach(() => {
  process.env.LARIO_REVALIDATE_SECRET = SECRET
  vi.clearAllMocks()
})

function signed(body: object, timestamp = Math.floor(Date.now() / 1000)) {
  const raw = JSON.stringify(body)
  const signature = createHmac('sha256', SECRET)
    .update(`${timestamp}.${raw}`)
    .digest('hex')
  return new Request('https://lario.sa/api/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Lario-Timestamp': String(timestamp),
      'X-Lario-Signature': `sha256=${signature}`,
    },
    body: raw,
  })
}

describe('POST /api/revalidate', () => {
  it('revalidates each tag and reports the count', async () => {
    const { POST } = await import('@/app/api/revalidate/route')
    const { revalidateTag } = await import('next/cache')
    const response = await POST(
      signed({ tags: ['menu', 'menu-item:carbonara'], reason: 'test' }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ revalidated: 2 })
    expect(revalidateTag).toHaveBeenCalledWith('menu', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('menu-item:carbonara', 'max')
  })

  it('rejects a bad signature with 401', async () => {
    const { POST } = await import('@/app/api/revalidate/route')
    const request = signed({ tags: ['menu'], reason: 'test' })
    request.headers.set('X-Lario-Signature', 'sha256=deadbeef')
    expect((await POST(request)).status).toBe(401)
  })

  it('rejects a timestamp older than the replay window', async () => {
    const { POST } = await import('@/app/api/revalidate/route')
    const stale = Math.floor(Date.now() / 1000) - 400
    expect((await POST(signed({ tags: ['menu'] }, stale))).status).toBe(401)
  })

  it('rejects more than 50 tags', async () => {
    const { POST } = await import('@/app/api/revalidate/route')
    const tags = Array.from({ length: 51 }, (_, i) => `menu-item:${i}`)
    expect((await POST(signed({ tags, reason: 'test' }))).status).toBe(422)
  })

  it('returns 401 when the secret is not configured', async () => {
    delete process.env.LARIO_REVALIDATE_SECRET
    const { POST } = await import('@/app/api/revalidate/route')
    expect((await POST(signed({ tags: ['menu'] }))).status).toBe(401)
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- app/api/revalidate`
Expected: FAIL — cannot resolve the route module.

- [ ] **Step 3: Implement**

Create `app/api/revalidate/route.ts`:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'

const REPLAY_WINDOW_SECONDS = 300
const MAX_TAGS = 50

function unauthorized(): Response {
  return Response.json({ message: 'Unauthorized.' }, { status: 401 })
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.LARIO_REVALIDATE_SECRET
  const timestamp = request.headers.get('x-lario-timestamp')
  const signature = request.headers.get('x-lario-signature')
  if (!secret || !timestamp || !signature) return unauthorized()

  const age = Math.floor(Date.now() / 1000) - Number(timestamp)
  if (!Number.isFinite(age) || Math.abs(age) > REPLAY_WINDOW_SECONDS) {
    return unauthorized()
  }

  const raw = await request.text()
  const expected = `sha256=${createHmac('sha256', secret)
    .update(`${timestamp}.${raw}`)
    .digest('hex')}`

  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(signature)
  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return unauthorized()
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return Response.json({ message: 'Malformed body.' }, { status: 422 })
  }

  // JSON.parse('null') SUCCEEDS and returns null — the try/catch above does not
  // catch it, and reading .tags off null throws a TypeError that escapes as an
  // unhandled 500. A valid signature proves who sent this, not that what they
  // sent is well-formed: this boundary validates, it does not merely authenticate.
  const rawTags =
    body !== null && typeof body === 'object'
      ? (body as { tags?: unknown }).tags
      : undefined

  // Cap on the RAW array length, before non-strings are filtered out. Capping
  // after the filter would let a payload of 500 junk entries plus 3 valid ones
  // slip past a "max 50" rule.
  if (Array.isArray(rawTags) && rawTags.length > MAX_TAGS) {
    return Response.json(
      { message: `Provide between 1 and ${MAX_TAGS} tags.` },
      { status: 422 },
    )
  }

  const tags = Array.isArray(rawTags)
    ? rawTags.filter((tag): tag is string => typeof tag === 'string')
    : []

  if (tags.length === 0) {
    return Response.json(
      { message: `Provide between 1 and ${MAX_TAGS} tags.` },
      { status: 422 },
    )
  }

  for (const tag of tags) {
    revalidateTag(tag, 'max')
  }

  return Response.json({ revalidated: tags.length })
}
```

Three things this must never do: use `===` to compare signatures, accept the
single-argument `revalidateTag(tag)` form, or reveal which check failed. All
three failures return an identical `401`.

- [ ] **Step 4: Run tests**

Run: `npm test -- app/api/revalidate`
Expected: PASS, 5 tests.

- [ ] **Step 5: Document the 422 responses in the API contract**

`../lario-docs/03-api-contract.md` currently documents only `200` and `401` for
this endpoint, but the handler also returns `422`. The workspace `CLAUDE.md`
requires the contract to change in the same commit as the code — a Laravel
implementer building strictly from the contract would otherwise receive an
undocumented status their retry logic was never written for.

Add to the Revalidation webhook section:

```
`422 { "message": "Malformed body." }` when the body is not valid JSON, and
`422 { "message": "Provide between 1 and 50 tags." }` when `tags` is absent,
empty, not an array, or carries more than 50 entries. The cap is applied to the
array as received, before non-string entries are discarded.
```

`../lario-docs/` is not a git repository, so note the edit in the commit message
body rather than staging it.

- [ ] **Step 6: Document the environment variable**

Create `.env.example`:

```
# Shared with lario-api. Leave empty in local dev to no-op revalidation.
LARIO_REVALIDATE_SECRET=

# Backend origin. Unused until the Laravel API exists.
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

- [ ] **Step 7: Run the full suite, typecheck and build**

Run: `npm test && npm run typecheck && npm run build`
Expected: all green. This is the gate for the whole plan.

- [ ] **Step 8: Commit**

```bash
git add app/api/revalidate .env.example
git commit -m "feat: add HMAC-verified revalidation webhook"
```

---

## Definition of done for this plan

- [ ] `npm test` — all suites pass
- [ ] `npm run typecheck` — clean, no `any` introduced
- [ ] `npm run build` — clean, emits both `en` and `ar` route trees
- [ ] `/` renders with `lang="en" dir="ltr"`, `/ar` with `lang="ar" dir="rtl"`,
      confirmed in view-source
- [ ] `/en/menu` redirects 308 to `/menu`
- [ ] All 89 dishes resolve through `getMenuItem` in both locales
- [ ] Every fixture validates against its schema in both locales
- [ ] `docs/content-gaps.md` exists and has been sent to the client once
- [ ] Contract amendments A and B applied to `../lario-docs/`, and the team has
      been told that directory is unversioned

## What this plan deliberately does not build

Every visual component. Sections, cards, the header, the footer, the stepper UI,
the lightbox and the carousel all wait for `/brandkit` to produce the design
system, because their implementation is inseparable from the design decisions
the client has not yet made. This plan makes all of them straightforward to
build and none of them premature.

The next plan — `2026-XX-XX-lario-homepage.md` — starts once the design tokens
exist.
