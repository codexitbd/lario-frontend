# Content gaps — send to client weekly

Per Section 8 of the quotation, content is client-supplied. This list goes out
every week until it is empty.

**Since 2026-10-04 every item below is filled in the admin panel**
(`https://larioadmin.dtechonline.dev/admin` on staging), not in code. The
fixture files named further down were imported into the CMS and are no longer
read by the site. Photo sizes per upload slot:
`lario-backend/docs/IMAGE-SIZES.md`. Where each gap is entered:

| Gap | Admin |
|---|---|
| 1, 2, 3, 4, 9, 11, 12 | Menu → Dishes / Menu categories (prices, calories, dish tags, EN/AR text) |
| 5 | Restaurant → Branches → story |
| 6 | Content → Testimonials (Google reviews import daily once Settings → Integrations has a Places API key) |
| 7 | Pages → `privacy-policy`, `terms-and-conditions` |
| 8 | the photo slots on Pages, Branches, Cuisines, Gallery albums |
| 10 | Settings → Branding → Default social share image |
| 13 | Pages → Site texts (and the Newsletter component's copy) |

| # | Gap | Status | Raised |
|---|---|---|---|
| 1 | Desserts and drinks — no photography, no dish list | Open | 2026-09-18 |
| 2 | Real prices for all 89 dishes — currently placeholder | Open | 2026-09-18 |
| 3 | Calories and allergens for all 89 dishes | Open | 2026-09-18 |
| 4 | Arabic dish names and descriptions — pending native review | Open | 2026-09-18 |
| 5 | Distinct branch story copy for Narjis and Al Yasmin | Open | 2026-09-18 |
| 6 | Real attributed testimonials | Resolved 2026-09-30: seven Google reviews of Al Narjis, verbatim contiguous excerpts with surnames reduced to an initial, Arabic bodies translated from the originals. Al Yasmin reviews and the client's own choice of featured ones still to come | 2026-09-18 |
| 7 | Privacy policy and terms copy | Open | 2026-09-18 |
| 8 | Interior and atmosphere photography — 14 named shots, see the shoot list below | Open | 2026-09-18 |
| 9 | Argentina Style Asado calorie value — flagged in quotation | Open | 2026-09-18 |
| 10 | Default social-card OG image — no asset exists; `seo.og.image` falls back to `null` until one is uploaded in Settings → Branding | Open | 2026-09-18 |
| 11 | `short_description` now MIRRORS the long `description` on all 89 dishes, in both locales, so the menu cards read properly. The descriptions happen to be card-length already (47-130 characters), but they were written as dish-page copy. Tighter card-specific lines — roughly 10-14 words — would let the two fields do different jobs. Not blocking. | Open | 2026-09-20 |
| 12 | `ingredients_note` and `preparation_note` are null on **all 89 dishes**. The dish page's "about this dish" band is now reserved for this prose and therefore renders on NO dish at all today; allergens moved inline into the hero. Supplying two or three lines per dish turns the band on and gives each dish page unique copy worth ranking. | Open | 2026-09-20 |

| 13 | Newsletter copy is PLACEHOLDER, written by us, not by the client: the invitation ("Join our list"), what subscribers get, the consent line and the confirmation message, in both locales. The signup is live and stores real addresses, so this copy is a promise the restaurant has to keep. Needs client sign-off before launch, and a decision on what they will actually send and how often. | Open | 2026-09-20 |

## Gap 8 — the shoot list

Fourteen images the homepage and branch pages are built around. None exist yet.
The filenames below name the shots; they were the planned `public/` paths
during the fixture phase and now simply identify each frame.

**Stand-ins are rendering in the meantime.** `lib/placeholders.ts` maps each
slot to an Unsplash frame, and `components/ui/figure.tsx` falls back to it when
the API returns no image for that slot. No stock URL is stored in the CMS, so
nothing asserts that La Rio owns a photograph it does not.

The three cuisine cards are the exception — they use La Rio's own dish
photography, imported into the CMS.

**To hand over:** upload each photo to its slot in the admin (sizes in
`lario-backend/docs/IMAGE-SIZES.md`). Once every slot has a real photo, delete
`lib/placeholders.ts` and the Unsplash `remotePatterns` entry in
`next.config.ts`. No component reads either one directly.

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

The contact page (built 2026-10-01) adds one more slot with no fixture field
behind it, `contact.hero` in `lib/placeholders.ts`: a wide entrance-at-dusk
shot for `/contact`, like the menu page's own stand-ins. Its two room
photographs reuse the branch frames above.

The branch pages (built 2026-10-01) use `narjis/hero.jpg` and
`al-yasmin/hero.jpg` for their heroes and add a second frame per room,
`branch.<slug>.story` in `lib/placeholders.ts`, for the arch beside the story:
Narjis's street entrance, Al Yasmin's courtyard. When the shoot lands those
are the first two frames of each branch's `gallery[]`, which also switches on
the gallery grid.

Branch `gallery[]` is empty for both branches and is not counted above — it is
open-ended and will take whatever additional interior frames the shoot yields.

## Confirm at kickoff

- Latin slug policy for Arabic URLs
- Split lunch/dinner service hours per branch
- Latin vs Arabic-Indic numerals (currently Latin — `lib/format.ts`)
