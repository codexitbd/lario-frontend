import { SectionHeader } from '@/components/ui/section-header'
import { type Bag, readText } from '@/components/sections/content'

/** The eyebrow / heading / intro every CMS section can carry; nothing when all are empty. */
export function CmsHeader({ content, tone = 'dark', className = '' }: { content: Bag; tone?: 'dark' | 'light'; className?: string }) {
  const heading = readText(content, 'heading')
  if (!heading) return null

  return (
    <SectionHeader
      tone={tone}
      eyebrow={readText(content, 'eyebrow')}
      heading={heading}
      subheading={readText(content, 'subheading')}
      className={className}
    />
  )
}
