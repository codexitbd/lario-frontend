# La Rio — Frontend Design Spec

**Date:** 2026-09-18
**Repo:** `lario-web` (Next.js 16 · React 19 · TypeScript · Tailwind v4)
**Scope:** Homepage, Menu, Category, Dish, Branches, Branch detail, Reservation,
Contact, Legal — English and Arabic.
**Status:** Approved in brainstorming. Awaiting implementation plan.

---

## 1. Context and working model

`lario-api` does not exist. The workspace holds `lario-docs` (spec) and
`lario-web` (a default Create Next App scaffold) only.

The engagement sequence has changed from the one in `04-phase-plan.md`. The
frontend is now built **first**, against static JSON. The client approves the
UI, and only then does the backend developer begin. That inverts the phase
plan's run-order rule, and the inversion is deliberate:

> The run-order rule exists so the frontend cannot invent a response shape.
> Here the frontend defines the shape instead — but it defines it **as
> `03-api-contract.md` already specifies it**, so nothing is invented. The JSON
> files become the executable specification the Laravel developer implements
> against.

Every fixture is therefore contract-shaped, not convenient-shaped. Where the
frontend needs a field the contract lacks, the contract is amended in this
document (§5) and in `03-api-contract.md` in the same commit, per the workspace
`CLAUDE.md`.

### Brand assets in hand

`public/golden-logo.png` and `public/original-logo.png`, both 2630×1284 PNG.
Deep emerald green and gold; script "La" paired with a heavy rounded-serif
"Rio"; registered mark. The golden lockup is the single-colour treatment for
dark surfaces, the two-colour original is primary.

### Design reference

The client-approved prototype at `deltaemulatorapk.com` (`index.html`,
`menu.html`, `reservation.html` plus JS-rendered branch, category and dish
views). It is the reference for **layout, section order and content structure
only**. Visual execution is set separately — see §12.

**Pre-kickoff action carried forward from the brief:** that prototype declares
`robots: index,follow` with `canonical: https://lario.sa/`. It must be set to
`noindex, nofollow`, have the canonical removed, and be moved behind HTTP basic
auth on `staging.lario.sa`.

---

## 2. Decisions

Fifteen decisions were settled in brainstorming on 2026-09-18. They are binding
on the implementation plan.

| # | Decision | Rationale |
|---|---|---|
| D1 | Data comes from static JSON, contract-shaped | Frontend leads; JSON is the backend's blueprint |
| D2 | `/menu/[category]` is in scope | Course URLs are the SEO asset; without the page they don't exist |
| D3 | `/branches` index is in scope | `GET /branches` exists; nav needs a target |
| D4 | Keep `private_events`, gallery CTA, full nav | Client override of the scope gate — see §3 |
| D5 | Full prototype nav, Phase-4 items disabled | Client override — see §3 |
| D6 | Menu taxonomy is **course-based** | Matches contract examples and real search intent |
| D7 | `reservation_cta` added as homepage section 10 | One of the 10 approved types; Phase 3.4 needs it |
| D8 | ~~6~~ **4** featured dishes spanning courses | Amended 2026-09-20: reference 02-featured-dishes is a five-column mosaic with exactly four naming tiles, and the client asked for that layout as drawn. Still four distinct courses and all three cuisines, so the internal-link intent holds |
| D9 | 9 categories; desserts/drinks are a content gap | All content is CMS-driven, so adding rows later is free |
| D10 | Category pills **navigate**, they do not filter in place | Prevents `/menu` and `/menu/[category]` competing |
| D11 | Contract extended with `whatsapp`, `seating_preference`, `consent` | WhatsApp is how Saudi restaurants confirm bookings |
| D12 | Reservation is a 4-step stepper with review | Matches approved prototype; converts better on mobile |
| D13 | Mock route handler with realistic 201/422/429 | Error states are Phase 3.4 done-when criteria |
| D14 | Branch page gains a gallery section | Contract returns `gallery[]`; prototype never rendered it |
| D15 | Real Arabic throughout, native review before demo | RTL bugs only surface under real Arabic strings |

Supporting decisions: Latin digits with Arabic currency formatting (D16);
CSS-only animation (D17, amended 2026-09-20: native scroll-driven animations
replaced the planned IntersectionObserver, so no observer and no Motion ship);
Contact built now, legal pages as shared-template stubs (D18); foundation →
homepage → remaining pages build order (D19).

---

## 3. Deviations from the scope gate — logged deliberately

`CLAUDE.md` states: *"Scope gate: Phases 1–3 only. Do not build Phase 4–6
features."* The client has knowingly overridden this in two places. Both were
raised with their costs stated, and both were reaffirmed. They are recorded here
so they read as decisions rather than as drift.

**Deviation 1 — `private_events` homepage section.**
The approved prototype's homepage carries a "Private Events" section (three
cards with statistic numbers). Events are Phase 4 per `00-project-brief.md`, and
`page_sections.type` defines exactly ten values with no slot for it.

*Resolution:* add `private_events` as an eleventh `page_sections.type`. This is a
frontend component plus a Filament select option — no migration, which is
precisely what that table exists for. Its CTA links to `/reservation` rather
than to an unbuilt `/events` page.

**Deviation 2 — full prototype navigation with Phase-4 items disabled.**
The prototype header links to About, Our Story, Our Chef, Gallery, Events and
Blog. All six are Phase 4.

*Resolution:* render them as `<span aria-disabled="true">` with a visible
"coming soon" affordance — never as `<a href>` to a missing route. The brief
names "broken internal links" as a defect this project is paid to fix, and the
Milestone 2 acceptance list requires zero broken internal links. Disabled,
non-navigable items satisfy both while preserving the approved nav shape.

**Not a deviation:** the homepage `gallery_strip` is one of the ten approved
section types. Only the standalone `/gallery` **route** is Phase 4. The strip
ships; its CTA points at the branch galleries instead of `/gallery`.

---

## 4. Architecture

### 4.1 Routes

Ten route patterns, each in two locales. English is unprefixed; Arabic is `/ar/…`
(ADR-006). Every internal link goes through `localePath(locale, path)`.

```
/                                        homepage — 11 sections
/menu                                    all 89 dishes, filtered
/menu/[category]                         9 category pages
/menu/[category]/[dish]                  89 dish pages
/branches                                index
/branches/[slug]                         narjis · al-yasmin
/reservation                             4-step stepper — NOT cached
/contact                                 form — NOT cached
/privacy-policy                          shared legal template
/terms-and-conditions                    shared legal template
```

Branch slugs are exactly `narjis` and `al-yasmin` (ADR-012). Dish URLs come from
the API's authoritative `url` field and are never assembled from parts.

### 4.2 Directory structure

Follows `lario-web/CLAUDE.md` exactly, with one addition (`content/`):

```
app/
├── [locale]/
│   ├── layout.tsx                 lang + dir, loads settings
│   ├── page.tsx                   homepage — section renderer
│   ├── menu/
│   │   ├── page.tsx
│   │   └── [category]/
│   │       ├── page.tsx
│   │       └── [dish]/page.tsx
│   ├── branches/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── reservation/page.tsx
│   ├── contact/page.tsx
│   ├── privacy-policy/page.tsx
│   ├── terms-and-conditions/page.tsx
│   └── not-found.tsx
├── api/reservations/route.ts      mock POST — 201 / 422 / 429
├── api/contacts/route.ts          mock POST — 201 / 422 / 429
├── api/revalidate/route.ts        HMAC-verified, timing-safe compare
└── globals.css                    Tailwind v4 @theme tokens

content/                           ← the backend's blueprint
├── settings.json
├── home.json
├── menu-categories.json
├── menu-items.json
├── branches.json
├── testimonials.json
└── pages/{contact,privacy-policy,terms-and-conditions}.json

components/
├── ui/            Button Container Section Heading Card Input Badge Accordion
├── sections/      one per page_sections.type + index map
├── menu/          MenuCard CategoryGrid DishDetail SearchBox Filters
├── branch/        BranchHero OpeningHours FacilityList BranchMap BranchGallery
├── reservation/   ReservationStepper + step components
└── layout/        Header Footer Nav LocaleSwitcher MobileMenu Breadcrumbs

lib/
├── api/           one typed fetcher per resource
├── cache-tags.ts  mirrors CacheTags.php
├── seo/           buildMetadata() + JSON-LD builders
├── i18n/          dictionaries, t(), localePath(), getDirection()
├── format.ts      price / calorie / date formatting — single switch point
└── utils.ts

types/api.ts                       hand-authored now; replaced by
                                   types/generated/api.d.ts at handoff
messages/{en,ar}.json              UI strings only — never content
proxy.ts                           headers · locale rewrite · redirects
```

### 4.3 The data layer

Each JSON file holds both locales in one document, mirroring the Laravel
translation-table split — parent fields are non-translatable, a `translations`
object carries the copy:

```json
{
  "slug": "argentina-style-asado",
  "price": "189.00",
  "currency": "SAR",
  "calories": 820,
  "translations": {
    "en": { "name": "Argentina Style Asado", "description": "…" },
    "ar": { "name": "أسادو على الطريقة الأرجنتينية", "description": "…" }
  }
}
```

Fetchers in `lib/api/` accept `(locale, …)`, resolve the translation with a
fallback to `en`, and return the **exact** contract response shape — `{ data }`
envelope, resolved `seo` object, absolute image URLs, decimal-string prices,
server-computed `url`. Signatures match what the live API will expose, so the
handoff is a change of data source inside those functions and nothing else.

Fetchers are marked `'use cache'` with `cacheTag()` and `cacheLife('max')` from
the start, so the caching architecture is proven before the API arrives.
`/reservation` and `/contact` carry no `'use cache'`.

**Rules that hold now and after handoff:** never hardcode content in a
component; never assemble a URL from parts; never inline a cache-tag string;
never redeclare an API type locally.

---

## 5. Contract amendments

These change `lario-docs/03-api-contract.md` and
`lario-docs/02-database-schema.md`. Per the workspace `CLAUDE.md`, the contract
edit ships in the same commit as the code that implements it.

**A. `POST /reservations` gains three fields.**

| Field | Type | Validation |
|---|---|---|
| `whatsapp` | string, nullable | E.164 when present |
| `seating_preference` | enum, nullable | `indoor` · `outdoor` · `private` |
| `consent` | boolean, required | must be `true` |

Corresponding `reservations` columns: `whatsapp` (string, nullable),
`seating_preference` (string, nullable), `consent_at` (timestamp, nullable —
stores *when* consent was given, which is the defensible record, rather than a
bare boolean).

New `SeatingPreference` backed enum in `app/Enums/`, rendered as a Filament
select and as radio cards on the frontend.

**B. `page_sections.type` gains an eleventh value: `private_events`.**
No migration — the column is a string. Adds one Filament option and one React
component. See §3, Deviation 1.

**C. `GET /branches` gains a documented consumer.**
The contract defines the endpoint but the phase plan names no page that uses it.
`/branches` is that page. No shape change.

**D. Explicitly unchanged.** No availability logic, no capacity rule, no table
inventory, no double-booking prevention. A reservation is a request; staff
confirm manually. Any task drifting toward availability is the Section 7
BDT 90,000 upgrade and stops.

---

## 6. Homepage — 11 sections

Rendered by a section map keyed on `type`. **An unrecognised `type` renders
`null` and never throws** — an editor adding an unknown section must not
white-screen the homepage.

| # | `type` | Contents |
|---|---|---|
| 0 | `hero` | Eyebrow, H1, lede, Reserve + Explore Menu CTAs. **Built 2026-09-20 without the locations strip or scroll cue** (client decision): full-viewport YouTube film over a poster photograph, nothing beneath the CTAs |
| 1 | `intro` | "Our Table" — three cuisine cards (Italian · Turkish · Argentine) + rich copy |
| 2 | `featured_dishes` | **Four** dishes (D8, amended), five-column mosaic: a double-width hero tile with its naming over the photograph, three flanking columns each split photo / flat naming tile, alternating which half sits on top |
| 3 | `why_lario` | Split: image \| eyebrow, copy, icon list, CTA |
| 4 | `chef_story` | Split reversed, warm ground, framed image, two CTAs |
| 5 | `branch_cards` | "Find Your La Rio" — two cards |
| 6 | `private_events` | Three cards with statistic numbers · CTA → `/reservation` |
| 7 | `gallery_strip` | "In Pictures" — opens the lightbox |
| 8 | `testimonials` | Carousel with prev/next; direction reverses in RTL |
| 9 | `faq` | Accordion |
| 10 | `reservation_cta` | Closing band; branch-preselect deep links |

**Hero performance contract.** Content renders server-side; animation layers on
top and never gates first paint. The hero image carries `priority`; no other
image on the page does.

The hero film is a YouTube embed and is deliberately **not** part of first
paint: the poster photograph is the LCP element, and the iframe is created only
once the browser is idle (`requestIdleCallback`, 2.5s timeout). It is skipped
entirely under `prefers-reduced-motion`. `frame-src` in `proxy.ts` must list
`https://www.youtube-nocookie.com` or the embed is blocked silently.

**Testimonials are displayed, never marked up.** No `Review` or
`AggregateRating` JSON-LD from CMS-entered testimonials — `02-database-schema.md`
flags this as a Google manual-action risk. If the client asks for stars in
search results, the honest route is Google Business Profile.

**JSON-LD:** `Restaurant` on the page, `FAQPage` from section 9.

---

## 7. Menu — three levels

### 7.1 `/menu` — BUILT 2026-09-20

Page hero with breadcrumbs · intro copy · course list · collapsible filter
panel · 89-dish grid **grouped by course** · empty state · full-bleed photo
break · closing visit block.

Course links **navigate to `/menu/[category]`**; they do not filter in place
(D10). Search, dietary and price filters do filter in place and are URL-synced,
so a filtered view is shareable and crawlable.

**The filter controls are collapsed behind a button.** Only the course list is
permanently visible: browsing by course is the common path, and three rows of
chips parked between the courses and the food made the page read as a search
tool. A link arriving with filters opens the panel by itself, and the result
count and Clear stay outside the panel so a short list always has a visible
reason.

**Filtering is client-side.** Reading `searchParams` on the server would make
the route dynamic, and this page carries 89 photographs against a 95+ mobile
target. Every dish is in the static HTML, so a crawler sees the whole card; the
filter only hides what is already there. The query string IS the filter state,
subscribed to with `useSyncExternalStore` — no mirrored `useState` to drift, and
the back button works. Rules live in `components/menu/filters.ts`, away from the
DOM, and are unit-tested.

Search is substring over name, description and course. The predicate is a pure
function, so Phase 2.2 swaps it for a Meilisearch result set without touching
the UI.

Grounds alternate: dark hero, bone browse band, ink grid, bone visit block.

### 7.2 `/menu/[category]`

Page hero with breadcrumbs · **`intro_content` block** · scoped toolbar · item
grid · sibling-category strip · CTA.

`intro_content` is unique per-category prose, not decoration. It is the reason
course-based URLs were chosen and the thing that makes the page rankable. A
category page shipping without it is not done.

`generateStaticParams` returns all nine slugs. Exactly one `h1`.

### 7.3 `/menu/[category]/[dish]`

Breadcrumbs · split hero (image \| name, Arabic name, price, calories,
description) · dietary and allergen badges · ingredients and preparation notes ·
availability state · Reserve CTA · four related dishes from the same category.

`MenuItem` + `BreadcrumbList` JSON-LD. `generateStaticParams` returns all 89.
Prices formatted with `Intl.NumberFormat`, never parsed to a float.

---

## 8. Branches

### 8.1 `/branches`

Page hero · two branch cards · map showing both pins · shared-approach split ·
CTA.

### 8.2 `/branches/[slug]`

| # | Section | Contents |
|---|---|---|
| — | Page hero | Breadcrumbs, eyebrow, branch H1, tagline |
| 1 | Story split | Branch story + two CTAs, image alongside |
| 2 | Long-form copy | Narrow rich text on a dark ground |
| 3 | Popular dishes | Three cards from `popular_dishes` |
| 4 | Gallery | Lightbox-enabled — **added**, see D14 |
| 5 | Visit | Map · facilities · opening hours · directions note · CTA |
| 6 | Branch FAQ | Narrow accordion |
| 7 | Reservation CTA | Deep-links with this branch preselected |

`LocalBusiness` + `BreadcrumbList` + `FAQPage` JSON-LD. `opening_hours` renders
from the raw array; `schema_opening_hours` feeds the JSON-LD — the frontend
never reformats hours itself.

**The map loads lazily and below the fold, never blocking LCP.**

**Copy warning, restated from Phase 3.2:** the two branch pages need genuinely
distinct copy. Two near-identical pages compete and neither ranks. If the client
supplies thin copy, say so in writing.

---

## 9. Reservation

Four steps: **branch → date, time, party size → your details → review and
confirm.** A stepper header shows position; every step is reachable backwards
without data loss.

| Step | Fields |
|---|---|
| 1 | `branch_slug` — radio cards, preselected from a `?branch=` deep link |
| 2 | `reserved_for` (date + time), `party_size` (1–20) |
| 3 | `guest_name`, `guest_email`, `guest_phone`, `whatsapp`, `occasion`, `seating_preference`, `notes`, `consent` |
| 4 | Read-only review of all of the above, then submit |

Zod client-side, mirroring the Form Request rules the backend will apply.
`reserved_for` must be in the future and within 90 days. Phone validated as
E.164. `consent` must be `true`.

**Mock endpoint** at `app/api/reservations/route.ts` returns the contract's
exact `201` shape with a generated `LR-XXXXXX` reference, and can be switched to
return `422` (field errors) or `429` (rate limit) so every error state is built
and demoable. Network failure is handled as a third state.

**Success wording** shows the reference and states that the branch will confirm.
It must never imply a confirmed booking. The wording is signed off in both
languages before the demo.

`Reservation` + `ReservationAction` JSON-LD. Page is not cached.

**RTL note:** the date picker is the single most common Arabic layout break.
It is tested in Arabic explicitly, not assumed.

---

## 10. Shared layer

**Header** — sticky, condenses on scroll. Logo, nav (Phase-4 items
`aria-disabled`), locale switcher, Reserve button, mobile drawer with focus
trapping and Escape to close.

**Footer** — branches, hours summary, contact, social, legal links, locale
switcher.

**Global UI** — gallery lightbox (keyboard-navigable, focus-trapped),
testimonial carousel (reverses in RTL), branch-picker dialog, toast
notifications, skip link, breadcrumbs.

### 10.1 Internationalisation

- Root layout sets `lang` and `dir` from the locale param
- `generateStaticParams` returns `en` and `ar`
- Arabic font via `next/font`, subset, with a real fallback stack
- `messages/{en,ar}.json` carry **UI strings only** — nav labels, form labels,
  buttons, error messages. All content comes from `content/`
- **Logical properties only**: `ms-` `me-` `ps-` `pe-` `start-` `end-`
  `text-start`. Never `ml-` `mr-` `left-` `right-` `text-left`. Enforced from
  the first component — retrofitting is hundreds of edits
- Latin digits with Arabic currency formatting
  (`Intl.NumberFormat('ar-SA-u-nu-latn')`), behind `lib/format.ts` so switching
  to Arabic-Indic is one function change (D16)

### 10.2 Motion

**As built (amends D17).** CSS only, and less of it than planned: scroll
reveals, the parallax drift, the gallery marquee and every hover state are
native CSS in `app/globals.css`. Scroll reveals use `animation-timeline: view()`
behind an `@supports` guard — without the guard a browser lacking support paints
`opacity: 0` and never restores it, hiding the page. No IntersectionObserver
ships and no animation library is in the bundle.

Client components exist only where state is genuinely required: the testimonial
carousel and the hero film. Neither is a wrapper around static content.

`prefers-reduced-motion` respected everywhere — the marquee pauses and resets,
reveals resolve to visible, the carousel switches instantly, and the hero film
is never created at all.

---

## 11. Performance and SEO budget

Non-negotiable, because they are the two things the client is paying for.

- Mobile PageSpeed ≥ 95, desktop ≥ 98, measured throttled — not on localhost
- LCP under 1.5s
- Server Components by default; `'use client'` only for the reservation form,
  menu filters, search box, mobile nav, carousel, lightbox and animation
  wrappers. Every client component is a leaf, never a wrapper around static
  content
- `next/image` everywhere with correct `sizes`, `priority` on the LCP image
  only, explicit dimensions so nothing shifts
- Exactly one `h1` per page, correct heading order beneath it
- Metadata from the `seo` object verbatim via `buildMetadata()` — no client-side
  fallback logic
- Canonical and `alternates.languages` with `x-default` on every page
- Meaningful `alt` on every image; empty only when genuinely decorative
- Keyboard navigable, visible focus states, labelled controls — built in from
  day one even though the formal WCAG-AA pass is Phase 5
- Zero console errors, zero hydration warnings, zero broken internal links
- `npm run build` clean, `npx tsc --noEmit` clean, no `any` in new code

---

## 12. Design direction — as built (2026-09-20)

Set from the client's reference images. Tokens are Tailwind v4 `@theme`
declarations in `app/globals.css`; v4 is CSS-first and there is no
`tailwind.config.js`.

**Palette.** Deep emerald and gold, both sampled from `public/original-logo.png`
rather than eyeballed. Dark grounds `--color-ink` / `--color-ink-raised` /
`--color-emerald`; the light ground is `--color-bone`. One accent: `--color-gold`
on dark, `--color-gold-ink` on bone — the same hue carried down far enough to
pass AA. `--color-scrim` is a separate near-black for media overlays, because
tinting a photograph with the emerald ground greens the whole frame.

**Grounds alternate.** Pages are NOT uniformly dark. On the homepage `intro`,
`chef_story` and `faq` sit on bone and everything else is ink or emerald; on
`/menu` the hero is dark, the browse band is bone, the dish grid is ink and the
visit block is bone. `SectionHeader` and `Cta` take a `tone` prop for this —
passing the wrong one produces gold that fails contrast.

**Type.** Bodoni Moda for display via `.lr-display`, Inter for body and UI.
Arabic display falls back to IBM Plex Sans Arabic at 600: Bodoni has no Arabic,
and a synthesised oblique on Arabic glyphs reads as a rendering fault, so
`.lr-display` also forces `font-style: normal` under `dir="rtl"`. A real Arabic
display serif is one `next/font` call away if the client wants parity.

**Shape.** Square corners everywhere — buttons, inputs, cards, panels. The one
documented exception is a photographic ARCH mask, used on the menu's visit block
and taken from the reference.

**Motion.** CSS only. Scroll reveals use native `animation-timeline: view()`
behind an `@supports` guard, so nothing ships an IntersectionObserver and no
animation library is in the bundle. `prefers-reduced-motion` is honoured
throughout, including skipping the hero film entirely.

**Typographic house rules.** No em dash and no en dash in any visible string,
in either locale — the Arabic faces do not carry them, so a dash falls back to a
different font mid-sentence. `content/fixtures.test.ts` fails the build on one.
Ranges and time spans use a plain hyphen. Arabic also disables `letter-spacing`
globally, because tracking breaks the joins in a connected script.

---

## 13. Content inventory

`public/menu/` holds 92 files; 89 are usable dishes. Three are junk and should
be deleted: `Argentine/Untitled-1.jpg`, `Italian/Italian.psd`, and
`Turkish/Italian.jpg` (an Italian image misfiled in the Turkish folder).

Re-mapped from cuisine folders to courses (D6):

| Category | Dishes |
|---|---|
| Cold Mezze | 10 |
| Starters | 9 |
| Salads | 12 |
| Soups | 4 |
| Pasta & Risotto | 8 |
| Pizza | 8 |
| Kebabs & Skewers | 12 |
| Steaks & Mains | 19 |
| Sides | 7 |
| **Total** | **89** |

Cuisine (Italian · Turkish · Argentine) survives as a filter facet and as the
homepage's narrative spine — it is not a URL segment.

### 13.1 Content gaps — send weekly, in writing

Per Section 8 of the quotation, content is the client's to supply, and
`00-project-brief.md` names content delay as the single largest risk to the
delivery date. Track these from day one:

1. **Desserts and drinks** — zero photography exists, yet the prototype's own
   menu page advertises "desserts, mocktails and more"
2. **Prices, calories and allergens** — none supplied for any of the 89 dishes;
   seeded with realistic placeholders meanwhile
3. **Arabic dish names and descriptions** — generated now, pending native review
4. **Branch copy** — distinct story and long-form text per branch
5. **Testimonials** — real, attributed guest quotes
6. **Legal copy** — privacy policy and terms
7. **Interior and atmosphere photography** — for hero, chef story and galleries
8. **Argentina Style Asado calorie value** — already flagged in the quotation as
   needing written confirmation

### 13.2 Confirm at kickoff

- **Latin slug policy.** One slug per model, shared by both locales. The Arabic
  page renders fully in Arabic; only the slug stays Latin. Visible decision,
  far easier to agree now than to reverse
- **Split service hours.** If either branch runs separate lunch and dinner
  service, `opening_hours` needs multiple rows per day, which changes both the
  schema and the `LocalBusiness` JSON-LD output
- **Arabic numeral style.** Latin digits are the default (D16); confirm

---

## 14. Build order

1. **Foundation** — Tailwind v4 tokens, layout shell, i18n, `proxy.ts`,
   `lib/format.ts`, `lib/seo/`, UI primitives, the `content/` fixtures
2. **Homepage** — all 11 sections, the proving ground for every pattern
3. **Client approval gate** — the remaining pages inherit these decisions, so a
   change of direction here costs one page instead of five
4. `/menu` → `/menu/[category]` → `/menu/[category]/[dish]`
5. `/branches` → `/branches/[slug]`
6. `/reservation` including the mock endpoint and all error states
7. `/contact`, then the shared legal template
8. Arabic pass — native review, RTL sweep, date picker verified in Arabic
9. Performance pass — throttled PageSpeed on homepage, a category page and a
   dish page

Each page is built in both locales together. Never "English now, Arabic later" —
the spec is explicit that this is how RTL bugs get expensive.

---

## 15. Out of scope

**Phase 4–6, not built:** blog, events pages, offers, standalone About / Our
Story / Our Chef / Gallery routes, in-admin SEO dashboard, `sitemap.ts` /
`robots.ts` sweep, formal WCAG-AA pass, redirect map, analytics cleanup, CI/CD,
production deploy.

*(The homepage `private_events` **section** and the disabled nav items are the
logged exceptions in §3.)*

**Permanently out — Section 7 paid upgrades:** advanced reservation admin
(calendar, table assignment, blackout dates, no-show tracking), WhatsApp
Business API, monthly SEO retainer, extended maintenance, mobile app.

**Backend, not in this repo:** Laravel scaffolding, migrations, Filament panel,
roles and policies, Meilisearch, mail, the revalidation webhook's server half.
The frontend ships `app/api/revalidate/route.ts` with HMAC verification and a
timing-safe compare, because the route handler is frontend code.

---

## 16. Done

The UI approval round is complete when, in **both** English and Arabic:

- All ten routes render with correct `lang` and `dir`, no RTL breaks
- The homepage shows all 11 sections; an unknown section type renders nothing
  rather than throwing
- Menu filters and search work, are URL-synced, and are keyboard-navigable
- Category pills navigate; every category page has unique intro copy
- All 89 dish pages resolve with unique titles and meta descriptions
- Both branch pages render all eight blocks with distinct copy
- The reservation stepper completes end to end, and the 422, 429 and network
  failure states are each demonstrable
- The Arabic date picker works correctly in RTL
- Every page has a unique title and description visible in view-source
- Phase JSON-LD passes rich-results testing
- Mobile PageSpeed ≥ 95 on the homepage, a category page and a dish page
- Zero console errors, zero hydration warnings, zero broken internal links
- Arabic reviewed by an actual Arabic reader — not by eye, not by translator
- `npm run build` and `npx tsc --noEmit` both clean
