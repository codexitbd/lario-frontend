# Design references

Drop reference images here. This file is the map between an image and the
section it governs.

**A fresh session starts here.** It has none of the context from the session that
built the foundation — this file and `NOTES.md` are how the design intent
reaches it.

---

## Status — 2026-09-20

| Slot | Reference supplied | Built |
|---|---|---|
| `homepage/` | yes, 17 images | **yes** — all 11 sections, EN + AR |
| `menu/menu.png` | yes, 1 image | **yes** — `/menu` landing, EN + AR |
| `menu/` category + dish | **no** | **yes** — built from the `/menu` language, since no reference was supplied |
| `branches/` | no | no |
| `reservation/` | no | no |
| `contact/` | no | no |
| `shared/` | **yes, 4 images** — header + footer, each desktop and mobile | **header and footer yes**; locale switcher, lightbox, branch picker and toasts still blocked |

The design system produced from these is recorded in the spec's §12 and
summarised in `../lario-web-CLAUDE.md`. Read that before adding a page: the
palette, the bone/dark ground alternation, the square-corner rule and the
no-dash typographic rule are all already decided, and a new page should inherit
them rather than re-derive them.

**The shared layer is partly unblocked.** Four references landed on 2026-09-20
and the header and footer are built from them. The locale switcher, gallery
lightbox, branch-picker dialog and toasts still have no reference. Drop images
into `shared/` when they exist.

---

## How to use this in a fresh session

```
/design-taste-frontend

Build the homepage from design/references/homepage/.
Section inventory and numbering: docs/superpowers/specs/2026-09-18-lario-frontend-design.md §6
Per-image intent: design/NOTES.md
```

Point it at one page area at a time, not the whole folder. The spec's numbered
sections are the contract for *what* gets built; these images are the contract
for *how it looks*.

Read `../lario-web-CLAUDE.md` first regardless — it carries the hard rules
(RTL logical properties, Cache Components, the fetcher pattern) that apply no
matter what the design says.

---

## Naming

```
NN-slug.ext
```

`NN` is the section number from the spec. Extension can be `.png`, `.jpg` or
`.webp` — whatever your source is.

Multiple angles on one section are fine — suffix them:

```
00-hero.png
00-hero-mobile.png
00-hero-scrolled.png
```

Anything you cannot map to a slot: name it `misc-<whatever>.png` and describe it
in `NOTES.md`. Do not force it into a numbered slot.

---

## Slots

### `homepage/` — spec §6, eleven sections

| File | Section | Contents |
|---|---|---|
| `00-hero.*` | `hero` | Eyebrow, H1, lede, two CTAs, locations strip, scroll cue |
| `01-intro.*` | `intro` | "Our Table" — three cuisine cards + rich copy |
| `02-featured-dishes.*` | `featured_dishes` | Six dishes, 2×3, → View Full Menu |
| `03-why-lario.*` | `why_lario` | Split: image \| copy + icon list + CTA |
| `04-chef-story.*` | `chef_story` | Split reversed, warm ground, framed image |
| `05-branch-cards.*` | `branch_cards` | "Find Your La Rio" — two cards |
| `06-private-events.*` | `private_events` | Three cards with stat numbers |
| `07-gallery-strip.*` | `gallery_strip` | "In Pictures" — opens the lightbox |
| `08-testimonials.*` | `testimonials` | Carousel, prev/next, reverses in RTL |
| `09-faq.*` | `faq` | Accordion |
| `10-reservation-cta.*` | `reservation_cta` | Closing band, branch-preselect links |

### `menu/` — spec §7, three routes

| File | Route |
|---|---|
| `landing-*.*` | `/menu` — hero, toolbar (search, category pills, dietary, price), 89-card grid, empty state, CTA band |
| `category-*.*` | `/menu/[category]` — hero, `intro_content` block, scoped toolbar, item grid, sibling strip |
| `dish-*.*` | `/menu/[category]/[dish]` — breadcrumbs, split hero, dietary/allergen badges, notes, 4 related |

### `branches/` — spec §8

| File | Route |
|---|---|
| `index-*.*` | `/branches` — hero, two cards, dual-pin map, shared-approach split |
| `detail-*.*` | `/branches/[slug]` — hero, story split, long copy, 3 popular dishes, gallery, visit block (map/facilities/hours), FAQ, CTA |

### `reservation/` — spec §9, four steps

| File | Step |
|---|---|
| `step-1-branch.*` | Branch selection — radio cards |
| `step-2-when.*` | Date, time, party size |
| `step-3-details.*` | Contact fields, occasion, seating, consent |
| `step-4-review.*` | Read-only review before submit |
| `success.*` | Reference shown; wording says the branch **will confirm** |
| `errors.*` | Field errors, rate limit, network failure |

### `contact/` — spec §4.1 (route list); no dedicated section

| File | Contents |
|---|---|
| `contact-*.*` | Hero, form, phone/WhatsApp/email, two branch mini-cards, map |

### `shared/` — spec §10, cross-page

**Mind the filenames — they are swapped.** `header-mobile.png` is the DESKTOP
header drawn in full; `header.png` is the condensed state. Supplied as-is by the
client; the components are built to the drawings, not to the names.

| File | Contents | Built |
|---|---|---|
| `header-mobile.*` | The full desktop header: utility strip (address, phone, email), wordmark, centred nav with an active rule, outlined Reserve button | **yes** |
| `header.*` | The condensed state: wordmark and a hamburger on a dark ground | **yes** |
| `footer.*` | Three zones plus a bottom rule. **RETIRED 2026-09-20** — it is a lab-automation SaaS footer and its vocabulary is boxes. Two passes copied it faithfully and produced ten containers in a fine-dining footer. Do not build from it again | superseded |
| `footer-mobile.*` | The same three zones stacked to one column | superseded, as above |
| `lightbox.*` | Gallery viewer | no reference |
| `carousel.*` | Testimonial controls | no reference |
| — | Locale switcher, branch-picker dialog, toasts | no reference |
| `branch-dialog.*` | Branch picker modal |
| `toast.*` | Form feedback |

---

## Two things worth capturing while you add images

**Arabic.** Every one of these renders in both English and Arabic with the
layout mirrored. If you have a reference showing RTL — or a strong opinion about
how the header, carousel or date picker should behave when mirrored — that is
worth more than another English screen. Those three are where RTL breaks first.

**What you are pointing at.** A reference usually carries a specific intent —
the spacing, the type scale, the photo treatment — not "copy this". `NOTES.md`
is where you say which. A note like *"spacing and type scale only, our palette"*
saves an entire revision cycle.

If a reference comes from another restaurant's site, treat it as direction
rather than something to reproduce — say what you want taken from it, and the
build stays original.
