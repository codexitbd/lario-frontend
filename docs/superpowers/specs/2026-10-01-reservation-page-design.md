# La Rio — Reservation page design

**Date:** 2026-10-01
**Route:** `/reservation` and `/ar/reservation`
**Status:** Approved in conversation 2026-10-01. Supplements §9 of
`2026-09-18-lario-frontend-design.md`, which fixes the four steps and the
fields; this file fixes how they are staged. Where the two disagree, this one
wins and §9 carries a pointer.

---

## 1. What is fixed before design begins

From the contract (`03-api-contract.md`, `POST /reservations`) and §9:

- Four steps: branch → date, time, party size → your details → review and
  submit. A stepper shows position; every step is reachable backwards without
  losing data.
- Fields: `branch_slug`, `reserved_for` (future, within 90 days),
  `party_size` (1–20), `guest_name`, `guest_email`, `guest_phone` (E.164),
  `whatsapp` (optional, E.164), `occasion`, `seating_preference`, `notes`,
  `consent` (must be `true`), `locale`.
- `?branch=narjis` and `?branch=al-yasmin` preselect the branch. The homepage
  CTA and footer already send these links.
- The mock at `app/api/reservations/route.ts` answers 201, 422 and 429; a
  network failure is the fourth state. All four are built and demoable.
- Success shows the `LR-XXXXXX` reference and says the branch **will
  confirm**. It never implies a confirmed booking. Wording is signed off in
  both languages before the demo.
- No availability, capacity or conflict logic. A reservation is a request plus
  an email (`00-project-brief.md`).
- The Arabic date picker is the most likely layout break and is tested
  explicitly.

`design/references/reservation/` is empty: no drawings were supplied, so the
visual staging below is this project's proposal, approved by the client's
developer on 2026-10-01.

## 2. Decisions taken 2026-10-01

| # | Decision | Alternatives considered |
|---|---|---|
| R1 | **Scrolling book.** All four steps are on one page as full-width chapters read top to bottom, with a sticky progress rail. No step swapping. | A single stage with steps swapping in place; an editable display sentence ("A table for 4 at Al Narjis on…"), which would have collapsed D12's four steps and needed client re-approval. |
| R2 | **Native date and time inputs**, styled as the site's ruled lines, with `min`/`max` for today and 90 days out. The browser owns the calendar, including the Arabic one. | A 14-day scroll-snap day strip with time chips generated from opening hours; a hand-built month grid. Both are more UI than the request warrants and the second is the RTL risk §9 names. |
| R3 | **One form, one island.** A single client component owns the book: one `<form>`, one state object, one Zod pass per chapter. Chapters are sub-components taking values and errors as props. | Four islands sharing context (four files plus a provider, and no single `<form>`); server-rendered chapters with per-input islands (state has to be lifted anyway). |
| R4 | **JSON-LD is `Restaurant` with a `ReserveAction` `potentialAction`.** §9's "`Reservation` + `ReservationAction`" is corrected: `ReservationAction` is not a schema.org type, and a `Reservation` entity on a static page asserts a booking that does not exist. | Emitting what §9 says. |

## 3. Composition

A dark book under the standard chrome. Three layout families, one container,
one accent.

**Opening band.** Short, not a hero. Breadcrumb, then the page heading in the
display face, then one fixed line of copy: "Tell us the room, the evening and
who's coming. The branch confirms by phone or WhatsApp." That sentence carries
the contract's honesty requirement before the guest types anything.

**Progress rail.** Desktop: a thin sticky column at the start edge listing
`01 Room · 02 When · 03 Details · 04 Review`. The numeral of the chapter on
screen is gold; a completed chapter carries a filled dot; every item is a link
that scrolls to its chapter. Phone: a slim bar pinned under the header reading
`02 / 04 · When`. The rail is a `<nav>` with `aria-current` on the chapter in
view. The numerals are functional stepper position, not decorative section
numbering: §9 requires the position to be shown.

**Chapter 1, Room.** Two full-height photo panels side by side (stacked on
phones), reusing the `branch.*` frames the homepage panels show on hover. Each
panel is one large native radio: the chosen room is lit and takes the gold
inset frame; the other dims to ink. Under each: name, tagline, the week's hours
through `groupOpeningHours`. A `?branch=` link arrives with one already chosen.

**Chapter 2, When.** Three ruled fields in one row on desktop (date, time,
guests), stacked on phones. Date and time are native inputs. Guests is a
stepper: minus and plus buttons around the number, clamped 1–20, with the
number itself an editable input so it is not button-only. Beside the time field
the chosen branch's hours for the chosen weekday as plain text, so the guest
picks a time the room is open without the page pretending to check
availability. If no branch is chosen yet the hint is omitted.

**Chapter 3, Details.** Name, email, phone, WhatsApp (optional), then occasion
and seating preference as rows of square tabs (the contact page's branch-choice
control), notes, and the consent tick as a native checkbox with the consent
sentence as its label. Ruled lines throughout, labels above, errors below.

**Chapter 4, Review.** The request rendered as a **ticket**: a bone card on the
ink ground, the one deliberate container on the page. Room, date, time, guests
and name in display type; email, phone, WhatsApp, occasion, seating and notes
in small text; an "edit" link on each line that scrolls to its chapter; the
submit button; and beneath it the live region for rate-limit and network
messages. On success the same ticket re-renders with the reference, the line
"{branch} will confirm by phone or WhatsApp", and the branch phone as a link.
The form is gone at that point, so nothing can be sent twice.

**Motion.** The site's existing CSS reveals (`lr-unmask` on chapter headings,
`lr-reveal` on groups) and the rail's gold moving between numerals. Nothing
new in JavaScript; reduced motion is already honoured by those rules.

## 4. State, validation and errors

- **State.** One object in the island (`useState` with a `patch` helper;
  every action is a merge, so a reducer would add nothing), shaped like the
  contract payload except that `date` and `time` are held as separate strings
  until submit. Initial `branch_slug` comes from `?branch=` through
  `useSearchParams` inside a `Suspense` boundary, so the route stays
  statically prerendered (§4.1's "NOT cached" is satisfied by the form being a
  client island, as `/contact` and the footer newsletter already are).
- **`reserved_for` assembly.** `toReservedFor(date, time)` in
  `lib/reservation.ts` returns `YYYY-MM-DDTHH:MM:00+03:00`. The offset is
  Riyadh's, fixed in code, never the device's: a guest booking from London
  must not send 20:30 London time. The server-side comment in
  `lib/schemas/reservation.ts` already records a three-hour bug of this kind;
  the function has its own test.
- **Validation.** The existing `reservationSchema` runs client-side on submit.
  Its issues are mapped to fields by the same `localiseIssues` the mock uses,
  so client and server messages are identical. Two uses of the same schema:
  the rail checks each chapter's own fields silently whenever its values
  change, to mark it complete; error **messages** appear only after a submit
  attempt, never per keystroke.
- **Submit.** `POST /api/reservations`.
  - **201**: the ticket re-renders with the reference.
  - **422**: server messages replace client ones field by field; the page
    scrolls to the first chapter with an error and that chapter's heading is
    followed by the form-level message in a live region.
  - **429**: `dict.reservation.errorRateLimit` under the submit button.
  - **Network failure**: `dict.reservation.errorNetwork` there, and the button
    re-enables so the guest can retry without losing anything.
- **Double submit** is prevented by the sending state, as in the two existing
  forms.

## 5. Files

| File | Role |
|---|---|
| `app/[locale]/reservation/page.tsx` | Server. Metadata from `getPage(locale, 'reservation')`, opening band, JSON-LD, mounts the island in `Suspense`. |
| `components/reservation/reservation-book.tsx` | The island: form, reducer, rail, four chapters, submit. Splits the ticket into `ticket.tsx` only if the file passes roughly 400 lines. |
| `lib/reservation.ts` | Pure: the state shape, `initialState(branch)`, `toPayload(state, locale)`, `chapterIssues` / `allIssues` / `firstChapterWithIssues`, `toReservedFor(date, time)`, `dateBounds(now)` and `hoursForDate(branch, date, locale)`. |
| `lib/reservation.test.ts` | Offset assembly, invalid input, deep-link handling, phone normalisation, per-chapter issues including a past time today, the 90-day bounds, and the hint for an open day, a day closing after midnight, a closed day and no date. |
| `content/pages.json` | A `reservation` row (title, heading, description, body) in both locales, like `contact`. |
| `messages/en.json`, `messages/ar.json` | About ten keys added under `reservation`: chapter titles, the opening line, "edit", guests labels, the hours hint template, success copy. |

No new dependencies. No new CSS file: Tailwind utilities plus the existing
`lr-*` rules.

## 6. Internationalisation and RTL

- Native date and time inputs render with `dir="ltr"` inside the RTL page,
  the standard fix for the picker break §9 names, and both locales are
  screenshotted at phone width before the page is called done.
- Latin digits throughout (D16). Weekday and time formatting go through
  `lib/format.ts`.
- The rail's `02 / 04` reads the same in both directions; the chapter scroll
  links use logical properties.

## 7. SEO

- Metadata verbatim from the page row's `seo`, like every other page.
- JSON-LD: `BreadcrumbList`, and `Restaurant` carrying
  `potentialAction: { "@type": "ReserveAction", target: <page URL> }` (R4).
  No `Reservation` entity.

## 8. Testing and acceptance

- `lib/reservation.test.ts` as above.
- The schema tests in `lib/schemas/reservation.test.ts` already cover the
  rules; nothing is duplicated.
- Browser pass before done: desktop EN, phone AR; a `?branch=al-yasmin` deep
  link; a 422 produced by a past date; a 201; the rail following scroll and
  marking completion; keyboard through the whole book.
- Acceptance is §12's existing line: the stepper completes end to end, and the
  422, 429 and network states each render.

## 9. Out of scope, deliberately

Availability or capacity of any kind, calendar export, time-slot generation
from opening hours, picker libraries, saving a draft between visits.
