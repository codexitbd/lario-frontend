# Product

## Register

brand

## Users

Diners in Riyadh choosing where to eat tonight, and people who already know La
Rio and want a table, the hours, or the address. Most arrive from a Google
search on a phone, on mobile data, with low patience. A large share read Arabic
first: Arabic is not an afterthought audience, it is half the audience, and the
site is RTL for them end to end.

The job to be done is short and unromantic: work out whether this is the right
restaurant, then book. Everything else is in service of that.

## Product Purpose

La Rio is an Argentine / Italian / Turkish fine-dining group with two Riyadh
branches, Al Narjis and Al Yasmin. The site exists to be found and to convert.

The client is paying for exactly two things, named in `lario-docs/00-project-brief.md`:

1. **Search visibility.** The outgoing site has a runtime JS error, no sitemap,
   broken internal links, wrong `lang`/`dir`, and missing canonical/OG tags.
2. **Speed.** The outgoing menu category page takes roughly 20 seconds to load.

Success is a fast, crawlable, bilingual site where every dish and every course
is its own indexable URL, and where a reservation is never more than one clear
action away. When a design trade-off comes up, those two are the tiebreaker.

## Brand Personality

Assured, fire-lit, generous.

Three kitchens working around one open charcoal grill. The voice is confident
and unfussy: it states what a dish is and what it costs, and lets the plate do
the persuading. Not precious, not chatty, never salesy. Warmth comes from the
food and the light, not from adjectives.

The emotional target is appetite and trust, in that order.

## Anti-references

- **The editorial-typographic lane.** Display serif plus small tracked-caps
  labels plus hairline rules plus monochrome restraint. This is the saturated
  2026 AI brand family and it is what this site drifted into. Specifically
  banned from here on: a tracked-caps eyebrow above every section, decorative
  lozenge or diamond glyphs flanking headings, and hairline rules used as
  scaffolding rather than as real separation.
- **One identical fade applied to every section.** A uniform scroll reveal is
  the motion equivalent of the eyebrow: it reads as a template, not as
  direction.
- **A page that is green end to end.** The brand hue belongs on accents and one
  or two deliberate grounds, never as the default field. Already corrected once;
  do not regress.
- **Type competing with the food.** This is a restaurant. A headline larger than
  the plate it sits next to is the wrong hierarchy.
- **Generic delivery-app styling.** Rounded cards, badge soup, star ratings,
  dense grids of small thumbnails.

## Design Principles

1. **The plate is the argument.** Photography carries persuasion; typography
   gets out of its way. Where a photo and a headline compete, the photo wins.
2. **Findable and fast before beautiful.** No design move may cost the 95+
   mobile PageSpeed target or take a route dynamic. Both are things the client
   is paying for, not preferences.
3. **Arabic is first-class.** Every layout is built in logical properties and
   read in both directions before it ships. RTL is not a retrofit.
4. **Say it once.** If the content already announces what a section is, the
   section does not get a label announcing it again.
5. **Motion must be motivated.** Each reveal earns its place by fitting what it
   reveals. Identical entrances everywhere are worse than no entrance at all.

## Scope added after kickoff

- **Newsletter signup (2026-09-20, client request).** Not in
  `00-project-brief.md`. Double opt-in by contract: the endpoint answers
  `pending`, and someone is only a subscriber once they confirm. Consent is
  captured by submission against a visible notice rather than a checkbox; if the
  client's counsel wants an explicit PDPL opt-in checkbox, that is a small
  change and worth raising with them.

## Accessibility & Inclusion

- **WCAG 2.1 AA** is the target, built in from day one. The formal audit pass is
  Phase 5, but labels, focus states, landmarks and contrast are not retrofitted.
- Body text at 4.5:1 minimum, large text at 3:1, verified against the actual
  token values rather than assumed. Gold has two tokens for this reason:
  `--color-gold` on dark grounds, `--color-gold-ink` on bone.
- `prefers-reduced-motion` is honoured everywhere. Reveals resolve to visible,
  the marquee pauses, the hero film is never created.
- Full keyboard operation with a visible focus ring on every ground.
- Latin digits in both locales (decision D16) and no letter-spacing on Arabic,
  which breaks the script's joins.
