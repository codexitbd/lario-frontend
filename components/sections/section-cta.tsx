import { Cta } from '@/components/ui/cta'
import { type Bag, readLink } from '@/components/sections/content'
import type { Locale } from '@/lib/i18n/config'

/**
 * A section button whose target the admin chooses. Renders nothing when the
 * admin removed the link or left the label empty.
 */
export function SectionCta({
  payload,
  linkKey = 'cta',
  label,
  locale,
  fallback = null,
  ...cta
}: {
  payload: Bag
  linkKey?: string
  label: string
  locale: Locale
  fallback?: string | null
  variant?: 'solid' | 'outline' | 'quiet'
  tone?: 'dark' | 'light'
  className?: string
}) {
  const link = readLink(payload, linkKey, locale, fallback)
  if (!link || !label) return null

  return (
    <Cta href={link.href} newTab={link.newTab} {...cta}>
      {label}
    </Cta>
  )
}
