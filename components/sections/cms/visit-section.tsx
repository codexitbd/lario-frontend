import { VisitBlock } from '@/components/menu/visit-block'
import { type Bag } from '@/components/sections/content'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { type Settings, branchSchema } from '@/lib/schemas'

export function VisitSection({
  section,
  locale,
  dict,
  settings,
}: {
  section: { content: Bag }
  locale: Locale
  dict: Dictionary
  settings?: Settings
}) {
  const branch = branchSchema.safeParse(section.content.branch)
  if (!branch.success || !settings) return null

  return <VisitBlock branches={[branch.data]} settings={settings} locale={locale} dict={dict} />
}
