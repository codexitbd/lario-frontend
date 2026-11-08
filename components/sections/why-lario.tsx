import type { CSSProperties } from 'react'
import {
  FlameIcon,
  GlobeIcon,
  MapPinIcon,
  UsersIcon,
} from '@phosphor-icons/react/ssr'
import type { Icon } from '@phosphor-icons/react'
import { Container } from '@/components/ui/container'
import { SectionCta } from '@/components/sections/section-cta'
import { Figure } from '@/components/ui/figure'
import { SectionHeader } from '@/components/ui/section-header'
import {
  iconPointSchema,
  readImage,
  readList,
  readText,
  type Bag,
} from '@/components/sections/content'
import type { Locale } from '@/lib/i18n/config'

/**
 * Why La Rio, rebuilt 2026-09-30 at client request. Reference 03-why-lario is
 * superseded (design/NOTES.md).
 *
 * What the client called dull was the section-scaffold template: a centred
 * eyebrow, a caps heading, a hairline, a 2x2 icon-bullet list and a CTA, sat on
 * a full emerald field with two photographs drifting on the edges. Four short
 * claims were footnotes under a heading, and the colour was doing the work the
 * composition should have.
 *
 * Now the four claims ARE the composition. A ledger and a slab:
 *
 *   the ledger   the four points set large in Bodoni, one to a row, on
 *                hairlines. Hover a row and a gold line draws across it from the
 *                start edge (`.lr-why-row`, globals.css).
 *   the slab     ONE photograph beside the ledger, with the house inset frame.
 *                The frame warms to gold whenever a ledger row is hovered, so
 *                the claim and the room answer each other. That link is the
 *                whole reason the frame here has a hover state when static
 *                frames elsewhere do not.
 *
 * The slab used to bleed off the end edge of the screen. The client asked for
 * both columns inside the page container (QA round 2, A-06): on a 1920px
 * screen the bleed left the copy centred and a wide empty band on the start
 * side.
 *
 * Ink ground, not emerald. "Not over-coloured" was the brief, and a flat brand
 * field is exactly what the design system warns against as a default; emerald
 * stays on the page as the testimonials moment and nowhere else. Interest comes
 * from scale, photography and one motivated interaction, with gold as the only
 * accent.
 *
 * Motion is the site's own materials: `.lr-focus` on the slab, which is the one
 * large feature photograph the guide reserves it for, `.lr-unmask` on the
 * heading through SectionHeader, and a staggered `.lr-reveal` down the rows.
 *
 * The old component also read `image_secondary`, a field the fixture has never
 * carried. One frame shown with conviction beats two floating ones, and the
 * off-contract read goes with it.
 *
 * ONE Figure for both layouts, placed by named grid areas: below lg the photo
 * sits in flow between the header and the ledger at 4:3, at lg it takes the end
 * column at the full height of the copy. The first cut rendered two Figures,
 * one `hidden lg:block`, on the assumption that display:none would spare the
 * phone the request. It does not: an <img> in a hidden subtree still loads, and
 * the phone was fetching the photograph twice at two sizes.
 */
const ICONS: Record<string, Icon> = {
  flame: FlameIcon,
  globe: GlobeIcon,
  'map-pin': MapPinIcon,
  users: UsersIcon,
}

const SHOT = 'The room and the fire. Atmosphere, mid-service.'

export function WhyLario({
  section,
  locale,
}: {
  section: { payload: Bag; content: Bag }
  locale: Locale
}) {
  const { payload, content } = section
  const points = readList(content, 'points', iconPointSchema)
  const image = readImage(payload, 'image')

  const ledger = (
    <ul className="mt-12 md:mt-14">
      {points.map((point, index) => {
        const Glyph = ICONS[point.icon]
        return (
          <li
            key={point.label}
            style={{ '--i': index } as CSSProperties}
            className="lr-reveal lr-why-row group relative flex items-center gap-5 border-t border-ivory/15 py-5 md:gap-7 md:py-6"
          >
            {Glyph ? (
              <Glyph
                aria-hidden="true"
                weight="thin"
                className="size-6 shrink-0 text-gold/60 transition-colors duration-500 ease-brand group-hover:text-gold md:size-7"
              />
            ) : null}
            <span className="lr-display text-xl leading-[1.2] text-ivory-dim transition-colors duration-500 ease-brand group-hover:text-ivory md:text-2xl lg:text-[1.75rem]">
              {point.label}
            </span>
          </li>
        )
      })}
    </ul>
  )

  return (
    <section className="lr-why relative isolate overflow-hidden bg-ink py-24 md:py-32 lg:py-36">
      <Container className="grid [grid-template-areas:'head'_'photo'_'body'] lg:grid-cols-2 lg:gap-x-16 lg:[grid-template-areas:'head_photo'_'body_photo'] xl:gap-x-24">
        <SectionHeader
          eyebrow={readText(content, 'eyebrow')}
          heading={readText(content, 'heading')}
          subheading={readText(content, 'subheading')}
          treatment="kicker"
          align="start"
          className="[grid-area:head]"
        />

        {/* The photograph: in flow below lg, the end column at lg. See the
            note above on why it is one element. */}
        <div className="relative mt-12 aspect-[4/3] w-full [grid-area:photo] lg:mt-0 lg:aspect-auto lg:min-h-[28rem]">
          <Figure
            src={image}
            mobileSrc={readImage(payload, 'mobile_image')}
            desktopFrom={1024}
            slot="home.why-lario"
            alt=""
            shot={SHOT}
            sizes="(min-width: 87.5rem) 41rem, (min-width: 64rem) 45vw, 100vw"
            className="lr-focus absolute inset-0"
          />
          <span
            aria-hidden="true"
            className="lr-why-frame pointer-events-none absolute inset-3 border border-ivory/25 transition-colors duration-700 ease-brand lg:inset-4"
          />
        </div>

        <div className="[grid-area:body]">
          {ledger}

          <SectionCta
            payload={payload}
            locale={locale}
            fallback="/reservation"
            label={readText(content, 'cta_label')}
            variant="outline"
            className="lr-reveal mt-12 md:mt-14"
          />
        </div>
      </Container>
    </section>
  )
}
