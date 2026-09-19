/**
 * Stand-in photography for the shots the client has not supplied yet.
 *
 * DELETE THIS FILE when the real shoot lands. It is the only place these URLs
 * exist, and `components/ui/figure.tsx` is the only thing that reads it.
 *
 * The fixtures deliberately still carry `null` for every one of these slots.
 * `content/*.json` is the executable specification the Laravel developer builds
 * against, and writing a third-party URL into it would tell them La Rio owns a
 * photograph it does not. The gap stays visible in `docs/content-gaps.md`; only
 * the rendering is filled in.
 *
 * Branch frames are chosen darker than the rest on purpose: those panels lay
 * a full block of copy over the photograph on hover, and a bright frame there
 * costs contrast that the scrim then has to fight.
 *
 * Two sources, on purpose:
 *   - Interiors, exteriors, the chef and the grill are Unsplash frames, chosen
 *     by eye for subject rather than by ID.
 *   - The three cuisine cards use La Rio's OWN dish photography, which already
 *     exists in the repo. A real Italian, Turkish and Argentine plate beats any
 *     stock frame for the one section whose whole job is naming the cuisines.
 */

const UNSPLASH = 'https://images.unsplash.com/photo-'
const PARAMS = 'auto=format&fit=crop&q=70'

function unsplash(id: string, width: number, height: number): string {
  return `${UNSPLASH}${id}?${PARAMS}&w=${width}&h=${height}`
}

/** Keys are slot names, not fixture fields — a slot is one composition. */
export const PLACEHOLDERS = {
  'home.hero': unsplash('1590846406792-0adc7f938f1d', 2400, 1400),

  'home.cuisine.italian': '/images/menu/Italian/pizza-la-rio-signature.jpg',
  'home.cuisine.turkish': '/images/menu/Turkish/urfa-kebab.jpg',
  'home.cuisine.argentine': '/images/menu/Argentine/assado-argentina-style.jpg',

  'home.why-lario': unsplash('1543007630-9710e4a00a20', 900, 1200),
  'home.why-lario.secondary': unsplash('1552566626-52f8b828add9', 1200, 900),
  'home.chef-story': unsplash('1551218808-94e220e084d2', 1100, 1400),
  'home.private-events': unsplash('1414235077428-338989a2e8c0', 2000, 1200),

  'home.events.0': unsplash('1550966871-3ed3cdb5ed0c', 900, 1200),
  'home.events.1': unsplash('1528605248644-14dd04022da1', 900, 1200),
  'home.events.2': unsplash('1555939594-58d7cb561ad1', 900, 1200),
  'home.testimonials': unsplash('1592861956120-e524fc739696', 1200, 900),

  'home.gallery.0': unsplash('1558030006-450675393462', 1000, 750),
  'home.gallery.1': unsplash('1424847651672-bf20a4b0982b', 1000, 750),
  'home.gallery.2': unsplash('1555396273-367ea4eb4db5', 1000, 750),
  'home.gallery.3': unsplash('1559339352-11d035aa65de', 1000, 750),
  'home.gallery.4': unsplash('1504674900247-0877df9cc836', 1000, 750),
  'home.gallery.5': unsplash('1600891964599-f61ba0e24092', 1000, 750),

  // Menu page. The two `visit` frames deliberately repeat frames used small
  // elsewhere on the site (a branch panel and a gallery tile); they are shown
  // large here and nowhere near them, and they go the moment the real shoot
  // lands. Every other slot is unique.
  'menu.hero': unsplash('1574126154517-d1e0d89ef734', 2400, 1400),
  'menu.band': unsplash('1509440159596-0249088772ff', 2400, 1000),
  'menu.visit': unsplash('1517248135467-4c7edcad34c4', 1100, 1400),
  'menu.visit.inset': unsplash('1504674900247-0877df9cc836', 800, 600),

  'branch.narjis': unsplash('1514933651103-005eec06c04b', 1600, 1200),
  'branch.al-yasmin': unsplash('1517248135467-4c7edcad34c4', 1600, 1200),
} as const

/**
 * Stand-in hero film: a public, no-copyright restaurant stock-footage clip,
 * verified through YouTube's oEmbed endpoint rather than assumed from an id.
 *
 * Replace it by setting `video` on the hero section's payload in
 * content/home.json to the client's own YouTube id — the component prefers the
 * fixture and only falls back here. Goes with the rest of this file at
 * handover.
 */
export const PLACEHOLDER_HERO_VIDEO = 'JoXjnT4t0U8'

export type PlaceholderSlot = keyof typeof PLACEHOLDERS

export function placeholderFor(slot: string | undefined): string | null {
  if (!slot) return null
  return PLACEHOLDERS[slot as PlaceholderSlot] ?? null
}
