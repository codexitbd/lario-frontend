# Per-image intent

What to take from each reference — and what to ignore. One row per image.

A reference almost never means "copy all of this". Saying which part you mean
is the difference between one pass and three.

| Image | Take from it | Ignore |
|---|---|---|
|`homepage/00-hero.png` | Full-bleed image (in future video), type scale, the CTA in white bg dark text | Its palette — use ours. Its nav — we will design our nav later. |
|`homepage/00-hero-mobile.png` | Full-bleed image (in future video), type scale, the CTA in white bg dark text | Its palette — use ours. Its nav — we will design our nav later. |
|`homepage/00-hero-mobile-scroll.png` | going to cut shape like bottom when scroll use cliping mask | Its palette — use ours. Its nav — we will design our nav later. |
|`homepage/01-intro.png` | the exact desing of card with 3 type of desh that we have | Its palette — use ours. and ignore the top cut shape |
|`homepage/01-intro-hover.png` | show the name and short catchy descrioption like the image on hover with golden glow from out golden color | Its palette — use ours. |
|`homepage/01-intro-mobile.png` | same card after section text comes one after one hover effect work on tap | Its palette — use ours. |
|`homepage/01-intro-bottom.png` | keep the bottom shape like this and parelax to the next section | Its palette — use ours. |
|`homepage/02-featured-dishes.png` | the desing shown only 4 but i want you to modify this same desing referance into 6 | Its palette — use ours. |
|`homepage/03-why-lario.png` | the exact layout | Its palette — use ours, its content - use our. |
|`homepage/04-chef-story.png` | the exact layout | Its palette — use ours, its content - use our. |
|`homepage/05-branch-cards.png` | the exact layout and place the 2 branch as the branch content | Its palette — use ours, its content - use our. |
|`homepage/05-branch-cards-on-hover.png` | on hover scale image and width  | Its palette — use ours, its content - use our. |
|`homepage/05-branch-cards-on-other-hover.png` | on hover scale image and width  | Its palette — use ours, its content - use our. |
|`homepage/06-private-events.png` | the layout  | Its palette — use ours, its content - use our, not the rounded corner - use corner like other desing. |
|`homepage/07-gallery-strip.png` | the layout and on hover image will be 0 degree and will have a autoplay caresol so its moving and on hover it stop  | Its palette — use ours, its content - use our, not the rounded corner - use corner like other desing. |
|`homepage/08-testimonials.png` | the layout  | Its palette — use ours, its content - use our. |
|`homepage/08-testimonials-next-transition.png` | when autoplay starts the image will over another like the screenshot effect and also the text  | Its palette — use ours, its content - use our. |
|`shared/header-mobile.png` | THE DESKTOP HEADER despite the filename. Two decks: a hairline utility strip (pin + address, phone, email) over a main bar with the wordmark, a centred nav, an active-item rule, and an outlined Reserve button. Transparent over the hero. | Its palette and face. Its dropdown carets — our Phase-4 items are disabled, not parents. Its six-item nav list; ours is the five live routes. |
|`shared/header.png` | The CONDENSED state: wordmark plus a hamburger on a dark ground. This is what the header becomes on scroll, and what it is at mobile width. | Its "P." mark — we set our own wordmark in Bodoni. |
|`shared/footer.png` | **RETIRED 2026-09-20.** Was layout-only. Three zones across the top, link tiles in two columns, one wide action with an arrow box at its end, and a bottom rule carrying social, copyright and legal. | Everything, now. It is a lab-automation SaaS footer: its whole vocabulary is boxes, and copying its composition faithfully put ten containers in a fine-dining footer. The rule for our footer is zero containers. Its newsletter panel is the one idea that survived, and only because the client asked for it separately. |
|`shared/footer-mobile.png` | Retired with the desktop drawing. | As above. |

---

## Direction that applies to everything

Fill these in once and they cover every section — often more useful than any
single image.

**Overall feeling** — e.g. restrained and editorial / warm and dense / high
contrast and cinematic:

**Type** — serif or sans for headings? Do you want the logo's script "La"
echoed anywhere, or is the wordmark left alone?

**Density** — generous whitespace, or a fuller page that shows more food per
screen?

**Photography treatment** — full-bleed, framed, rounded corners, duotone, warm
grade?

**Motion** — is scroll-reveal wanted at all? Restrained or noticeable? Anything
you actively dislike?

**Anything you have seen and disliked** — this is worth as much as the
references. Naming the thing to avoid prevents a whole direction being explored.

---

## Fixed and not up for design

These come from the brand and the build, not from a reference image. Listed so
nothing spends time re-deciding them.

- **Brand colours** — deep emerald and gold, from `public/original-logo.png`.
  The golden lockup (`public/golden-logo.png`) is the single-colour treatment
  for dark surfaces.
- **Arabic numerals are Latin digits** — `189`, not `١٨٩` (decision D16,
  encoded in `lib/format.ts`). Changing this is a one-constant switch, but it is
  a client decision, not a design one.
- **RTL uses logical properties only** — `ms-`/`me-`, never `ml-`/`mr-`.
  Non-negotiable regardless of what a reference shows.
- **Tailwind v4 is CSS-first** — tokens go in `app/globals.css` `@theme`. There
  is no `tailwind.config.js` and one must not be created.
- **The hero image is the LCP image.** Mobile PageSpeed 95+ is a milestone
  acceptance criterion, so whatever the hero becomes has to carry that.
- **Fourteen images do not exist yet**, including the hero — see
  `docs/content-gaps.md`. Design around their absence or supply them.
