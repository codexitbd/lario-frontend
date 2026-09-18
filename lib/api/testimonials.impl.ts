import testimonialsFixture from '@/content/testimonials.json'
import { resolveTranslation } from '@/lib/api/resolve'
import type { Locale } from '@/lib/i18n/config'
import type { Testimonial } from '@/lib/schemas'

type TestimonialTranslation = { author_title: string; body: string }

// content/testimonials.json is SOURCE shape: is_featured, sort_order,
// branch_slug and a per-locale translations map. testimonialSchema is the wire
// shape — author_name, author_title, body, rating, source — so the ordering and
// selection below happen here, once, rather than in every section that shows a
// review.
//
// Featured first, then sort_order. is_featured exists precisely so a limited
// homepage strip shows the reviews the client chose rather than the first N
// rows: with limit 6 of 12, sort_order alone would surface a 3-star review
// ahead of three featured 5-star ones.
export function getTestimonials(locale: Locale, limit?: number): Testimonial[] {
  const ordered = testimonialsFixture
    .slice()
    .sort(
      (a, b) =>
        Number(b.is_featured) - Number(a.is_featured) ||
        a.sort_order - b.sort_order,
    )
    .map((entry): Testimonial => {
      const t = resolveTranslation(
        entry.translations as Partial<Record<Locale, TestimonialTranslation>>,
        locale,
      )
      return {
        author_name: entry.author_name,
        author_title: t.author_title,
        body: t.body,
        rating: entry.rating,
        source: entry.source as Testimonial['source'],
      }
    })

  // An absent or non-positive limit means "all" — a section that forgets to
  // set testimonial_limit should render every review, not none.
  return limit && limit > 0 ? ordered.slice(0, limit) : ordered
}
