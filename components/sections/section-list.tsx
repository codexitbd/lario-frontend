import { renderSection } from '@/components/sections'
import { getBranches } from '@/lib/api/branches'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import type { Branch, PageSection, Settings } from '@/lib/schemas'

/**
 * Renders admin-placed components in order: a CMS page's body, or the
 * "detail page extras" appended below every dish / category / branch / post / event.
 */
export async function SectionList({
  sections,
  locale,
  dict,
  settings,
  branches,
}: {
  sections: PageSection[]
  locale: Locale
  dict: Dictionary
  settings: Settings
  branches?: Branch[]
}) {
  if (sections.length === 0) return null
  const rooms = branches ?? (await getBranches(locale))

  return sections.map((section) => (
    <div key={`${section.type}-${section.sort_order}`}>
      {renderSection(section, { locale, dict, branches: rooms, settings })}
    </div>
  ))
}
