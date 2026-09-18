import homeFixture from '@/content/home.json'
import { buildSeo } from '@/content/seo-defaults'
import { getBranches } from '@/lib/api/branches.impl'
import { getFeaturedItems } from '@/lib/api/menu.impl'
import { resolveTranslation } from '@/lib/api/resolve'
import { getTestimonials } from '@/lib/api/testimonials.impl'
import type { Locale } from '@/lib/i18n/config'
import type { Branch, Home, PageSection } from '@/lib/schemas'

type SourceSection = (typeof homeFixture.sections)[number]

// Each section type carries a different translation shape (hero has
// cta_label, faq has items, etc.), so the fixture's `sections` array is a
// union of per-type object shapes. `content` on the wire is deliberately a
// loose bag (pageSectionSchema types it `z.record(string, unknown)`), so
// resolving against that same loose shape here is correct, not a shortcut.
type SectionTranslation = Record<string, unknown>

function toSection(locale: Locale, section: SourceSection): PageSection {
  const content = resolveTranslation(
    section.translations as Partial<Record<Locale, SectionTranslation>>,
    locale,
  )

  if (section.type === 'featured_dishes') {
    const { item_slugs } = section.payload as { item_slugs: string[] }
    return {
      type: section.type,
      sort_order: section.sort_order,
      payload: section.payload,
      content,
      items: getFeaturedItems(locale, item_slugs),
    }
  }

  if (section.type === 'branch_cards') {
    const { branch_slugs } = section.payload as { branch_slugs: string[] }
    const branches = getBranches(locale)
    const cards = branch_slugs
      .map((slug) => branches.find((b) => b.slug === slug))
      .filter((b): b is Branch => Boolean(b))
    return {
      type: section.type,
      sort_order: section.sort_order,
      payload: section.payload,
      content: { ...content, branches: cards },
    }
  }

  if (section.type === 'testimonials') {
    // The section had copy but no data path at all — content/testimonials.json
    // had no fetcher, so `payload.testimonial_limit` selected from nothing.
    // Resolved here for the same reason branch_cards is: the contract makes
    // /home ONE request carrying everything its sections need.
    const { testimonial_limit } = section.payload as {
      testimonial_limit: number
    }
    return {
      type: section.type,
      sort_order: section.sort_order,
      payload: section.payload,
      content: {
        ...content,
        testimonials: getTestimonials(locale, testimonial_limit),
      },
    }
  }

  return {
    type: section.type,
    sort_order: section.sort_order,
    payload: section.payload,
    content,
  }
}

export function getHome(locale: Locale): Home {
  const hero = homeFixture.sections.find((s) => s.type === 'hero')
  if (!hero) throw new Error('home fixture is missing its hero section')
  const heroPayload = hero.payload as { background_image: string | null }

  // The homepage's seo comes from the fixture's own top-level seo.{locale}
  // block, NOT from the hero section's copy. A hero heading is written for
  // impact on arrival; a <title> is written to be found in search — deriving
  // one from the other means an editor can't tune either without disturbing
  // the other. See task-11-report.md fix round 1.
  const seoContent = resolveTranslation(homeFixture.seo, locale)

  const sections = homeFixture.sections
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((section) => toSection(locale, section))

  return {
    seo: buildSeo({
      title: seoContent.title,
      description: seoContent.description,
      path: homeFixture.seo_path,
      locale,
      image: heroPayload.background_image,
    }),
    sections,
  }
}
