'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Below this scroll offset the header sits transparent over the page's dark
    opening band. */
const TOP = 8
/** Trackpads and iOS rubber-banding report 1-3px of noise; ignore it so the
    header does not flicker on a resting finger. */
const TOLERANCE = 6

/**
 * The <header> element itself, and the only scroll-aware code in the chrome.
 *
 * It writes two attributes and nothing else; globals.css (`.lr-chrome`) turns
 * them into the visuals:
 *
 *   data-top     at the very top: transparent ground, utility strip open.
 *   data-hidden  scrolling DOWN past the header's own height: slid away.
 *                Any upward scroll brings it straight back.
 *
 * The attributes are set on the DOM directly rather than through state, so a
 * scroll never re-renders the header's children. The listener is passive and
 * coalesced to one read per frame.
 *
 * `data-top` is rendered by the server so the first paint over the hero is
 * transparent with no flash; the effect corrects it on mount when the browser
 * restored a scroll position.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const header = ref.current
    if (!header) return

    let last = Math.max(0, window.scrollY)
    let frame = 0

    const update = () => {
      frame = 0
      // Clamped: iOS reports negative offsets while rubber-banding at the top.
      const y = Math.max(0, window.scrollY)
      header.toggleAttribute('data-top', y < TOP)

      const delta = y - last
      if (Math.abs(delta) < TOLERANCE) return
      header.toggleAttribute(
        'data-hidden',
        delta > 0 && y > header.offsetHeight,
      )
      last = y
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <header
      ref={ref}
      data-top=""
      className="lr-chrome fixed inset-x-0 top-0 z-50 text-ivory"
    >
      {children}
    </header>
  )
}
