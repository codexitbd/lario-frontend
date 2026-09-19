import { describe, expect, it } from 'vitest'
import { renderSection, type SectionContext } from '@/components/sections'
import en from '@/messages/en.json'
import { SECTION_TYPES, type PageSection } from '@/lib/schemas'

const context: SectionContext = {
  locale: 'en',
  dict: en,
  branches: [],
}

function section(type: string): PageSection {
  return { type, sort_order: 0, payload: {}, content: {} }
}

describe('renderSection', () => {
  // page_sections.type is a string column, not an enum. An editor saving a
  // section type this build has never heard of must not white-screen the
  // homepage — it is the one behaviour the contract names explicitly.
  it('returns null for an unrecognised section type', () => {
    expect(renderSection(section('cocktail_menu'), context)).toBeNull()
  })

  it('returns null rather than throwing on an empty type', () => {
    expect(renderSection(section(''), context)).toBeNull()
  })

  it('has a component for every type the schema allows', () => {
    for (const type of SECTION_TYPES) {
      expect(
        renderSection(section(type), context),
        `no component mapped for section type "${type}"`,
      ).not.toBeNull()
    }
  })

  it('builds each section from empty payload and content without throwing', () => {
    // Every section reads its copy through the guarded readers in content.ts,
    // so a half-translated row degrades to empty strings and empty lists. This
    // asserts the element is constructed; it does not render children.
    for (const type of SECTION_TYPES) {
      expect(() => renderSection(section(type), context)).not.toThrow()
    }
  })
})
