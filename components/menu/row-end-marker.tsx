'use client'

import { useEffect, useRef } from 'react'

/**
 * Marks each item that ends a wrapped row with `data-row-end`, so the course
 * separator can drop there instead of dangling at the edge of a line. CSS can
 * not tell where a centred flex row wraps. Without JS the bars just show.
 */
export function RowEndMarker({ className, children }: { className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const list = ref.current
    if (!list) return
    const mark = () => {
      const items = [...list.children] as HTMLElement[]
      items.forEach((item, i) => {
        const next = items[i + 1]
        item.toggleAttribute('data-row-end', !next || next.offsetTop > item.offsetTop + item.offsetHeight / 2)
      })
    }
    const observer = new ResizeObserver(mark)
    observer.observe(list)
    return () => observer.disconnect()
  }, [])

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  )
}
