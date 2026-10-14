'use client'

import Image from 'next/image'
import { type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode, useRef, useState } from 'react'
import { CaretLeftIcon, CaretRightIcon, XIcon } from '@phosphor-icons/react/ssr'
import { interpolate } from '@/lib/i18n/interpolate'

export type ViewerPhoto = { url: string; alt: string; caption: string | null; album: string }

type Labels = { viewer: string; close: string; previous: string; next: string; position: string }

const BUTTON =
  'inline-flex size-12 items-center justify-center border border-ivory/20 text-ivory transition-[border-color,color,transform] duration-300 ease-brand hover:border-gold hover:text-gold active:translate-y-px'

/**
 * The gallery's full-screen viewer, wrapped around the server-rendered grid.
 *
 * Every frame in the grid is a plain link to the photograph, so the page works
 * without JavaScript; this island intercepts those clicks (unless a modifier
 * key asks for a new tab) and opens the frame in a native <dialog>. The browser
 * supplies the focus trap, Escape to close and the inert page behind it, and
 * hands focus back to the frame that opened it.
 *
 * Arrow keys step through every photograph on the page, album to album, and
 * wrap at the ends. They follow reading direction: in Arabic the right arrow
 * goes back. Home and End jump to the first and last. Touch swipes do the same.
 * Only the open frame and its two neighbours are mounted, so the next step is
 * already loaded and nothing loads while the viewer is shut.
 */
export function GalleryViewer({ photos, labels, children }: { photos: ViewerPhoto[]; labels: Labels; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const swipeFrom = useRef<number | null>(null)
  const [index, setIndex] = useState<number | null>(null)
  const total = photos.length

  const step = (by: number) => setIndex((current) => (current === null ? current : (current + by + total) % total))
  const forward = () => (document.documentElement.dir === 'rtl' ? -1 : 1)

  function onGridClick(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-photo]')
    if (!link) return
    event.preventDefault()
    setIndex(Number(link.dataset.photo))
    dialog.current?.showModal()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    const moves: Record<string, () => void> = {
      ArrowRight: () => step(forward()),
      ArrowLeft: () => step(-forward()),
      Home: () => setIndex(0),
      End: () => setIndex(total - 1),
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    move()
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const from = swipeFrom.current
    swipeFrom.current = null
    if (from === null) return
    const distance = event.clientX - from
    // Swiping the picture away to the left brings the next one in (mirrored in Arabic).
    if (Math.abs(distance) > 48) step(distance < 0 ? forward() : -forward())
  }

  const photo = index === null ? null : photos[index]

  return (
    <div onClick={onGridClick}>
      {children}

      <dialog
        ref={dialog}
        aria-label={labels.viewer}
        onKeyDown={onKeyDown}
        onClose={() => setIndex(null)}
        className="lr-lightbox m-0 h-dvh max-h-none w-full max-w-none border-0 bg-scrim p-0 text-ivory"
      >
        {photo && index !== null ? (
          <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto]">
            <div className="flex justify-end px-4 pt-4 sm:px-8 sm:pt-6">
              <button type="button" className={BUTTON} aria-label={labels.close} onClick={() => dialog.current?.close()}>
                <XIcon size={20} weight="light" />
              </button>
            </div>

            <div
              className="relative mx-4 my-4 touch-pan-y sm:mx-8"
              onPointerDown={(event) => {
                if (event.pointerType === 'touch') swipeFrom.current = event.clientX
              }}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (swipeFrom.current = null)}
            >
              {/* Neighbours load in the background, invisible and unannounced. */}
              {[-1, 1].map((offset) => {
                const neighbour = photos[(index + offset + total) % total]
                return total > 1 ? (
                  <Image key={`${offset}-${neighbour.url}`} src={neighbour.url} alt="" aria-hidden fill sizes="100vw" loading="eager" className="invisible object-contain" />
                ) : null
              })}
              <Image key={photo.url} src={photo.url} alt={photo.alt} fill sizes="100vw" priority className="lr-lightbox-frame object-contain" />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-t border-ivory/10 px-4 py-5 sm:px-8 sm:py-6">
              <div aria-live="polite" className="min-w-0 max-w-[60ch]">
                {photo.caption ? <p className="lr-display text-lg leading-snug md:text-xl">{photo.caption}</p> : null}
                <p className={`text-sm text-ivory-dim ${photo.caption ? 'mt-1' : ''}`}>{photo.album}</p>
              </div>

              <div className="flex items-center gap-3">
                <p className="me-3 text-sm text-ivory-dim tabular-nums">
                  {interpolate(labels.position, { current: String(index + 1), total: String(total) })}
                </p>
                <button type="button" className={BUTTON} aria-label={labels.previous} onClick={() => step(-1)}>
                  <CaretLeftIcon size={20} weight="light" className="rtl:-scale-x-100" />
                </button>
                <button type="button" className={BUTTON} aria-label={labels.next} onClick={() => step(1)}>
                  <CaretRightIcon size={20} weight="light" className="rtl:-scale-x-100" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  )
}
