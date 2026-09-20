import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * The site's navigation, in one place, so the header, the mobile drawer and
 * the footer cannot drift apart.
 *
 * TWO LISTS, and the split is the point. `PRIMARY_NAV` are Phase 1-3 routes:
 * real destinations, rendered as links. `DEFERRED_NAV` are the Phase-4 items
 * the approved prototype shows — About, Our Story, Our Chef, Gallery, Events,
 * Journal. Spec §3 (deviation 2) requires they keep their place in the nav
 * shape but NEVER render as `<a href>` to a route that does not exist: the
 * brief names broken internal links as a defect this project is paid to fix,
 * and Milestone 2 accepts on zero of them. So they carry no href at all here —
 * there is nothing for a component to accidentally link to.
 *
 * Keys are dictionary keys, not labels. Labels come from `messages/{en,ar}.json`
 * through `dict.nav`, so the Arabic nav is a translation rather than a second
 * copy of this list that can fall behind.
 */
export type NavKey = keyof Dictionary['nav']

export type NavLink = { key: NavKey; href: string }

export const PRIMARY_NAV: readonly NavLink[] = [
  { key: 'home', href: '/' },
  { key: 'menu', href: '/menu' },
  { key: 'branches', href: '/branches' },
  { key: 'reservation', href: '/reservation' },
  { key: 'contact', href: '/contact' },
]

export const DEFERRED_NAV: readonly NavKey[] = [
  'about',
  'story',
  'chef',
  'gallery',
  'events',
  'blog',
]

export const LEGAL_NAV: readonly { key: 'privacy' | 'terms'; href: string }[] = [
  { key: 'privacy', href: '/privacy-policy' },
  { key: 'terms', href: '/terms-and-conditions' },
]

/**
 * Whether a nav link is the page being viewed. `pathname` arrives already
 * locale-prefixed, so compare against the prefixed href rather than stripping.
 *
 * Sections match their whole subtree — /menu stays marked while the reader is
 * deep in /menu/kebabs/urfa-kebab. Home must NOT, or it lights up everywhere.
 *
 * `exact` is a parameter rather than a `target === "/"` test inside, because
 * the Arabic home is `/ar`, not `/`: inferring it from the string marked the
 * home item active on every Arabic page in the site. Only the caller knows
 * which item is home, so only the caller can say.
 */
export function isActivePath(
  pathname: string,
  localisedHref: string,
  exact = false,
): boolean {
  const here = pathname.replace(/\/+$/, '') || '/'
  const target = localisedHref.replace(/\/+$/, '') || '/'
  if (exact || target === '/') return here === target
  return here === target || here.startsWith(`${target}/`)
}
