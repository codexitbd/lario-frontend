import { cacheLife } from 'next/cache'
import { z } from 'zod'
import { apiGet } from '@/lib/api/client'
import type { Locale } from '@/lib/i18n/config'
import { type Testimonial, testimonialSchema } from '@/lib/schemas'

export async function getTestimonials(locale: Locale, limit?: number): Promise<Testimonial[]> {
  'use cache'
  cacheLife('max')

  return apiGet('/testimonials', z.array(testimonialSchema), { locale, query: { limit } })
}
