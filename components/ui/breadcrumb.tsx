import Link from 'next/link'
import { Fragment } from 'react'

/** The dark-band breadcrumb, as on the course pages. The last crumb is the page itself. */
export function Breadcrumb({ items, className = '' }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-[0.6875rem] tracking-[0.2em] text-ivory-dim uppercase ${className}`}>
      <ol className="flex flex-wrap items-center gap-3">
        {items.map((item, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <li aria-hidden="true" className="text-gold/60">
                /
              </li>
            ) : null}
            <li aria-current={item.href ? undefined : 'page'} className={item.href ? '' : 'text-ivory'}>
              {item.href ? (
                <Link href={item.href} className="transition-colors duration-300 hover:text-gold">
                  {item.label}
                </Link>
              ) : (
                item.label
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
