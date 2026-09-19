import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Every call to action on the site. Three weights, two tones, one shape.
 *
 * Corners are square everywhere — the reference set is square, and mixing a
 * pill into a square layout is the fastest way to make a page look assembled
 * rather than designed. Do not add a radius here.
 *
 * `tone` follows the ground the CTA sits on, because the page alternates bone
 * and emerald sections. Gold at --color-gold is 9.2:1 on ink but only 2.4:1 on
 * bone, so the light tone swaps in --color-gold-ink (5.7:1). Every combination
 * below passes AA for body text, not just for large text.
 */
type Variant = 'solid' | 'outline' | 'quiet'
type Tone = 'dark' | 'light'

const VARIANTS: Record<Tone, Record<Variant, string>> = {
  dark: {
    solid: 'bg-ivory text-ink px-8 py-4 hover:bg-gold-pale active:translate-y-px',
    outline:
      'border border-gold/60 text-gold px-8 py-4 hover:border-gold hover:bg-gold/10 active:translate-y-px',
    quiet:
      'text-gold pb-1 border-b border-gold/40 hover:border-gold hover:text-gold-pale',
  },
  light: {
    solid: 'bg-ink text-bone px-8 py-4 hover:bg-emerald active:translate-y-px',
    outline:
      'border border-gold-ink/50 text-gold-ink px-8 py-4 hover:border-gold-ink hover:bg-gold-ink/10 active:translate-y-px',
    quiet:
      'text-gold-ink pb-1 border-b border-gold-ink/40 hover:border-gold-ink hover:text-ink',
  },
}

export function Cta({
  href,
  children,
  variant = 'solid',
  tone = 'dark',
  className = '',
}: {
  href: string
  children: ReactNode
  variant?: Variant
  tone?: Tone
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center whitespace-nowrap text-[0.8125rem] font-medium tracking-[0.16em] uppercase transition-[background-color,border-color,color,transform] duration-300 ease-brand ${VARIANTS[tone][variant]} ${className}`}
    >
      {children}
    </Link>
  )
}
