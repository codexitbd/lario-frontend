import { describe, expect, it } from 'vitest'
import branches from '@/content/branches.json'
import settings from '@/content/settings.json'
import testimonials from '@/content/testimonials.json'
import pages from '@/content/pages.json'
// Cached wrapper `@/lib/api/settings` throws under Vitest — see lib/api/menu.test.ts.
import { getSettings } from '@/lib/api/settings.impl'
import { settingsSchema, testimonialSchema } from '@/lib/schemas'
import { LOCALES } from '@/lib/i18n/config'

describe('settings fixture', () => {
  // The fixture is SOURCE shape, not wire shape — seo_defaults.title_suffix
  // holds every locale and the resolver picks one. Parse what getSettings
  // returns, which is what a consumer actually receives.
  it('resolves to the contract shape in both locales', () => {
    for (const locale of LOCALES) {
      expect(() => settingsSchema.parse(getSettings(locale))).not.toThrow()
    }
  })

  it('carries a title suffix per locale, each in its own script', () => {
    for (const locale of LOCALES) {
      expect(settings.seo_defaults.title_suffix[locale].length).toBeGreaterThan(0)
    }
    // A single Latin suffix put "المقبلات الباردة | La Rio Riyadh" — two
    // scripts in one <title> — on every Arabic page. D16 and lib/format.ts's
    // NUMERAL_SYSTEM = 'latn' govern numerals, not brand copy: Arabic pages get
    // Arabic brand text.
    expect(settings.seo_defaults.title_suffix.ar).not.toMatch(/[A-Za-z]/)
  })

  it('advertises no default OG image until one is supplied', () => {
    // content-gap item 10. A URL that 404s is worse than none: crawlers cache
    // the failure and the card renders broken.
    expect(settings.seo_defaults.og_image).toBeNull()
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
        const labels = branch.translations[locale].facilities_labels as Record<
          string,
          string
        >
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
    for (const slug of ['contact', 'privacy-policy', 'terms-and-conditions']) {
      expect(pages.map((p) => p.slug)).toContain(slug)
    }
  })

  // /menu is a page row so the menu index has an editable SEO record from the
  // start, which the brief requires of every Phase 1-3 resource.
  it('carries the menu landing row with its own meta description', () => {
    const menu = pages.find((p) => p.slug === 'menu')
    expect(menu?.template).toBe('menu')
    for (const locale of LOCALES) {
      const t = menu?.translations[locale] as { description?: string }
      expect(t?.description?.length ?? 0).toBeGreaterThan(50)
    }
  })

  it('gives every page a title and heading in both locales', () => {
    for (const page of pages) {
      for (const locale of LOCALES) {
        const t = page.translations[locale] as {
          title: string
          heading: string
        }
        expect(t.title.length, `${page.slug} ${locale} title`).toBeGreaterThan(0)
        expect(t.heading.length, `${page.slug} ${locale} heading`).toBeGreaterThan(0)
      }
    }
  })
})

describe('typographic house rules across every fixture', () => {
  // The em dash and the en dash are both banned in visible copy. They are not
  // a style preference here: the Arabic faces this site ships do not carry
  // them, so a dash inside an Arabic string falls back to a different font
  // mid-sentence and breaks the line's colour. The Latin copy follows the same
  // rule so the two locales stay in step. Use a period, a comma or a plain
  // hyphen. lib/format.ts joins time ranges with a hyphen for this reason.
  const FIXTURES = import.meta.glob('/content/**/*.json', {
    eager: true,
    query: '?raw',
    import: 'default',
  }) as Record<string, string>

  it('finds at least one fixture to check', () => {
    expect(Object.keys(FIXTURES).length).toBeGreaterThan(0)
  })

  it.each(Object.keys(FIXTURES))('%s carries no em or en dash', (path) => {
    const offending = [...FIXTURES[path].matchAll(/.{0,40}[–—].{0,40}/g)]
      .map((match) => match[0])
      .slice(0, 5)
    expect(offending, offending.join('\n')).toEqual([])
  })
})
