import { cacheLife, cacheTag } from 'next/cache'
import { getTestimonials as getTestimonialsImpl } from '@/lib/api/testimonials.impl'
import { tags } from '@/lib/cache-tags'
import type { Locale } from '@/lib/i18n/config'
import type { Testimonial } from '@/lib/schemas'

export async function getTestimonials(
  locale: Locale,
  limit?: number,
): Promise<Testimonial[]> {
  'use cache'
  cacheTag(tags.testimonials())
  cacheLife('max')

  return getTestimonialsImpl(locale, limit)
}
