'use client'

import { useSyncExternalStore } from 'react'
import { getOpenState } from '@/lib/hours'
import { interpolate } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Branch } from '@/lib/schemas'

/**
 * Whether this room is serving right now. The one genuinely useful thing a
 * restaurant footer can tell someone at 11pm.
 *
 * A CLIENT island because every page here is statically prerendered: "now"
 * cannot be baked at build time or the answer is wrong within the hour. The
 * server snapshot is `null`, so the server renders nothing and the browser
 * fills it in. That means no hydration mismatch and, more importantly, no
 * layout shift: the row reserves its height either way.
 *
 * `useSyncExternalStore` over a one-minute interval rather than setState in an
 * effect. The store's snapshot is the current minute, so the component
 * re-renders exactly when the answer can change, and React owns the
 * subscription lifecycle instead of a hand-rolled cleanup.
 *
 * The dot is the one place on this site a coloured status dot is justified: it
 * reports real state that changes, not decoration.
 */
function subscribe(onChange: () => void): () => void {
  const id = window.setInterval(onChange, 60_000)
  return () => window.clearInterval(id)
}

// Bucket to the minute so the snapshot is stable between ticks; returning
// Date.now() directly would make every render a new value and loop.
const snapshot = () => Math.floor(Date.now() / 60_000)
const serverSnapshot = () => null

export function OpenNow({
  branch,
  locale,
  dict,
}: {
  branch: Branch
  locale: Locale
  dict: Dictionary
}) {
  const minute = useSyncExternalStore(subscribe, snapshot, serverSnapshot)

  // Server and first paint: hold the space, say nothing.
  if (minute === null) {
    return <p className="min-h-6" aria-hidden="true" />
  }

  const state = getOpenState(branch.opening_hours, locale, new Date(minute * 60_000))

  const label = state.open
    ? interpolate(dict.footer.openUntil, { time: state.closesAt })
    : state.opensDay
      ? interpolate(dict.footer.opensOn, {
          day: state.opensDay,
          time: state.opensAt,
        })
      : dict.footer.closedToday

  return (
    <p className="flex min-h-6 items-center gap-2.5 text-[0.8125rem]">
      <span
        aria-hidden="true"
        className={`size-1.5 shrink-0 rounded-full ${
          state.open ? 'bg-gold' : 'bg-ivory-dim/40'
        }`}
      />
      <span className={state.open ? 'text-gold' : 'text-ivory-dim/70'}>
        {label}
      </span>
    </p>
  )
}
