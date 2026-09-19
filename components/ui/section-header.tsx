import type { ReactNode } from 'react'

/**
 * Section headers, in two deliberately different treatments.
 *
 * The CMS puts an eyebrow on ten of the eleven homepage sections. Rendering
 * all ten as the same wide-tracked micro-caps label is what makes a page read
 * as templated, so only four sections get that device (`label`). The rest set
 * the eyebrow as a display italic kicker at heading scale (`kicker`), which is
 * typography rather than a badge. No client copy is dropped either way.
 *
 * If you add a section, prefer `kicker`. Four `label` headers is the ceiling
 * for a page this length.
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
  const rule = light ? 'bg-gold-ink/40' : 'bg-gold/40'
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
          <p
            className={`flex items-center gap-4 text-[0.6875rem] tracking-[0.24em] uppercase ${accent} ${
              centred ? 'justify-center' : ''
            }`}
          >
            {centred ? (
              <span aria-hidden="true" className={`hidden h-px w-10 sm:block ${rule}`} />
            ) : null}
            {eyebrow}
            <span aria-hidden="true" className={`hidden h-px w-10 sm:block ${rule}`} />
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

      <h2
        id={headingId}
        className={`lr-display mt-4 max-w-[18ch] text-[clamp(2rem,1.2rem+3.4vw,4rem)] leading-[1.08] ${title}`}
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
