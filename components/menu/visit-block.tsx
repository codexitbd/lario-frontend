import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { Figure } from '@/components/ui/figure'
import { groupOpeningHours } from '@/lib/hours'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Branch, Settings } from '@/lib/schemas'

/**
 * The closing block of the menu page, from the reference's "connect with us"
 * composition: an arch-framed interior photograph with a second frame
 * overlapping its lower corner, and a column of labelled details beside it.
 *
 * The arch is the site's ONE documented photographic mask, shared with the dish
 * cards in the grid above — the same motif at two scales. Layout corners stay
 * square. See components/menu/dish-card.tsx for the rule.
 *
 * Details are real data, not decoration: hours come from each branch's own
 * opening_hours rows through the same grouper the branch cards use, and the
 * phone and email come from settings. The reference shows one venue's details;
 * La Rio has two, so hours and addresses are listed per branch rather than
 * flattened into a single set that would be wrong for one of them.
 */
export function VisitBlock({
  branches,
  settings,
  locale,
  dict,
}: {
  branches: Branch[]
  settings: Settings
  locale: Locale
  dict: Dictionary
}) {
  if (branches.length === 0) return null

  return (
    <section className="bg-bone py-24 md:py-32">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="lr-reveal relative">
            {/* Arch: square at the base, semicircular at the head. */}
            <Figure
              src={null}
              slot="menu.visit"
              alt=""
              shot="The dining room, from the entrance."
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="relative aspect-[3/4] w-full [border-radius:999px_999px_0_0]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-3 border border-gold-ink/30 [border-radius:999px_999px_0_0]"
            />
            {/* The overlapping inset, offset past the arch's lower corner. */}
            <Figure
              src={null}
              slot="menu.visit.inset"
              alt=""
              shot="Plating at the pass."
              sizes="(min-width: 1024px) 18vw, 40vw"
              className="absolute end-0 bottom-[-8%] aspect-[4/3] w-[44%] translate-x-[8%] border-4 border-bone"
            />
          </div>

          <div className="lr-reveal">
            <h2 className="lr-display text-[clamp(2rem,1.3rem+2.4vw,3.25rem)] leading-[1.1] tracking-[0.04em] text-ink uppercase">
              {dict.menu.visitUs}
            </h2>

            <dl className="mt-12 flex flex-col gap-10">
              <div>
                <dt className="text-[0.6875rem] tracking-[0.24em] text-gold-ink uppercase">
                  {dict.branch.openingHours}
                </dt>
                <dd className="mt-4 flex flex-col gap-3">
                  {branches.map((branch) => (
                    <span key={branch.slug} className="block text-sm">
                      <span className="text-ink">{branch.name}</span>
                      {groupOpeningHours(
                        branch.opening_hours,
                        locale,
                        dict.branch.closed,
                      ).map((group) => (
                        <span
                          key={group.days}
                          className="mt-1 block text-ink-soft"
                        >
                          {group.days} {group.hours}
                        </span>
                      ))}
                    </span>
                  ))}
                </dd>
              </div>

              <div>
                <dt className="text-[0.6875rem] tracking-[0.24em] text-gold-ink uppercase">
                  {dict.nav.contact}
                </dt>
                <dd className="mt-4 flex flex-col gap-1 text-sm text-ink-soft">
                  <a
                    href={`mailto:${settings.contact.email}`}
                    className="transition-colors duration-300 hover:text-gold-ink"
                  >
                    {settings.contact.email}
                  </a>
                  <a
                    href={`tel:${settings.contact.phone}`}
                    dir="ltr"
                    className="transition-colors duration-300 hover:text-gold-ink"
                  >
                    {settings.contact.phone}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-[0.6875rem] tracking-[0.24em] text-gold-ink uppercase">
                  {dict.nav.branches}
                </dt>
                <dd className="mt-4 flex flex-col gap-3 text-sm text-ink-soft">
                  {branches.map((branch) => (
                    <span key={branch.slug} className="block">
                      {branch.address}
                      {branch.google_maps_url ? (
                        <a
                          href={branch.google_maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ms-3 inline-block border-b border-gold-ink/40 pb-0.5 text-[0.625rem] tracking-[0.18em] text-gold-ink uppercase transition-colors duration-300 hover:border-gold-ink hover:text-ink"
                        >
                          {dict.branch.getDirections}
                        </a>
                      ) : null}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>

            <Cta
              href={localePath(locale, '/reservation')}
              variant="outline"
              tone="light"
              className="mt-12"
            >
              {dict.actions.reserve}
            </Cta>
          </div>
        </div>
      </Container>
    </section>
  )
}
