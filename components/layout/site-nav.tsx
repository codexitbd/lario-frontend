'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CaretDownIcon, ListIcon, XIcon } from '@phosphor-icons/react/ssr'
import { type NavItem, isActivePath } from '@/lib/nav'
import { LocaleSwitch } from '@/components/layout/locale-switch'
import { Wordmark } from '@/components/layout/wordmark'
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
 * DELIBERATE DEVIATION from spec §3: the DESKTOP bar carries the live routes
 * only, not the six Phase-4 items as well. Eleven items in a centred bar is not
 * the approved shape, and the client's own reference (design/references/
 * shared/header-mobile.png) draws six slots. The deferred items keep their
 * place — disabled, labelled "coming soon" — in the drawer and the footer,
 * which is what §3 is actually protecting: they are rendered, and they are
 * never links to nothing.
 *
 * MENUS COME FROM THE ADMIN (Pages → Menus: "header" and "drawer"). Any item
 * with dropdown entries renders the way Branches always did (client decision
 * 2026-10-01): on desktop a button that opens on hover, focus or click; in the
 * drawer a heading over its links. Such a parent carries no href. "Coming soon"
 * entries render disabled in the drawer and never as links; the desktop bar
 * shows live entries only (spec §3 deviation above).
 */
export function SiteNav({
  locale,
  dict,
  siteName,
  reserveHref,
  items,
  drawerItems,
}: {
  locale: Locale
  dict: Dictionary
  siteName: string
  reserveHref: string
  /** The "header" menu, already localised. */
  items: NavItem[]
  /** Extra drawer entries (the "drawer" menu), typically "coming soon" ones. */
  drawerItems: NavItem[]
}) {
  const pathname = usePathname()
  const drawer = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  // Hover and focus open a dropdown through CSS alone; this state is for a
  // click or tap, so a pointer that cannot hover still gets in.
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const show = () => {
    drawer.current?.showModal()
    setOpen(true)
  }
  const hide = () => {
    drawer.current?.close()
  }

  const isHere = (item: NavItem): boolean =>
    item.href ? isActivePath(pathname, item.href, item.exact) : item.children.some(isHere)
  const live = items.filter((item) => !item.comingSoon && (item.href || item.children.length > 0))
  const linkProps = (item: NavItem) => (item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})

  const itemClass =
    'group relative py-2 text-[0.75rem] tracking-[0.18em] text-ivory uppercase transition-colors duration-300 ease-brand hover:text-gold'
  const rule = (active: boolean) => (
    // The reference marks the current page with a short rule under it. It
    // grows from the start edge on hover, so the same device reads as both
    // state and affordance.
    <span
      aria-hidden="true"
      className={`absolute inset-x-0 bottom-0 h-px origin-[left_center] bg-gold transition-transform duration-500 ease-brand rtl:origin-[right_center] ${
        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
      }`}
    />
  )

  return (
    <>
      <nav
        aria-label={dict.nav.primary}
        className="hidden lg:flex lg:items-center lg:gap-9"
      >
        {live.map((item) => {
          const active = isHere(item)

          if (item.children.length === 0 && item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                {...linkProps(item)}
                aria-current={active ? 'page' : undefined}
                className={itemClass}
              >
                {item.label}
                {rule(active)}
              </Link>
            )
          }

          const expanded = openMenu === item.id
          return (
            <div
              key={item.id}
              className="group/branches relative"
              data-open={expanded || undefined}
              onMouseLeave={() => setOpenMenu(null)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setOpenMenu(null)
              }}
              onBlur={(event) => {
                // Closes a click-opened menu once focus leaves it entirely.
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setOpenMenu(null)
                }
              }}
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-haspopup="menu"
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpenMenu((current) => (current === item.id ? null : item.id))}
                className={`${itemClass} flex items-center gap-1.5`}
              >
                {item.label}
                <CaretDownIcon
                  aria-hidden="true"
                  weight="bold"
                  className="size-3 transition-transform duration-300 ease-brand group-hover/branches:rotate-180 group-data-open/branches:rotate-180"
                />
                {rule(active)}
              </button>

              {/* pt-4 rather than mt-4: the gap stays inside the hover
                  area, so the menu does not close on the way down to it. */}
              <ul
                role="menu"
                className="invisible absolute start-0 top-full z-10 min-w-[15rem] translate-y-2 pt-4 opacity-0 transition-[opacity,transform,visibility] duration-300 ease-brand group-hover/branches:visible group-hover/branches:translate-y-0 group-hover/branches:opacity-100 group-focus-within/branches:visible group-focus-within/branches:translate-y-0 group-focus-within/branches:opacity-100 group-data-open/branches:visible group-data-open/branches:translate-y-0 group-data-open/branches:opacity-100"
              >
                <li className="border border-gold/20 bg-ink/95 py-2 backdrop-blur-sm">
                  <ul>
                    {item.children.filter((child) => child.href).map((child) => {
                      const here = isHere(child)
                      return (
                        <li key={child.id} role="none">
                          <Link
                            role="menuitem"
                            href={child.href!}
                            {...linkProps(child)}
                            aria-current={here ? 'page' : undefined}
                            className={`lr-display block px-6 py-3 text-lg leading-tight transition-colors duration-300 ease-brand hover:text-gold ${
                              here ? 'text-gold' : 'text-ivory'
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              </ul>
            </div>
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
              {[...items, ...drawerItems].map((item) => {
                if (item.comingSoon || (!item.href && item.children.length === 0)) {
                  // Present, so the nav keeps its approved shape; never a
                  // link, so it can never be a broken one.
                  return (
                    <li key={item.id} className="border-b border-ivory/10">
                      <span aria-disabled="true" className="flex items-baseline justify-between py-5">
                        <span className="lr-display text-2xl text-ivory-dim/50">{item.label}</span>
                        {item.comingSoon ? (
                          <span className="text-[0.5625rem] tracking-[0.18em] text-gold/50 uppercase">{dict.nav.comingSoon}</span>
                        ) : null}
                      </span>
                    </li>
                  )
                }

                if (item.children.length > 0) {
                  // A heading that is not itself a link, over its entries.
                  return (
                    <li key={item.id} className="border-b border-ivory/10 py-5">
                      <span className="lr-display block text-2xl text-ivory-dim">{item.label}</span>
                      <ul className="mt-3 flex flex-col gap-1 ps-5">
                        {item.children.filter((child) => child.href).map((child) => (
                          <li key={child.id}>
                            <Link
                              href={child.href!}
                              {...linkProps(child)}
                              onClick={hide}
                              aria-current={isHere(child) ? 'page' : undefined}
                              className="lr-display block py-2 text-xl text-ivory transition-colors duration-300 aria-[current=page]:text-gold hover:text-gold"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )
                }

                return (
                  <li key={item.id} className="border-b border-ivory/10">
                    <Link
                      href={item.href!}
                      {...linkProps(item)}
                      onClick={hide}
                      aria-current={isHere(item) ? 'page' : undefined}
                      className="lr-display block py-5 text-2xl text-ivory transition-colors duration-300 aria-[current=page]:text-gold hover:text-gold"
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
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
