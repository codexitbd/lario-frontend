import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { readText, type Bag } from '@/components/sections/content'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Branch } from '@/lib/schemas'

/**
 * No reference image for this section either. It closes the page on the same
 * language as the hero opened it — centred, gold rule above, Bodoni heading,
 * the ivory CTA — so the scroll reads as a round trip rather than as a page
 * that simply stops.
 *
 * Beneath the primary action sit branch-preselect deep links (spec section 6).
 * `payload.default_branch` picks which branch the main button carries when the
 * client sets one; today it is null, so the button goes to the unfiltered
 * form and the two links below it do the preselecting.
 *
 * `branches` is passed in rather than read from the branch_cards section: a
 * section must not depend on another section being present on the page.
 */
export function ReservationCta({
  section,
  locale,
  branches,
}: {
  section: { payload: Bag; content: Bag }
  locale: Locale
  branches: Branch[]
}) {
  const { payload, content } = section
  const defaultBranch = readText(payload, 'default_branch')
  const href = defaultBranch
    ? `/reservation?branch=${defaultBranch}`
    : '/reservation'

  return (
    <section className="relative isolate overflow-hidden border-t border-gold/25 bg-ink py-24 md:py-36">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,color-mix(in_srgb,var(--color-gold)_9%,transparent)_0%,transparent_70%)]"
      />

      <Container className="lr-reveal flex flex-col items-center text-center">
        <h2 className="lr-display max-w-[16ch] text-[clamp(2.25rem,1.3rem+3.6vw,4.25rem)] leading-[1.06] text-ivory">
          {readText(content, 'heading')}
        </h2>
        <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-ivory-dim md:text-lg">
          {readText(content, 'subheading')}
        </p>

        <Cta href={localePath(locale, href)} variant="solid" className="mt-10">
          {readText(content, 'cta_label')}
        </Cta>

        {branches.length > 0 ? (
          <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {branches.map((branch) => (
              <li key={branch.slug}>
                <Link
                  href={localePath(
                    locale,
                    `/reservation?branch=${branch.slug}`,
                  )}
                  className="border-b border-gold/30 pb-1 text-sm text-gold transition-colors duration-300 hover:border-gold hover:text-gold-pale"
                >
                  {branch.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  )
}
