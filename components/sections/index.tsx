import { BranchCards } from '@/components/sections/branch-cards'
import { ChefStory } from '@/components/sections/chef-story'
import { Faq } from '@/components/sections/faq'
import { GalleryStrip } from '@/components/sections/gallery-strip'
import { Hero } from '@/components/sections/hero'
import { Intro } from '@/components/sections/intro'
import { PrivateEvents } from '@/components/sections/private-events'
import { ReservationCta } from '@/components/sections/reservation-cta'
import { ReviewFan } from '@/components/sections/review-fan'
import { SignatureFavourites } from '@/components/sections/signature-favourites'
import { WhyLario } from '@/components/sections/why-lario'
import { readList, readText, testimonialSchema } from '@/components/sections/content'
import { CategoryGrid } from '@/components/sections/cms/category-grid'
import { ContactSection } from '@/components/sections/cms/contact-section'
import { DishGrid } from '@/components/sections/cms/dish-grid'
import { EventList } from '@/components/sections/cms/event-list'
import { MediaSplit } from '@/components/sections/cms/media-split'
import { MenuBrowserSection } from '@/components/sections/cms/menu-browser-section'
import { NewsletterSection } from '@/components/sections/cms/newsletter-section'
import { PageHero } from '@/components/sections/cms/page-hero'
import { PostList } from '@/components/sections/cms/post-list'
import { ReservationFormSection } from '@/components/sections/cms/reservation-form-section'
import { RichText } from '@/components/sections/cms/rich-text'
import { TeamGrid } from '@/components/sections/cms/team-grid'
import { VisitSection } from '@/components/sections/cms/visit-section'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Branch, PageSection, Settings } from '@/lib/schemas'

export type SectionContext = {
  locale: Locale
  dict: Dictionary
  branches: Branch[]
  /** Needed by the contact, reservation and visit components. */
  settings?: Settings
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
  { locale, dict, branches, settings }: SectionContext,
) {
  switch (section.type) {
    case 'hero':
      return <Hero section={section} locale={locale} />
    case 'intro':
      return <Intro section={section} />
    case 'featured_dishes':
      return (
        <SignatureFavourites section={section} locale={locale} dict={dict} />
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
        <ReviewFan
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
    case 'page_hero':
      return <PageHero section={section} locale={locale} homeLabel={dict.nav.home} />
    case 'rich_text':
      return <RichText section={section} />
    case 'media_split':
      return <MediaSplit section={section} locale={locale} />
    case 'menu_browser':
      return <MenuBrowserSection section={section} locale={locale} dict={dict} />
    case 'category_grid':
      return <CategoryGrid section={section} locale={locale} />
    case 'dish_grid':
      return <DishGrid section={section} locale={locale} dict={dict} />
    case 'reservation_form':
      return <ReservationFormSection section={section} locale={locale} dict={dict} branches={branches} settings={settings} />
    case 'contact':
      return <ContactSection section={section} locale={locale} dict={dict} branches={branches} settings={settings} />
    case 'newsletter':
      return <NewsletterSection section={section} locale={locale} dict={dict} />
    case 'post_list':
      return <PostList section={section} locale={locale} />
    case 'event_list':
      return <EventList section={section} locale={locale} />
    case 'team_grid':
      return <TeamGrid section={section} />
    case 'visit':
      return <VisitSection section={section} locale={locale} dict={dict} settings={settings} />
    default:
      return null
  }
}
