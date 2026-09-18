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

## Gap 8 — the shoot list

Fourteen images the homepage and branch pages are built around. None exist, so
every one of them is `null` in `content/home.json` / `content/branches.json`
and the components must render without them. The filenames below are the paths
the fixtures will point at once the files land under `public/`.

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
