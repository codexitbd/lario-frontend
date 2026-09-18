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
    expect(pages.map((p) => p.slug).sort()).toEqual([
      'contact',
      'privacy-policy',
      'terms-and-conditions',
    ])
  })
})
