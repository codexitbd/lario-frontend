import homeFixture from '@/content/home.json'
import { buildSeo } from '@/content/seo-defaults'
import { getBranches } from '@/lib/api/branches.impl'
import { getFeaturedItems } from '@/lib/api/menu.impl'
import { resolveTranslation } from '@/lib/api/resolve'
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
  const heroContent = resolveTranslation(
    hero.translations as Partial<
      Record<Locale, { heading: string; subheading: string }>
    >,
    locale,
  )
  const heroPayload = hero.payload as { background_image: string | null }

  const sections = homeFixture.sections
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((section) => toSection(locale, section))

  return {
    seo: buildSeo({
      title: heroContent.heading,
      description: heroContent.subheading,
      path: homeFixture.seo_path,
      locale,
      image: heroPayload.background_image,
    }),
    sections,
  }
}
