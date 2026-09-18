import { describe, expect, it } from 'vitest'
// Cached wrapper `@/lib/api/testimonials` throws under Vitest — see lib/api/menu.test.ts.
import { getTestimonials } from '@/lib/api/testimonials.impl'
import testimonialsFixture from '@/content/testimonials.json'
import { testimonialSchema } from '@/lib/schemas'
import { LOCALES } from '@/lib/i18n/config'

describe('getTestimonials', () => {
  it('satisfies the contract shape in both locales', () => {
    for (const locale of LOCALES) {
      for (const entry of getTestimonials(locale)) {
        expect(() => testimonialSchema.parse(entry)).not.toThrow()
      }
    }
  })

  it('returns every review when no limit is given', () => {
    expect(getTestimonials('en')).toHaveLength(testimonialsFixture.length)
  })

  it('honours a limit', () => {
    expect(getTestimonials('en', 6)).toHaveLength(6)
  })

  it('puts featured reviews first, then sort_order', () => {
    const featuredNames = testimonialsFixture
      .filter((t) => t.is_featured)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => t.author_name)

    const head = getTestimonials('en')
      .slice(0, featuredNames.length)
      .map((t) => t.author_name)

    expect(head).toEqual(featuredNames)
  })

  it('resolves the requested locale', () => {
    const [first] = getTestimonials('ar')
    expect(first.body).toBe(
      'الأسادو يستحق الانتظار. جلسنا قرب الشواية وشاهدنا معظم التحضير أمامنا.',
    )
  })
})
