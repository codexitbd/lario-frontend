'use client'

import { useEffect, useRef, useState } from 'react'

// How long YouTube's start/resume overlay stays up after PLAYING, plus margin.
// Measured at ~4s; see the state effect below.
const OVERLAY_MS = 5000

/**
 * The hero's background film.
 *
 * Deliberately NOT part of first paint. Mobile PageSpeed 95+ and LCP under 1.5s
 * are milestone acceptance criteria, and a YouTube embed pulls several hundred
 * kilobytes of third-party JavaScript. So the poster photograph behind this is
 * the LCP element and paints with the document, and the iframe is only created
 * once the browser is idle. If it never gets idle, the poster is the hero and
 * the page is still correct.
 *
 * `prefers-reduced-motion` skips the iframe entirely — autoplaying footage is
 * exactly what that setting is for.
 *
 * youtube-nocookie.com, so no tracking cookie is set for a visitor who never
 * interacts with the player.
 */
export function HeroVideo({
  videoId,
  title,
}: {
  videoId: string
  title: string
}) {
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const start = () => setMounted(true)
    // Read the function off `window` rather than testing `'x' in window`: the
    // `in` form narrows the negative branch to `never`, because lib.dom types
    // requestIdleCallback as always present even where it is not.
    const idle = window.requestIdleCallback
    if (idle) {
      const handle = idle(start, { timeout: 2500 })
      return () => window.cancelIdleCallback(handle)
    }
    const timer = window.setTimeout(start, 1500)
    return () => window.clearTimeout(timer)
  }, [])

  // The film is shown only while the player is steadily playing, and the
  // player tells us its state over postMessage (`enablejsapi=1`).
  //
  // `controls=0` does not remove YouTube's centred transport overlay. Measured
  // in-browser: the player paints a pause button (plus title and "More
  // videos") every time playback starts or RESUMES — first play, after any
  // buffering stall, after a seek — and fades it out about four seconds later.
  // A fixed reveal delay only covers the first start, which is why the
  // controls still surfaced mid-film. So: hide the moment the player leaves
  // PLAYING, and reveal only once it has been playing past that window. While
  // hidden, the poster photograph underneath is the hero.
  //
  // `loop=1` is gone on purpose. YouTube's loop requires `playlist=<id>`, and a
  // playlist player adds previous / next buttons to that same overlay. We loop
  // by hand on ENDED instead.
  useEffect(() => {
    if (!mounted) return
    const win = () => frame.current?.contentWindow
    const send = (msg: object) =>
      win()?.postMessage(JSON.stringify({ ...msg, id: 1, channel: 'widget' }), '*')

    // The player only reports state after it hears 'listening', and ignores it
    // until it has booted, so knock until it answers.
    let heard = false
    const knock = window.setInterval(() => send({ event: 'listening' }), 250)
    let reveal: number | undefined
    let playing = false

    const onMessage = (e: MessageEvent) => {
      if (e.source !== win() || typeof e.data !== 'string') return
      let state: unknown
      try {
        state = JSON.parse(e.data)?.info?.playerState
      } catch {
        return
      }
      if (!heard) {
        heard = true
        window.clearInterval(knock)
      }
      if (typeof state !== 'number') return

      if (state === 1) {
        if (!playing) reveal = window.setTimeout(() => setReady(true), OVERLAY_MS)
        playing = true
        return
      }
      playing = false
      window.clearTimeout(reveal)
      setReady(false)
      if (state === 0) {
        send({ event: 'command', func: 'seekTo', args: [0, true] })
        send({ event: 'command', func: 'playVideo', args: [] })
      }
    }

    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      window.clearInterval(knock)
      window.clearTimeout(reveal)
    }
  }, [mounted])

  if (!mounted) return null

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    playsinline: '1',
    modestbranding: '1',
    rel: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    enablejsapi: '1',
    origin: window.location.origin,
  })

  return (
    <div
      aria-hidden="true"
      // Fade in slowly, but drop out fast: the overlay paints the instant a
      // stall ends, so a slow fade-out would let it show through.
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden transition-opacity ease-brand ${
        ready ? 'opacity-100 duration-700' : 'opacity-0 duration-150'
      }`}
    >
      {/*
        Two things hide the player's own furniture, and both are needed.

        `pointer-events-none` on this wrapper means the embedded document never
        sees the cursor, so the title bar, share and watch-later buttons never
        come up on hover.

        `scale-[1.4]` is the other half. `controls=0` does not remove YouTube's
        chrome, it only stops it being persistent — the title and channel still
        flash at the top on start, and the progress gradient still sits along
        the bottom. Those live at the extreme top and bottom edges of the
        player, so the iframe is blown up past the frame it has to fill and the
        wrapper's `overflow-hidden` crops those bands away entirely. The 16:9
        min-size below is the cover calculation; the scale is the crop.
      */}
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params}`}
        title={title}
        tabIndex={-1}
        allow="autoplay; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
        ref={frame}
        className="absolute top-1/2 left-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.4] border-0"
      />
    </div>
  )
}
