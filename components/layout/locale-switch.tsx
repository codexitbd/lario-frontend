'use client'

import { usePathname } from 'next/navigation'
import {
  LOCALES,
  LOCALE_ENDONYMS,
  localePath,
  stripLocalePrefix,
} from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'

/**
 * Switches the reader to the other language, ON THE PAGE THEY ARE ALREADY
 * READING. Not a link to the other homepage: someone deep in a dish page who
 * wants Arabic wants THAT dish in Arabic.
 *
 * This was missing until 2026-09-20, which was a real defect rather than a
 * missing nicety. Half this site's audience reads Arabic first, every route is
 * prerendered in both languages, and there was no way to reach the Arabic side
 * except by typing `/ar` into the address bar.
 *
 * A CLIENT island only because it needs `usePathname` to build the counterpart
 * URL. Slugs are shared across locales (one slug per model, both languages), so
 * the mapping is a pure prefix swap and the whole of it is tested in
 * `lib/i18n/locale-switch.test.ts` — including the segment-anchoring that stops
 * `/arabica-blend` from being mangled into `/abica-blend`.
 *
 * A LINK, not a button: it navigates, it is a real URL, and it should be
 * openable in a new tab. `hrefLang` and `lang` are both set so crawlers read it
 * as the alternate and screen readers switch voice for the endonym.
 *
 * A PLAIN <a>, NOT next/link, and this is not a style preference. This project's
 * root layout IS `app/[locale]/layout.tsx`: it emits <html lang dir>. Next
 * cannot re-render those attributes during a client-side transition, so a
 * <Link> across locales left the document at `lang="en" dir="ltr"` while
 * showing Arabic, AND mounted the incoming tree beside the outgoing one:
 * measured two <header>, two <footer>, two <main> and TWO <h1> in the DOM at
 * once. A full document load is the only thing that rebuilds the html element.
 * Do not "optimise" this into a <Link>.
 *
 * The label is the TARGET language in its own script, which is the one label
 * that works from either side. Query strings are deliberately not carried over:
 * a filtered `/menu` resets to the unfiltered list in the new language, which is
 * a fair trade for not having to make this component read search params.
 */
export function LocaleSwitch({
  locale,
  className = '',
}: {
  locale: Locale
  className?: string
}) {
  const pathname = usePathname()
  const target: Locale = LOCALES.find((l) => l !== locale) ?? locale
  const href = localePath(target, stripLocalePrefix(pathname))

  return (
    <a
      href={href}
      hrefLang={target}
      lang={target}
      className={`inline-flex min-h-11 items-center transition-colors duration-300 ease-brand hover:text-gold ${className}`}
    >
      {LOCALE_ENDONYMS[target]}
    </a>
  )
}
