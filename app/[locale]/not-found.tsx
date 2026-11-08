import { locale as rootLocale } from 'next/root-params'
import { Container } from '@/components/ui/container'
import { Cta } from '@/components/ui/cta'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { DEFAULT_LOCALE, isLocale, localePath } from '@/lib/i18n/config'

/**
 * The 404, inside the normal header and footer (QA round 2, B-04). A dark band
 * like every other page opening, so the fixed header sits on its usual ground,
 * with the three ways back a lost guest most likely wants.
 *
 * not-found takes no props, so the locale comes from next/root-params. Its
 * <title> is the locale layout's default title; Next adds the noindex itself.
 */
export default async function NotFound() {
  const param = await rootLocale()
  const locale = isLocale(param) ? param : DEFAULT_LOCALE
  const dict = await getDictionary(locale)

  return (
    <main id="main-content" className="bg-ink pt-44 pb-28 md:pt-56 md:pb-40">
      <Container width="narrow" className="text-center">
        <p className="lr-display text-lg text-gold italic">404</p>
        <h1 className="lr-display mt-4 text-[clamp(2.25rem,1.5rem+3vw,3.25rem)] leading-[1.1] text-ivory">
          {dict.notFound.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-[46ch] text-base leading-relaxed text-pretty text-ivory-dim md:text-lg">
          {dict.notFound.body}
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Cta href={localePath(locale, '/')}>{dict.nav.home}</Cta>
          <Cta href={localePath(locale, '/menu')} variant="outline">
            {dict.nav.menu}
          </Cta>
          <Cta href={localePath(locale, '/reservation')} variant="outline">
            {dict.actions.reserve}
          </Cta>
        </div>
      </Container>
    </main>
  )
}
