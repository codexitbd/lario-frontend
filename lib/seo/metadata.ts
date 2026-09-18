import type { Metadata } from 'next'
import type { Seo } from '@/lib/schemas'

// No explicit `: Metadata` return annotation — Next's `Metadata['twitter']`
// and `Metadata['openGraph']` are discriminated unions (keyed on `card` /
// `type`). Annotating the return type erases the literal 'summary_large_image'
// down to that whole union at every call site, so *reading* `.card` back off
// the result (as the test below does, and as any page consuming this would)
// fails tsc even though the object itself is a valid Metadata. `satisfies`
// still checks the shape against `Metadata` but lets the inferred return type
// keep its literals.
export function buildMetadata(seo: Seo) {
  const directives = seo.robots.split(',').map((d) => d.trim().toLowerCase())
  // "none" is a standard directive meaning noindex AND nofollow. Matching only
  // the literal tokens would let it fall through to index:true/follow:true —
  // actively indexing a page whose robots value says to keep it out, with
  // nothing erroring anywhere.
  const none = directives.includes('none')
  return {
    title: seo.title,
    description: seo.description,
    robots: {
      index: !none && !directives.includes('noindex'),
      follow: !none && !directives.includes('nofollow'),
    },
    alternates: {
      canonical: seo.canonical,
      languages: {
        en: seo.alternates.en,
        ar: seo.alternates.ar,
        'x-default': seo.alternates.en,
      },
    },
    openGraph: {
      title: seo.og.title,
      description: seo.og.description,
      url: seo.canonical,
      type: seo.og.type === 'article' ? 'article' : 'website',
      images: seo.og.image ? [seo.og.image] : undefined,
    },
    twitter: {
      // ponytail: hardcoded, not read from seo.twitter.card (typed as a bare
      // `string` in lib/schemas/common.ts, which can't populate a `card`
      // discriminant). The contract's only documented value is
      // 'summary_large_image' (03-api-contract.md) — revisit if a second
      // card type is ever added.
      card: 'summary_large_image',
      title: seo.og.title,
      description: seo.og.description,
      images: seo.og.image ? [seo.og.image] : undefined,
    },
  } satisfies Metadata
}
