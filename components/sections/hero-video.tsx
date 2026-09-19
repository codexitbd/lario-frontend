'use client'

import { useEffect, useState } from 'react'

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
  const [loaded, setLoaded] = useState(false)
  const [ready, setReady] = useState(false)

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

  // `onLoad` fires when the player document is ready, which is BEFORE the first
  // frame of video is painted. Fading in on it shows a black player for a beat.
  // The short delay lets playback start, and the poster photograph behind holds
  // the frame until then.
  useEffect(() => {
    if (!mounted || !loaded) return
    const timer = window.setTimeout(() => setReady(true), 900)
    return () => window.clearTimeout(timer)
  }, [mounted, loaded])

  if (!mounted) return null

  // loop needs `playlist` set to the same id; without it the video plays once
  // and stops on a still frame with the YouTube end-screen over it.
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    playsinline: '1',
    modestbranding: '1',
    rel: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
  })

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden transition-opacity duration-700 ease-brand ${
        ready ? 'opacity-100' : 'opacity-0'
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
        onLoad={() => setLoaded(true)}
        className="absolute top-1/2 left-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.4] border-0"
      />
    </div>
  )
}
