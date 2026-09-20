import Image from 'next/image'
import Link from 'next/link'
import goldenLogo from '@/public/golden-logo.png'
import originalLogo from '@/public/original-logo.png'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'

/**
 * The brand mark. The REAL logo, not type standing in for it.
 *
 * Two files ship, and they are the same artwork in two colourways — identical
 * 2630x1284 canvas, identical alpha mask, both on a transparent ground
 * (measured). They exist precisely so the mark can sit on either kind of
 * surface:
 *
 *   golden-logo.png    58% rgb(240,192,96), which is --color-gold to within a
 *                      few points. The single-colour lockup, for dark grounds.
 *   original-logo.png  emerald + gold, the full-colour lockup, for bone.
 *
 * An earlier pass set the brand in Bodoni instead, on the belief that the logo
 * was emerald-on-white and would disappear on dark chrome. That was wrong on
 * both counts: the ground is transparent, and the gold lockup is made for
 * exactly this. Do not reintroduce a typographic wordmark.
 *
 * The artwork occupies 2480x1010 inside the canvas, so roughly 12% of the
 * rendered height is transparent padding. That is left alone: it gives the mark
 * optical breathing room against a tight header bar, and cropping the asset
 * would mean shipping a third file.
 */
export function Wordmark({
  locale,
  siteName,
  tone = 'dark',
  className = '',
  priority = false,
  onClick,
}: {
  locale: Locale
  siteName: string
  /** The ground the mark sits ON: `dark` takes the gold lockup, `light` the
      full-colour one. */
  tone?: 'dark' | 'light'
  className?: string
  /** Only the header mark is above the fold; preloading the footer's would
      compete with the hero for bandwidth. */
  priority?: boolean
  /** The drawer closes on it: tapping home while already on home navigates
      nowhere, so the sheet would stay open over the page. */
  onClick?: () => void
}) {
  return (
    <Link
      href={localePath(locale, '/')}
      onClick={onClick}
      aria-label={siteName}
      className={`inline-block shrink-0 transition-opacity duration-500 ease-brand hover:opacity-80 ${className}`}
    >
      <Image
        src={tone === 'light' ? originalLogo : goldenLogo}
        alt={siteName}
        priority={priority}
        sizes="200px"
        className="h-full w-auto object-contain"
      />
    </Link>
  )
}
