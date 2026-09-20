# Content gaps — send to client weekly

Per Section 8 of the quotation, content is client-supplied. This list goes out
every week until it is empty.

| # | Gap | Status | Raised |
|---|---|---|---|
| 1 | Desserts and drinks — no photography, no dish list | Open | 2026-09-18 |
| 2 | Real prices for all 89 dishes — currently placeholder | Open | 2026-09-18 |
| 3 | Calories and allergens for all 89 dishes | Open | 2026-09-18 |
| 4 | Arabic dish names and descriptions — pending native review | Open | 2026-09-18 |
| 5 | Distinct branch story copy for Narjis and Al Yasmin | Open | 2026-09-18 |
| 6 | Real attributed testimonials | Open | 2026-09-18 |
| 7 | Privacy policy and terms copy | Open | 2026-09-18 |
| 8 | Interior and atmosphere photography — 14 named shots, see the shoot list below | Open | 2026-09-18 |
| 9 | Argentina Style Asado calorie value — flagged in quotation | Open | 2026-09-18 |
| 10 | Default social-card OG image — no asset exists; `DEFAULT_OG_IMAGE` is `null` until one is supplied | Open | 2026-09-18 |
| 11 | `short_description` now MIRRORS the long `description` on all 89 dishes, in both locales, so the menu cards read properly. The descriptions happen to be card-length already (47-130 characters), but they were written as dish-page copy. Tighter card-specific lines — roughly 10-14 words — would let the two fields do different jobs. Not blocking. | Open | 2026-09-20 |
| 12 | `ingredients_note` and `preparation_note` are null on **all 89 dishes**. The dish page's "about this dish" band is now reserved for this prose and therefore renders on NO dish at all today; allergens moved inline into the hero. Supplying two or three lines per dish turns the band on and gives each dish page unique copy worth ranking. | Open | 2026-09-20 |

| 13 | Newsletter copy is PLACEHOLDER, written by us, not by the client: the invitation ("Join our list"), what subscribers get, the consent line and the confirmation message, in both locales. The signup is live and stores real addresses, so this copy is a promise the restaurant has to keep. Needs client sign-off before launch, and a decision on what they will actually send and how often. | Open | 2026-09-20 |

## Gap 8 — the shoot list

Fourteen images the homepage and branch pages are built around. None exist, so
every one of them is still `null` in `content/home.json` /
`content/branches.json`. The filenames below are the paths the fixtures will
point at once the files land under `public/`.

**Stand-ins are rendering in the meantime.** `lib/placeholders.ts` maps each
slot to an Unsplash frame, and `components/ui/figure.tsx` falls back to it when
the fixture field is null. The fixtures themselves were deliberately NOT
edited: they are the executable specification the Laravel developer builds
against, and a third-party URL in them would assert that La Rio owns a
photograph it does not.

The three cuisine cards are the exception — they use La Rio's own dish
photography, which already exists in the repo, rather than stock.

**To hand over:** drop the real files under `public/images/`, set the matching
fixture fields, then delete `lib/placeholders.ts` and the `remotePatterns`
entry in `next.config.ts`. Nothing else changes; no component reads either one
directly.

**Homepage — `/images/home/`**

| File | Shot |
|---|---|
| `hero.jpg` | Wide hero. **LCP image and the site's `og:image`** — highest priority of the fourteen. Landscape, ≥ 2400px wide. |
| `chef-story.jpg` | Chef or kitchen team at the open grill, portrait or 4:3. |
| `why-lario.jpg` | Room-and-fire atmosphere shot supporting the "what sets our table apart" section. |
| `cuisine-italian.jpg` | Wood-fired pizza or hand-rolled pasta. |
| `cuisine-turkish.jpg` | Charcoal kebab or mezze spread. |
| `cuisine-argentine.jpg` | Asado / prime cuts over open coals. |
| `gallery-charcoal-grill.jpg` | The open charcoal grill in service. |
| `gallery-dining-room.jpg` | Main dining room, evening light. |
| `gallery-pizza-oven.jpg` | Wood-fired pizza oven. |
| `gallery-courtyard.jpg` | Outdoor courtyard seating. |
| `gallery-plating.jpg` | Plating detail / pass. |
| `gallery-private-room.jpg` | The twelve-seat private dining room at Al Narjis. |

**Branches — `/images/branches/`**

| File | Shot |
|---|---|
| `narjis/hero.jpg` | Al Narjis exterior or entrance. Branch page hero and `og:image`. |
| `al-yasmin/hero.jpg` | Al Yasmin exterior or entrance. Branch page hero and `og:image`. |

Branch `gallery[]` is empty for both branches and is not counted above — it is
open-ended and will take whatever additional interior frames the shoot yields.

## Confirm at kickoff

- Latin slug policy for Arabic URLs
- Split lunch/dinner service hours per branch
- Latin vs Arabic-Indic numerals (currently Latin — `lib/format.ts`)
