import type { CSSProperties } from 'react'
import {
  FlameIcon,
  GlobeIcon,
  MapPinIcon,
  UsersIcon,
} from '@phosphor-icons/react/ssr'
import type { Icon } from '@phosphor-icons/react'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import {
  iconPointSchema,
  readImage,
  readList,
  readText,
  type Bag,
} from '@/components/sections/content'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'

/**
 * Reference 03-why-lario: two photographs pinned to opposite edges of the
 * viewport at different heights, with the argument centred between them.
 *
 * The previous build put one image in a container column and the icon list
 * where the second photograph belongs, which flattened the reference's
 * three-zone composition into an ordinary split. The images here are
 * absolutely positioned and deliberately bleed off both edges; only the centre
 * column is contained.
 *
 * The heading is set in caps with wide tracking, echoing the reference's
 * treatment in our own display face rather than importing a second one. In
 * Arabic both caps and tracking are inert (see globals.css), which is correct —
 * the device is Latin-only.
 */
const ICONS: Record<string, Icon> = {
  flame: FlameIcon,
  globe: GlobeIcon,
  'map-pin': MapPinIcon,
  users: UsersIcon,
}

export function WhyLario({
  section,
  locale,
}: {
  section: { payload: Bag; content: Bag }
  locale: Locale
}) {
  const { payload, content } = section
  const points = readList(content, 'points', iconPointSchema)

  return (
    <section className="relative isolate overflow-hidden bg-emerald py-24 md:py-40">
      {/* Edge-pinned, different heights. Hidden below lg, where they stack
          into the flow instead. */}
      <Figure
        src={readImage(payload, 'image')}
        slot="home.why-lario"
        alt=""
        shot="The room and the fire. Atmosphere, mid-service."
        sizes="24vw"
        className="absolute start-0 top-[6%] -z-10 hidden aspect-[3/4] w-[24%] lg:block"
      />
      <Figure
        src={readImage(payload, 'image_secondary')}
        slot="home.why-lario.secondary"
        alt=""
        shot="The open kitchen, seen from the room."
        sizes="24vw"
        className="absolute end-0 bottom-[4%] -z-10 hidden aspect-[4/3] w-[24%] lg:block"
      />

      <Container>
        {/* max-w-xl, not 2xl: the two edge photographs each take 24% of the
            viewport, and a wider column runs the icon list underneath them. */}
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <p className="lr-reveal lr-display pb-1 text-xl leading-[1.15] text-gold italic md:text-2xl">
            {readText(content, 'eyebrow')}
          </p>

          <h2
            className="lr-reveal lr-display mt-5 text-[clamp(1.75rem,1rem+2.6vw,3rem)] leading-[1.25] tracking-[0.06em] text-ivory uppercase"
            style={{ '--i': 1 } as CSSProperties}
          >
            {readText(content, 'heading')}
          </h2>

          <p
            className="lr-reveal mt-6 max-w-[46ch] text-base leading-relaxed text-ivory-dim md:text-lg"
            style={{ '--i': 2 } as CSSProperties}
          >
            {readText(content, 'subheading')}
          </p>

          <span
            aria-hidden="true"
            className="mt-10 block h-px w-16 bg-gold/50"
          />

          <ul
            className="lr-reveal mt-10 grid w-full gap-x-10 gap-y-5 sm:grid-cols-2"
            style={{ '--i': 3 } as CSSProperties}
          >
            {points.map((point) => {
              const Glyph = ICONS[point.icon]
              return (
                <li
                  key={point.label}
                  className="flex items-start gap-3 text-start"
                >
                  {Glyph ? (
                    <Glyph
                      aria-hidden="true"
                      weight="light"
                      className="mt-0.5 size-5 shrink-0 text-gold"
                    />
                  ) : null}
                  <span className="text-sm leading-relaxed text-ivory-dim">
                    {point.label}
                  </span>
                </li>
              )
            })}
          </ul>

          <Cta
            href={localePath(locale, '/reservation')}
            variant="outline"
            className="lr-reveal mt-12"
          >
            {readText(content, 'cta_label')}
          </Cta>
        </div>

        {/* Below lg the two edge photographs have nowhere to bleed to, so they
            follow the copy as a plain pair rather than disappearing. */}
        <div className="mt-14 grid grid-cols-2 gap-4 lg:hidden">
          <Figure
            src={readImage(payload, 'image')}
            slot="home.why-lario"
            alt=""
            shot="The room and the fire."
            sizes="50vw"
            className="relative aspect-[3/4] w-full"
          />
          <Figure
            src={readImage(payload, 'image_secondary')}
            slot="home.why-lario.secondary"
            alt=""
            shot="The open kitchen."
            sizes="50vw"
            className="relative mt-8 aspect-[3/4] w-full"
          />
        </div>
      </Container>
    </section>
  )
}
