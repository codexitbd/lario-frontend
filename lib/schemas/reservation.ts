import { z } from 'zod'
import { localeSchema } from '@/lib/schemas/common'
import type { Locale } from '@/lib/i18n/config'

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

/**
 * Newsletter signup. Deliberately two fields: every extra input on a footer
 * form costs completions, and a mailing list needs an address and a language to
 * send in, nothing else. `locale` drives both the 422 message language and
 * which list the backend files the address under.
 *
 * Consent is captured by submission against the visible notice next to the
 * field rather than a checkbox, which is the standard pattern and is what the
 * contract records.
 */
export const newsletterSchema = z.object({
  email: z.email(),
  locale: localeSchema,
})
export type NewsletterInput = z.infer<typeof newsletterSchema>

// Numerals in the Arabic strings are LATIN (1, 20, 1000), not Arabic-Indic
// (١, ٢٠, ١٠٠٠). Decision D16 and lib/format.ts's NUMERAL_SYSTEM = 'latn' make
// Latin digits the sitewide rule for Arabic; a validation message rendering
// "١ و٢٠" next to a form that displays "1" and "20" is the same inconsistency
// D16 exists to avoid. Flip both together if the client chooses Arabic-Indic.
//
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
    party_size: 'اختر عدد ضيوف بين 1 و20.',
    reserved_for: 'اختر تاريخاً ووقتاً خلال التسعين يوماً القادمة، مع تحديد المنطقة الزمنية.',
    occasion: 'اختر إحدى المناسبات المتاحة.',
    seating_preference: 'اختر أحد خيارات الجلوس المتاحة.',
    notes: 'يجب ألا تتجاوز الملاحظات 1000 حرف.',
    consent: 'يرجى الموافقة على التواصل معك بخصوص هذا الطلب.',
    message: 'أدخل رسالة بين 10 و2000 حرف.',
    subject: 'يجب ألا يتجاوز الموضوع 200 حرف.',
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
