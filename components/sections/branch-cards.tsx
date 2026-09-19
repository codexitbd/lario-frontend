import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { SectionHeader } from '@/components/ui/section-header'
import {
  branchSchema,
  readList,
  readText,
  type Bag,
} from '@/components/sections/content'
import { groupOpeningHours } from '@/lib/hours'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * Reference 05-branch-cards: two panels meeting on a single hairline, the
 * hovered one taking width from the other as its photograph fades up.
 *
 * The expansion is `flex-grow` on the hovered panel alone — flex redistributes
 * the remainder, so the sibling shrinks without a `:has()` selector or any
 * JavaScript, and the pair still stacks to full width below `lg`.
 *
 * The panel is not itself a link. The branch name and the directions link are
 * separate targets, which keeps a map link from being nested inside a page
 * link and gives the keyboard two distinct, announceable destinations.
 */
export function BranchCards({
  section,
  locale,
  dict,
}: {
  section: { content: Bag }
  locale: Locale
  dict: Dictionary
}) {
  const { content } = section
  const branches = readList(content, 'branches', branchSchema)
  if (branches.length === 0) return null

  return (
    <section className="bg-ink pt-24 md:pt-36">
      <Container>
        <SectionHeader
          eyebrow={readText(content, 'eyebrow')}
          heading={readText(content, 'heading')}
          subheading={readText(content, 'subheading')}
          treatment="kicker"
          align="center"
        />
      </Container>

      <div className="mt-16 flex flex-col md:mt-20 lg:flex-row">
        {branches.map((branch, index) => {
          const schedule = groupOpeningHours(
            branch.opening_hours,
            locale,
            dict.branch.closed,
          )

          return (
            <article
              key={branch.slug}
              // `isolate` is load-bearing, not decoration. Without it this
              // article establishes no stacking context, so the -z-20
              // photograph below paints into the ROOT context's negative layer
              // — which is painted before the section's own background. The
              // image was rendering correctly and being covered by bg-ink, so
              // the hover looked like nothing but a width change.
              className={`group relative isolate flex min-h-[26rem] flex-1 basis-0 flex-col items-center justify-center overflow-hidden px-8 py-20 text-center transition-[flex-grow] duration-700 ease-brand lg:min-h-[34rem] lg:hover:grow-[1.35] ${
                index > 0
                  ? 'border-t border-gold/20 lg:border-t-0 lg:border-s lg:border-s-gold/20'
                  : ''
              }`}
            >
              <Figure
                src={branch.hero_image}
                slot={`branch.${branch.slug}`}
                alt=""
                shot={`${branch.name}. Entrance or exterior.`}
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="absolute inset-0 -z-20 opacity-0 transition-opacity duration-700 ease-brand group-hover:opacity-100"
                imageClassName="transition-transform duration-[1200ms] ease-brand group-hover:scale-105"
              />
              {/* The reveal is the point of this section, not the resize.
                  At rest the panel is flat ink, exactly as reference
                  05-branch-cards shows it. On hover it drops to 45% so the
                  photograph actually reads — at 70% the image was technically
                  present and visually absent, which left the interaction
                  looking like nothing but a width change. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-ink-raised transition-colors duration-700 group-hover:bg-ink/45"
              />
              {/* Copy runs the height of the panel, so it needs a scrim of its
                  own once the ground lightens. Fades in with the photograph. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[radial-gradient(78%_68%_at_50%_50%,color-mix(in_srgb,var(--color-ink)_72%,transparent)_0%,transparent_82%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              />

              <p className="text-[0.6875rem] tracking-[0.24em] text-gold uppercase">
                {branch.tagline}
              </p>

              <h3 className="lr-display mt-5 text-[clamp(1.875rem,1.2rem+2vw,3rem)] leading-[1.1] text-ivory">
                <Link
                  href={localePath(locale, branch.url)}
                  className="transition-colors duration-300 hover:text-gold-pale"
                >
                  {branch.name}
                </Link>
              </h3>

              <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-ivory-dim">
                {branch.address}
              </p>

              <h4 className="mt-9 text-[0.6875rem] tracking-[0.2em] text-ivory uppercase">
                {dict.branch.openingHours}
              </h4>
              <dl className="mt-3 flex flex-col gap-1 text-sm text-ivory-dim">
                {schedule.map((group) => (
                  <div key={group.days} className="flex justify-center gap-3">
                    <dt className="text-ivory">{group.days}</dt>
                    <dd>{group.hours}</dd>
                  </div>
                ))}
              </dl>

              {branch.google_maps_url ? (
                <a
                  href={branch.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-9 border-b border-gold/40 pb-1 text-[0.8125rem] font-medium tracking-[0.16em] text-gold uppercase transition-colors duration-300 hover:border-gold hover:text-gold-pale"
                >
                  {dict.branch.getDirections}
                </a>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
