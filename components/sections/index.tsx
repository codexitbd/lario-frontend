import { BranchCards } from '@/components/sections/branch-cards'
import { ChefStory } from '@/components/sections/chef-story'
import { Faq } from '@/components/sections/faq'
import { FeaturedDishes } from '@/components/sections/featured-dishes'
import { GalleryStrip } from '@/components/sections/gallery-strip'
import { Hero } from '@/components/sections/hero'
import { Intro } from '@/components/sections/intro'
import { PrivateEvents } from '@/components/sections/private-events'
import { ReservationCta } from '@/components/sections/reservation-cta'
import { Testimonials } from '@/components/sections/testimonials'
import { WhyLario } from '@/components/sections/why-lario'
import { readList, readText, testimonialSchema } from '@/components/sections/content'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Branch, PageSection } from '@/lib/schemas'

export type SectionContext = {
  locale: Locale
  dict: Dictionary
  branches: Branch[]
}

/**
 * Maps a CMS section row to its component.
 *
 * An unrecognised `type` returns null and never throws. `page_sections.type` is
 * a string column, not an enum, so an editor can save a section this build has
 * never heard of — and the homepage must not white-screen when they do. That
 * behaviour is covered by a test; do not replace this with a lookup that
 * indexes blind.
 */
export function renderSection(
  section: PageSection,
  { locale, dict, branches }: SectionContext,
) {
  switch (section.type) {
    case 'hero':
      return <Hero section={section} locale={locale} />
    case 'intro':
      return <Intro section={section} />
    case 'featured_dishes':
      return (
        <FeaturedDishes section={section} locale={locale} dict={dict} />
      )
    case 'why_lario':
      return <WhyLario section={section} locale={locale} />
    case 'chef_story':
      return <ChefStory section={section} locale={locale} />
    case 'branch_cards':
      return <BranchCards section={section} locale={locale} dict={dict} />
    case 'private_events':
      return <PrivateEvents section={section} locale={locale} dict={dict} />
    case 'gallery_strip':
      return <GalleryStrip section={section} locale={locale} />
    case 'testimonials':
      return (
        <Testimonials
          items={readList(section.content, 'testimonials', testimonialSchema)}
          eyebrow={readText(section.content, 'eyebrow')}
          heading={readText(section.content, 'heading')}
          subheading={readText(section.content, 'subheading')}
          previousLabel={dict.actions.previous}
          nextLabel={dict.actions.next}
        />
      )
    case 'faq':
      return <Faq section={section} />
    case 'reservation_cta':
      return (
        <ReservationCta
          section={section}
          locale={locale}
          branches={branches}
        />
      )
    default:
      return null
  }
}
