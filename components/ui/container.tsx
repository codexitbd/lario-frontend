import type { ReactNode } from 'react'

/**
 * The page's one horizontal rhythm. Sections that bleed (hero, branch split,
 * gallery strip) opt out by not using it; everything else shares this gutter
 * so the type edges line up down the whole page.
 */
export function Container({
  children,
  className = '',
  width = 'default',
}: {
  children: ReactNode
  className?: string
  width?: 'default' | 'narrow'
}) {
  const max = width === 'narrow' ? 'max-w-3xl' : 'max-w-[1400px]'
  return (
    <div className={`mx-auto w-full ${max} px-5 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  )
}
