import { z } from 'zod'
import { localeSchema } from '@/lib/schemas/common'

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
  reserved_for: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), 'invalid date')
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
