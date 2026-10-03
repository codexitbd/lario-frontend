import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { CmsHeader } from '@/components/sections/cms/header'
import { type Bag, readList } from '@/components/sections/content'
import { teamMemberSchema } from '@/lib/schemas'

export function TeamGrid({ section }: { section: { content: Bag } }) {
  const members = readList(section.content, 'members', teamMemberSchema)
  if (members.length === 0) return null

  return (
    <section className="bg-bone py-20 text-ink md:py-28">
      <Container>
        <CmsHeader content={section.content} tone="light" className="mb-14" />
        <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <li key={member.slug}>
              <div className="relative aspect-[4/5] overflow-hidden">
                <Figure src={member.photo} alt={member.name} shot={member.name} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="absolute inset-0" />
              </div>
              <h3 className="lr-display mt-5 text-2xl">{member.name}</h3>
              {member.role ? <p className="mt-1 text-sm text-gold-ink">{member.role}</p> : null}
              {member.bio ? <p className="mt-3 text-base leading-relaxed text-ink-soft">{member.bio}</p> : null}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
