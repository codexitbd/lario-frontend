'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ListIcon, XIcon } from '@phosphor-icons/react/ssr'
import {
  DEFERRED_NAV,
  PRIMARY_NAV,
  isActivePath,
  type NavKey,
} from '@/lib/nav'
import { LocaleSwitch } from '@/components/layout/locale-switch'
import { Wordmark } from '@/components/layout/wordmark'
import { localePath } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * The header's one interactive island: the desktop link row and the mobile
 * drawer. Everything else in the header is a Server Component.
 *
 * The drawer is a NATIVE <dialog> opened with showModal(), which is why there
 * is no focus-trap code here. The browser already traps focus, closes on
 * Escape, marks the rest of the page inert and gives us ::backdrop — spec §10
 * asks for all four, and hand-rolling them is how they end up subtly wrong.
 * The only JavaScript is the open/close call itself.
 *
 * `usePathname` is the reason this is a client component at all. The active
 * marker cannot be computed on the server without reading headers, which would
 * turn every statically prerendered page in the site dynamic — 196 menu pages
 * included. A pathname read costs nothing by comparison.
 *
 * DELIBERATE DEVIATION from spec §3: the DESKTOP bar carries the five live
 * routes only, not the six Phase-4 items as well. Eleven items in a centred bar
 * is not the approved shape, and the client's own reference (design/references/
 * shared/header-mobile.png) draws six slots. The deferred items keep their
 * place — disabled, labelled "coming soon" — in the drawer and the footer,
 * which is what §3 is actually protecting: they are rendered, and they are
 * never links to nothing.
 */
export function SiteNav({
  locale,
  dict,
  siteName,
  reserveHref,
}: {
  locale: Locale
  dict: Dictionary
  siteName: string
  reserveHref: string
}) {
  const pathname = usePathname()
  const drawer = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  const show = () => {
    drawer.current?.showModal()
    setOpen(true)
  }
  const hide = () => {
    drawer.current?.close()
  }

  const links = PRIMARY_NAV.map((item) => ({
    ...item,
    label: dict.nav[item.key],
    localised: localePath(locale, item.href),
    // Home only ever matches itself; in Arabic that is `/ar`, not `/`.
    exact: item.href === '/',
  }))

  return (
    <>
      <nav
        aria-label={dict.nav.primary}
        className="hidden lg:flex lg:items-center lg:gap-9"
      >
        {links.map((item) => {
          const active = isActivePath(pathname, item.localised, item.exact)
          return (
            <Link
              key={item.key}
              href={item.localised}
              aria-current={active ? 'page' : undefined}
              className="group relative py-2 text-[0.75rem] tracking-[0.18em] text-ivory uppercase transition-colors duration-300 ease-brand hover:text-gold"
            >
              {item.label}
              {/* The reference marks the current page with a short rule under
                  it. It grows from the start edge on hover, so the same device
                  reads as both state and affordance. */}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-px origin-[left_center] bg-gold transition-transform duration-500 ease-brand rtl:origin-[right_center] ${
                  active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={show}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="-me-2 p-2 text-ivory transition-colors duration-300 hover:text-gold lg:hidden"
      >
        <span className="sr-only">{dict.nav.openMenu}</span>
        <ListIcon aria-hidden="true" className="size-7" weight="light" />
      </button>

      {/* UA styles centre a modal dialog in a small box; this is a full-bleed
          sheet, so every one of them is reset here. */}
      <dialog
        ref={drawer}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === drawer.current) hide()
        }}
        className="m-0 h-full max-h-none w-full max-w-none border-0 bg-ink p-0 text-ivory backdrop:bg-scrim/80 lg:hidden"
      >
        <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Wordmark
              locale={locale}
              siteName={siteName}
              onClick={hide}
              className="h-11"
            />
            <div className="flex items-center gap-5">
              {/* Top row, not the bottom of a twelve-item list: half this
                  audience reads the other language and should not have to
                  scroll past six disabled items to find the switch. */}
              <LocaleSwitch
                locale={locale}
                className="text-[0.8125rem] tracking-[0.14em] text-gold uppercase"
              />
              <button
                type="button"
                onClick={hide}
                className="-me-2 p-2 text-ivory transition-colors duration-300 hover:text-gold"
              >
                <span className="sr-only">{dict.nav.closeMenu}</span>
                <XIcon aria-hidden="true" className="size-6" weight="light" />
              </button>
            </div>
          </div>

          <nav aria-label={dict.nav.primary} className="mt-10">
            <ul className="flex flex-col">
              {links.map((item) => (
                <li key={item.key} className="border-b border-ivory/10">
                  <Link
                    href={item.localised}
                    onClick={hide}
                    aria-current={
                      isActivePath(pathname, item.localised, item.exact)
                        ? 'page'
                        : undefined
                    }
                    className="lr-display block py-5 text-2xl text-ivory transition-colors duration-300 aria-[current=page]:text-gold hover:text-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}

              {/* Phase 4. Present, so the nav keeps its approved shape; never a
                  link, so it can never be a broken one. */}
              {DEFERRED_NAV.map((key: NavKey) => (
                <li key={key} className="border-b border-ivory/10">
                  <span
                    aria-disabled="true"
                    className="flex items-baseline justify-between py-5"
                  >
                    <span className="lr-display text-2xl text-ivory-dim/50">
                      {dict.nav[key]}
                    </span>
                    <span className="text-[0.5625rem] tracking-[0.18em] text-gold/50 uppercase">
                      {dict.nav.comingSoon}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </nav>

          <Link
            href={reserveHref}
            onClick={hide}
            className="mt-10 mb-2 inline-flex items-center justify-center bg-ivory px-8 py-4 text-[0.8125rem] font-medium tracking-[0.16em] text-ink uppercase transition-colors duration-300 ease-brand hover:bg-gold-pale"
          >
            {dict.actions.reserve}
          </Link>
        </div>
      </dialog>
    </>
  )
}
