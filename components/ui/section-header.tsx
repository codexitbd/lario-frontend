import type { ReactNode } from 'react'

/**
 * Section headers, in two deliberately different treatments.
 *
 * The CMS puts an eyebrow on ten of the eleven homepage sections. A wide-tracked
 * micro-caps label above every heading is the most saturated AI section-scaffold
 * there is, so NO section heading uses that device any more: every eyebrow sets
 * as a display italic kicker at heading scale (`kicker`), which is typography
 * rather than a badge. No client copy is dropped.
 *
 * `label` still exists for the rare case where an eyebrow genuinely is a small
 * functional label rather than a voice line, but nothing on the site uses it
 * today, and it no longer carries flanking hairlines. Prefer `kicker`.
 */
export function SectionHeader({
  eyebrow,
  heading,
  subheading,
  treatment = 'kicker',
  align = 'center',
  tone = 'dark',
  headingId,
  className = '',
  children,
}: {
  eyebrow?: string
  heading: string
  subheading?: string
  treatment?: 'label' | 'kicker'
  align?: 'center' | 'start'
  /** Which ground the section sits on. Drives the whole text ramp. */
  tone?: 'dark' | 'light'
  headingId?: string
  className?: string
  children?: ReactNode
}) {
  const centred = align === 'center'
  const light = tone === 'light'
  const accent = light ? 'text-gold-ink' : 'text-gold'
  const title = light ? 'text-ink' : 'text-ivory'
  const body = light ? 'text-ink-soft' : 'text-ivory-dim'

  return (
    <header
      className={`lr-reveal flex flex-col ${
        centred ? 'items-center text-center' : 'items-start text-start'
      } ${className}`}
    >
      {eyebrow ? (
        treatment === 'label' ? (
          // No flanking hairlines. A tracked-caps label with a rule either
          // side is the most saturated AI section-scaffold there is; the label
          // alone still does the job on the four sections that keep it.
          <p
            className={`text-[0.6875rem] tracking-[0.24em] uppercase ${accent}`}
          >
            {eyebrow}
          </p>
        ) : (
          // pb-1 and the loosened leading keep italic descenders (y, g, p) off
          // the heading below them.
          <p
            className={`lr-display pb-1 text-xl leading-[1.15] italic md:text-2xl ${accent}`}
          >
            {eyebrow}
          </p>
        )
      ) : null}

      {/* Capped at 3.25rem, down from 4rem. This is a restaurant: a headline
          that outweighs the plate beside it is the wrong hierarchy. */}
      <h2
        id={headingId}
        className={`lr-display lr-unmask mt-4 max-w-[18ch] text-[clamp(1.875rem,1.1rem+2.6vw,3.25rem)] leading-[1.08] text-balance ${title}`}
      >
        {heading}
      </h2>

      {subheading ? (
        <p
          className={`mt-5 max-w-[52ch] text-base leading-relaxed md:text-lg ${body} ${
            centred ? 'mx-auto' : ''
          }`}
        >
          {subheading}
        </p>
      ) : null}

      {children}
    </header>
  )
}
