'use client'

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { XIcon } from '@phosphor-icons/react/ssr'
import { ReservationBook } from '@/components/reservation/reservation-book'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Branch, Settings } from '@/lib/schemas'

const OPEN_EVENT = 'lr:reserve'
const DIALOG_ID = 'lr-reserve'

/**
 * A "Reserve a Table" link. When the admin has set the header button to open
 * the pop-up (Settings → Reservations), the pop-up is on the page and the link
 * opens it; otherwise, or before JavaScript, it simply goes to /reservation.
 */
export function ReserveLink({
  href,
  className,
  onOpen,
  children,
}: {
  href: string
  className: string
  /** Runs first, e.g. to close the mobile drawer. */
  onOpen?: () => void
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        onOpen?.()
        if (document.getElementById(DIALOG_ID)) {
          event.preventDefault()
          window.dispatchEvent(new Event(OPEN_EVENT))
        }
      }}
    >
      {children}
    </Link>
  )
}

/**
 * The booking pop-up: the reservation book one step at a time, on bone (the
 * book's dark tokens are re-pointed in globals.css, `.lr-reserve`), in a native
 * <dialog> (focus trap, Escape and inertness come from the browser, as in the
 * drawer and the gallery viewer). The book mounts on first open, so pages that
 * never open it pay nothing for it, and it keeps its answers if the guest
 * closes and comes back.
 */
export function ReservationModal({
  branches,
  settings,
  locale,
  dict,
}: {
  branches: Branch[]
  settings: Settings['reservations']
  locale: Locale
  dict: Dictionary
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const open = () => {
      setMounted(true)
      dialog.current?.showModal()
    }
    window.addEventListener(OPEN_EVENT, open)
    return () => window.removeEventListener(OPEN_EVENT, open)
  }, [])

  return (
    <dialog
      id={DIALOG_ID}
      ref={dialog}
      aria-labelledby={`${DIALOG_ID}-title`}
      className="lr-reserve m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-bone p-0 text-ink shadow-2xl md:m-auto md:h-auto md:max-h-[92dvh] md:max-w-3xl md:border md:border-gold-ink/20"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-6 border-b border-ink/10 bg-bone/95 px-5 py-4 backdrop-blur-sm sm:px-8">
        <h2
          id={`${DIALOG_ID}-title`}
          className="text-[0.75rem] font-medium tracking-[0.18em] text-gold-ink uppercase"
        >
          {dict.actions.reserve}
        </h2>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label={dict.actions.close}
          className="flex size-11 items-center justify-center text-ink-soft transition-colors hover:text-gold-ink"
        >
          <XIcon aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="px-5 pt-2 pb-10 sm:px-8">
        {!mounted ? null : settings.enabled === false ? (
          <p className="py-16 text-center text-lg text-ink-soft">
            {settings.disabled_message}
          </p>
        ) : (
          // The book reads ?branch= on the client, which wants a boundary.
          <Suspense>
            <ReservationBook
              steps
              branches={branches}
              settings={settings}
              locale={locale}
              dict={dict}
            />
          </Suspense>
        )}
      </div>
    </dialog>
  )
}
