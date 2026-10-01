# Reservation Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/reservation` (EN) and `/ar/reservation` (AR) as a scrolling four-chapter book with a sticky progress rail, native date and time inputs, a bone review ticket, and every response state of the existing `POST /api/reservations` mock.

**Architecture:** A server page renders the opening band, metadata and JSON-LD, and mounts one client island inside `Suspense`. The island owns one `<form>` and one state object; four chapter sub-components render from props. All pure logic (payload assembly with Riyadh's fixed offset, per-chapter validation, date bounds, the hours hint) lives in `lib/reservation.ts` and is unit-tested without React.

**Tech Stack:** Next.js (this repo's version; read `node_modules/next/dist/docs/` before touching routing), React 19, TypeScript, Tailwind v4, Zod (existing `reservationSchema`), Phosphor icons (`@phosphor-icons/react/ssr`), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-01-reservation-page-design.md` (staging), supplementing §9 of `docs/superpowers/specs/2026-09-18-lario-frontend-design.md` (fields and rules). Read both before Task 1.

## Global Constraints

- The API contract `../lario-docs/03-api-contract.md` is binding. Task 2 changes it (the page `template` enum) and that edit ships in the same commit as the schema change.
- `reserved_for` is sent as `YYYY-MM-DDTHH:MM:00+03:00`. The offset is Riyadh's, fixed in code, never the device's.
- `party_size` 1–20. Date within 90 days. Phone and WhatsApp E.164. `consent` must be `true`.
- Success copy says the branch **will confirm**. Never "confirmed", "booked" or "reserved" as a done state.
- Latin digits in Arabic (D16). All formatting through `lib/format.ts`.
- No new dependencies. No picker library. No new CSS file; Tailwind utilities and the existing `lr-*` rules only.
- Square corners everywhere. Gold on ink is `text-gold`; gold on bone is `text-gold-ink`.
- No `window.addEventListener('scroll')`. The rail uses `IntersectionObserver`.
- Every dictionary key added to `messages/en.json` is added to `messages/ar.json` in the same step; `satisfies` in `lib/i18n/dictionaries.ts` makes a missing key a type error.
- No em-dashes in any user-visible string.
- Commits: the working tree already holds uncommitted work from 2026-09-30 and 2026-10-01. Each commit below adds only the files it names. Confirm with the operator before the first commit of this plan.

## Review Focus

1. **Today's date with a time already past** (e.g. 14:00 chosen at 15:00 Riyadh): expected a "future" error under the time field, not a 201. Pinned in Task 1 (`chapterIssues`).
2. **Deep link with an unknown branch** (`?branch=foo`): expected no room selected and no crash. Pinned in Task 1 (`initialState`).
3. **Phone typed with spaces or dashes** (`+966 51 234 5678`): expected to validate, because people type it that way. Pinned in Task 1 (`toPayload`).
4. **A service that closes after midnight** (Fri 13:00–01:00): expected the hours hint to read `1:00 PM - 1:00 AM`, not to treat the day as closed. Pinned in Task 1 (`hoursForDate`).
5. **The 90th day**: expected to be selectable; the 91st not. Pinned in Task 1 (`dateBounds`) and the schema already rejects beyond 90 days server-side.

---

### Task 1: Pure reservation logic

**Files:**
- Create: `lib/reservation.ts`
- Test: `lib/reservation.test.ts`

**Interfaces:**
- Consumes: `reservationSchema`, `localiseIssues`, `OCCASIONS`, `SEATING_PREFERENCES` from `lib/schemas/reservation.ts`; `formatTimeRange`, `TIME_ZONE` from `lib/format.ts`; `Branch` from `lib/schemas`; `Locale` from `lib/i18n/config`.
- Produces (used by Task 4):
  - `type BookState`, `type Chapter = 'room' | 'when' | 'details'`, `CHAPTERS: readonly Chapter[]`
  - `initialState(branch: string | null): BookState`
  - `toPayload(state: BookState, locale: Locale): Record<string, unknown>`
  - `chapterIssues(state: BookState, chapter: Chapter, locale: Locale): Record<string, string[]>`
  - `allIssues(state: BookState, locale: Locale): Record<string, string[]>`
  - `firstChapterWithIssues(issues: Record<string, string[]>): Chapter | null`
  - `toReservedFor(date: string, time: string): string | null`
  - `dateBounds(now?: Date): { min: string; max: string }`
  - `hoursForDate(branch: Pick<Branch, 'opening_hours'>, date: string, locale: Locale): { open: true; hours: string } | { open: false } | null`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/reservation.test.ts
import { describe, expect, it } from 'vitest'
import {
  chapterIssues,
  dateBounds,
  firstChapterWithIssues,
  hoursForDate,
  initialState,
  toPayload,
  toReservedFor,
  type BookState,
} from '@/lib/reservation'
import type { Branch } from '@/lib/schemas'

type Hours = Branch['opening_hours']

function week(
  overrides: Partial<Record<number, Partial<Hours[number]>>> = {},
): Hours {
  return Array.from({ length: 7 }, (_, day) => ({
    day_of_week: day,
    opens_at: '12:00',
    closes_at: '23:30',
    is_closed: false,
    ...overrides[day],
  }))
}

/** A date 10 days from now, as the inputs produce it. */
function soon(): string {
  return new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10)
}

function filled(): BookState {
  return {
    ...initialState('narjis'),
    date: soon(),
    time: '20:30',
    party_size: 4,
    guest_name: 'Noor Al-Harbi',
    guest_email: 'noor@example.com',
    guest_phone: '+966 51 234 5678',
    consent: true,
  }
}

describe('toReservedFor', () => {
  it('joins date and time with the Riyadh offset, never the device offset', () => {
    expect(toReservedFor('2026-10-04', '20:30')).toBe('2026-10-04T20:30:00+03:00')
  })

  it('returns null for anything that is not a date and a time', () => {
    expect(toReservedFor('', '20:30')).toBeNull()
    expect(toReservedFor('2026-10-04', '')).toBeNull()
    expect(toReservedFor('04/10/2026', '20:30')).toBeNull()
  })
})

describe('initialState', () => {
  it('preselects a known branch from the deep link', () => {
    expect(initialState('al-yasmin').branch_slug).toBe('al-yasmin')
  })

  it('ignores an unknown or missing branch', () => {
    expect(initialState('foo').branch_slug).toBe('')
    expect(initialState(null).branch_slug).toBe('')
  })

  it('starts with two guests and nothing else filled', () => {
    const state = initialState(null)
    expect(state.party_size).toBe(2)
    expect(state.consent).toBe(false)
    expect(state.occasion).toBe('')
  })
})

describe('toPayload', () => {
  it('strips spaces and dashes from phone numbers', () => {
    const payload = toPayload(
      { ...filled(), guest_phone: '+966 51-234 5678', whatsapp: '+966 51 234 5678' },
      'en',
    )
    expect(payload.guest_phone).toBe('+966512345678')
    expect(payload.whatsapp).toBe('+966512345678')
  })

  it('sends optional fields as undefined when empty, and the locale', () => {
    const payload = toPayload(filled(), 'ar')
    expect(payload.whatsapp).toBeUndefined()
    expect(payload.occasion).toBeUndefined()
    expect(payload.seating_preference).toBeUndefined()
    expect(payload.notes).toBeUndefined()
    expect(payload.locale).toBe('ar')
  })

  it('assembles reserved_for and sends an empty string when it cannot', () => {
    expect(toPayload(filled(), 'en').reserved_for).toMatch(/T20:30:00\+03:00$/)
    expect(toPayload({ ...filled(), time: '' }, 'en').reserved_for).toBe('')
  })
})

describe('chapterIssues', () => {
  it('reports only the chapter\'s own fields, in the request locale', () => {
    const empty = initialState(null)
    expect(Object.keys(chapterIssues(empty, 'room', 'en'))).toEqual(['branch_slug'])
    expect(chapterIssues(empty, 'room', 'ar').branch_slug[0]).toBe('اختر أحد فروعنا.')
    expect(chapterIssues(filled(), 'room', 'en')).toEqual({})
  })

  it('puts a past time on reserved_for, which the When chapter owns', () => {
    const today = new Date().toISOString().slice(0, 10)
    const past = { ...filled(), date: today, time: '00:01' }
    const issues = chapterIssues(past, 'when', 'en')
    expect(Object.keys(issues)).toEqual(['reserved_for'])
    expect(chapterIssues(past, 'details', 'en')).toEqual({})
  })

  it('a complete state has no issues in any chapter', () => {
    for (const chapter of ['room', 'when', 'details'] as const) {
      expect(chapterIssues(filled(), chapter, 'en')).toEqual({})
    }
  })
})

describe('firstChapterWithIssues', () => {
  it('walks the chapters in page order', () => {
    expect(firstChapterWithIssues({ guest_name: ['x'], reserved_for: ['y'] })).toBe('when')
    expect(firstChapterWithIssues({ consent: ['x'] })).toBe('details')
    expect(firstChapterWithIssues({})).toBeNull()
  })
})

describe('dateBounds', () => {
  it('runs from today to ninety days out, in Riyadh', () => {
    // 2026-10-01T22:30Z is already 2026-10-02 in Riyadh (UTC+3).
    const bounds = dateBounds(new Date('2026-10-01T22:30:00Z'))
    expect(bounds.min).toBe('2026-10-02')
    expect(bounds.max).toBe('2026-12-31')
  })
})

describe('hoursForDate', () => {
  const branch = {
    opening_hours: week({
      5: { opens_at: '13:00', closes_at: '01:00' },
      6: { opens_at: '13:00', closes_at: '01:00' },
      2: { opens_at: null, closes_at: null, is_closed: true },
    }),
  }

  it('reads the weekday from the date and formats the range', () => {
    // 2026-10-04 is a Sunday.
    expect(hoursForDate(branch, '2026-10-04', 'en')).toEqual({
      open: true,
      hours: '12:00 PM - 11:30 PM',
    })
  })

  it('keeps a service that closes after midnight open', () => {
    // 2026-10-09 is a Friday.
    expect(hoursForDate(branch, '2026-10-09', 'en')).toEqual({
      open: true,
      hours: '1:00 PM - 1:00 AM',
    })
  })

  it('reports a closed day and gives up on a bad date', () => {
    // 2026-10-06 is a Tuesday.
    expect(hoursForDate(branch, '2026-10-06', 'en')).toEqual({ open: false })
    expect(hoursForDate(branch, '', 'en')).toBeNull()
  })

  it('formats in Arabic with Latin digits', () => {
    const hint = hoursForDate(branch, '2026-10-04', 'ar')
    expect(hint && hint.open && hint.hours).toMatch(/12:00/)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/reservation.test.ts`
Expected: FAIL with "Failed to resolve import "@/lib/reservation"".

- [ ] **Step 3: Write the implementation**

```ts
// lib/reservation.ts
import { TIME_ZONE, formatTimeRange } from '@/lib/format'
import type { Locale } from '@/lib/i18n/config'
import type { Branch } from '@/lib/schemas'
import {
  OCCASIONS,
  SEATING_PREFERENCES,
  localiseIssues,
  reservationSchema,
} from '@/lib/schemas/reservation'

/**
 * Everything about the reservation book that is not React: the state shape,
 * the payload the contract wants, which chapter owns which field, and the
 * two date helpers. Pure, so lib/reservation.test.ts covers it without a DOM.
 */

/** Riyadh. Fixed, never read from the device: a guest booking from London
    must not send 20:30 London time. Saudi has no DST. */
const RIYADH_OFFSET = '+03:00'
const NINETY_DAYS_MS = 90 * 86_400_000
const BRANCH_SLUGS = ['narjis', 'al-yasmin'] as const

type BranchSlug = (typeof BRANCH_SLUGS)[number]

export type BookState = {
  branch_slug: '' | BranchSlug
  date: string
  time: string
  party_size: number
  guest_name: string
  guest_email: string
  guest_phone: string
  whatsapp: string
  occasion: '' | (typeof OCCASIONS)[number]
  seating_preference: '' | (typeof SEATING_PREFERENCES)[number]
  notes: string
  consent: boolean
}

export type Chapter = 'room' | 'when' | 'details'
export const CHAPTERS: readonly Chapter[] = ['room', 'when', 'details']

/** Which payload fields each chapter owns. `reserved_for` is the When
    chapter's because date and time are its inputs. */
const CHAPTER_FIELDS: Record<Chapter, readonly string[]> = {
  room: ['branch_slug'],
  when: ['reserved_for', 'party_size'],
  details: [
    'guest_name',
    'guest_email',
    'guest_phone',
    'whatsapp',
    'occasion',
    'seating_preference',
    'notes',
    'consent',
  ],
}

export function initialState(branch: string | null): BookState {
  return {
    branch_slug: BRANCH_SLUGS.includes(branch as BranchSlug)
      ? (branch as BranchSlug)
      : '',
    date: '',
    time: '',
    party_size: 2,
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    whatsapp: '',
    occasion: '',
    seating_preference: '',
    notes: '',
    consent: false,
  }
}

export function toReservedFor(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null
  }
  return `${date}T${time}:00${RIYADH_OFFSET}`
}

const phone = (value: string) => value.replace(/[\s-]/g, '')
const optional = (value: string) => (value ? value : undefined)

export function toPayload(
  state: BookState,
  locale: Locale,
): Record<string, unknown> {
  return {
    branch_slug: state.branch_slug,
    guest_name: state.guest_name.trim(),
    guest_email: state.guest_email.trim(),
    guest_phone: phone(state.guest_phone),
    whatsapp: optional(phone(state.whatsapp)),
    party_size: state.party_size,
    // '' rather than undefined when unassembled, so Zod reports the field
    // instead of a missing key.
    reserved_for: toReservedFor(state.date, state.time) ?? '',
    occasion: optional(state.occasion),
    seating_preference: optional(state.seating_preference),
    notes: optional(state.notes.trim()),
    consent: state.consent,
    locale,
  }
}

export function allIssues(
  state: BookState,
  locale: Locale,
): Record<string, string[]> {
  const parsed = reservationSchema.safeParse(toPayload(state, locale))
  return parsed.success ? {} : localiseIssues(parsed.error.issues, locale)
}

export function chapterIssues(
  state: BookState,
  chapter: Chapter,
  locale: Locale,
): Record<string, string[]> {
  const own = CHAPTER_FIELDS[chapter]
  return Object.fromEntries(
    Object.entries(allIssues(state, locale)).filter(([field]) =>
      own.includes(field),
    ),
  )
}

export function firstChapterWithIssues(
  issues: Record<string, string[]>,
): Chapter | null {
  const fields = Object.keys(issues)
  return (
    CHAPTERS.find((chapter) =>
      CHAPTER_FIELDS[chapter].some((field) => fields.includes(field)),
    ) ?? null
  )
}

/** YYYY-MM-DD of an instant, as Riyadh sees it. `en-CA` is the one locale
    whose default date pattern is ISO order. */
function riyadhDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

export function dateBounds(now: Date = new Date()): { min: string; max: string } {
  return {
    min: riyadhDate(now),
    max: riyadhDate(new Date(now.getTime() + NINETY_DAYS_MS)),
  }
}

export function hoursForDate(
  branch: Pick<Branch, 'opening_hours'>,
  date: string,
  locale: Locale,
): { open: true; hours: string } | { open: false } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  // Noon UTC: no offset on earth moves it to another calendar day.
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay()
  const row = branch.opening_hours.find((hour) => hour.day_of_week === dow)
  if (!row || row.is_closed || !row.opens_at || !row.closes_at) {
    return { open: false }
  }
  return { open: true, hours: formatTimeRange(row.opens_at, row.closes_at, locale) }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/reservation.test.ts`
Expected: PASS, 16 tests. If `hoursForDate` strings differ by a non-breaking space or dash style, copy the exact output of `formatTimeRange` from `lib/format.test.ts` rather than changing the formatter.

- [ ] **Step 5: Typecheck, then commit**

Run: `npx tsc --noEmit && npx eslint lib/reservation.ts lib/reservation.test.ts`
Expected: no output.

```bash
git add lib/reservation.ts lib/reservation.test.ts
git commit -m "feat(reservation): pure state, payload and date helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Page row, template enum, dictionary and JSON-LD

**Files:**
- Modify: `lib/schemas/page.ts` (the `template` enum)
- Modify: `../lario-docs/03-api-contract.md` (the `template` line, near "`template` is one of `home` | `menu` | `contact` | `legal`")
- Modify: `content/pages.json` (add a `reservation` row)
- Modify: `lib/api/pages.test.ts:12` (add `reservation` to the slug loop)
- Modify: `messages/en.json`, `messages/ar.json` (`reservation` block)
- Modify: `lib/seo/json-ld.ts` (`restaurantJsonLd` gains `reserveUrl`)
- Test: `lib/seo/json-ld.test.ts`

**Interfaces:**
- Produces: `getPage(locale, 'reservation')` returns a page; `dict.reservation.*` keys listed in Step 4; `restaurantJsonLd({ ..., reserveUrl?: string })`.

- [ ] **Step 1: Write the failing JSON-LD test**

Append to `lib/seo/json-ld.test.ts` inside its existing `describe` for `restaurantJsonLd` (create one if absent, importing `restaurantJsonLd` and using the same branch fixture the file already builds):

```ts
it('carries a ReserveAction when given the reservation page', () => {
  const json = restaurantJsonLd({
    name: 'La Rio',
    description: 'd',
    url: 'https://lario.sa/',
    image: null,
    branches: [],
    reserveUrl: 'https://lario.sa/reservation',
  })
  expect(json.potentialAction).toEqual({
    '@type': 'ReserveAction',
    target: 'https://lario.sa/reservation',
  })
})

it('emits no potentialAction without a reservation page', () => {
  const json = restaurantJsonLd({
    name: 'La Rio',
    description: 'd',
    url: 'https://lario.sa/',
    image: null,
    branches: [],
  })
  expect('potentialAction' in json).toBe(false)
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/seo/json-ld.test.ts`
Expected: FAIL, `potentialAction` undefined / type error on `reserveUrl`.

- [ ] **Step 3: Extend `restaurantJsonLd`**

In `lib/seo/json-ld.ts`, add `reserveUrl?: string` to the input type and the property to the output:

```ts
export function restaurantJsonLd(input: {
  name: string
  description: string
  url: string
  image: string | null
  branches: Branch[]
  /** The reservation page. Emits a ReserveAction, which is the schema.org
      type for "you can book here". No Reservation entity is ever emitted:
      on a static page that would assert a booking that does not exist. */
  reserveUrl?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: input.name,
    description: input.description,
    url: input.url,
    ...(input.image ? { image: input.image } : {}),
    servesCuisine: ['Italian', 'Turkish', 'Argentinian'],
    location: input.branches.map((branch) => localBusinessJsonLd(branch)),
    ...(input.reserveUrl
      ? {
          potentialAction: {
            '@type': 'ReserveAction',
            target: input.reserveUrl,
          },
        }
      : {}),
  }
}
```

Run: `npx vitest run lib/seo/json-ld.test.ts` → PASS.

- [ ] **Step 4: Add the page row and the template value**

`lib/schemas/page.ts`: change `template: z.enum(['home', 'contact', 'legal', 'menu'])` to `template: z.enum(['home', 'contact', 'legal', 'menu', 'reservation'])`.

`../lario-docs/03-api-contract.md`: find the sentence beginning "`template` is one of" and make it `home` | `menu` | `contact` | `legal` | `reservation`, and add to its paragraph: "`reservation` added 2026-10-01 so `/reservation` has an editable SEO record like every other route."

`content/pages.json`: insert this object before the `privacy-policy` row, matching the file's one-line-per-locale formatting:

```json
  {
    "slug": "reservation",
    "template": "reservation",
    "translations": {
      "en": { "title": "Reserve a Table", "heading": "Reserve a table", "description": "Request a table at La Rio Al Narjis or Al Yasmin in Riyadh. Choose the room, the evening and your party; the branch confirms by phone or WhatsApp.", "body": "<p>Tell us the room, the evening and who is coming. The branch confirms by phone or WhatsApp.</p>" },
      "ar": { "title": "احجز طاولة", "heading": "احجز طاولة", "description": "اطلب طاولة في لا ريو النرجس أو الياسمين بالرياض. اختر الفرع والموعد وعدد الضيوف، ويؤكد الفرع الحجز عبر الهاتف أو واتساب.", "body": "<p>أخبرنا بالفرع والموعد ومن سيأتي معك. يؤكد الفرع الحجز عبر الهاتف أو واتساب.</p>" }
    }
  },
```

`lib/api/pages.test.ts` line 12: change the loop to `['contact', 'reservation', 'privacy-policy', 'terms-and-conditions']`.

- [ ] **Step 5: Add the dictionary keys**

Add these keys inside the existing `"reservation"` object of `messages/en.json` (keep the existing keys; append after `"errorNetwork"`):

```json
    "chapterRoom": "Room",
    "chapterWhen": "When",
    "chapterDetails": "Details",
    "chapterReview": "Review",
    "askRoom": "Which room?",
    "askWhen": "When are you coming?",
    "askDetails": "Who should we expect?",
    "askReview": "Your request",
    "stepOf": "{step} / {total}",
    "edit": "Edit",
    "fewerGuests": "Fewer guests",
    "moreGuests": "More guests",
    "hoursOpen": "{branch} is open {hours} that day.",
    "hoursClosed": "{branch} is closed that day.",
    "noPreference": "No preference",
    "requestTable": "Request a table",
    "reference": "Reference",
    "occasions": {
      "birthday": "Birthday",
      "anniversary": "Anniversary",
      "business": "Business",
      "family": "Family",
      "other": "Other"
    },
    "seatings": {
      "indoor": "Indoors",
      "outdoor": "Outdoors",
      "private": "Private room"
    }
```

And the same keys in `messages/ar.json`:

```json
    "chapterRoom": "الفرع",
    "chapterWhen": "الموعد",
    "chapterDetails": "البيانات",
    "chapterReview": "المراجعة",
    "askRoom": "أي فرع؟",
    "askWhen": "متى تأتون؟",
    "askDetails": "من ننتظر؟",
    "askReview": "طلبك",
    "stepOf": "{step} / {total}",
    "edit": "تعديل",
    "fewerGuests": "ضيوف أقل",
    "moreGuests": "ضيوف أكثر",
    "hoursOpen": "{branch} مفتوح {hours} في ذلك اليوم.",
    "hoursClosed": "{branch} مغلق في ذلك اليوم.",
    "noPreference": "لا تفضيل",
    "requestTable": "اطلب طاولة",
    "reference": "رقم المرجع",
    "occasions": {
      "birthday": "عيد ميلاد",
      "anniversary": "ذكرى سنوية",
      "business": "عمل",
      "family": "عائلة",
      "other": "أخرى"
    },
    "seatings": {
      "indoor": "داخلي",
      "outdoor": "خارجي",
      "private": "غرفة خاصة"
    }
```

Use the Edit tool for both JSON files; `messages/*.json` are 2-space JSON and `content/pages.json` is not, so do not round-trip either through a formatter.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npx vitest run lib/api/pages.test.ts lib/seo/json-ld.test.ts content`
Expected: PASS. A `satisfies` error here means a key is missing from one language.

- [ ] **Step 7: Commit**

```bash
git add lib/schemas/page.ts ../lario-docs/03-api-contract.md content/pages.json lib/api/pages.test.ts messages/en.json messages/ar.json lib/seo/json-ld.ts lib/seo/json-ld.test.ts
git commit -m "feat(reservation): page row, template value, copy and ReserveAction

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: The route and the opening band

**Files:**
- Create: `app/[locale]/reservation/page.tsx`
- Create: `components/reservation/reservation-book.tsx` (a stub this task; Task 4 fills it)

**Interfaces:**
- Consumes: `getPage`, `getBranches`, `getSettings`, `getDictionary`, `buildMetadata`, `breadcrumbJsonLd`, `restaurantJsonLd` (with `reserveUrl`), `absoluteUrl`, `Container`, `localePath`, `isLocale`.
- Produces: `ReservationBook({ branches, locale, dict })` client component, which reads `?branch=` itself.

- [ ] **Step 1: Write the stub island**

```tsx
// components/reservation/reservation-book.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Branch } from '@/lib/schemas'

export function ReservationBook({
  branches,
  locale,
  dict,
}: {
  branches: Branch[]
  locale: Locale
  dict: Dictionary
}) {
  const initialBranch = useSearchParams().get('branch')
  return (
    <p className="text-ivory-dim">
      {branches.length} rooms, {locale}, {initialBranch ?? 'no branch'},{' '}
      {dict.reservation.chapterRoom}
    </p>
  )
}
```

- [ ] **Step 2: Write the page**

```tsx
// app/[locale]/reservation/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ReservationBook } from '@/components/reservation/reservation-book'
import { Container } from '@/components/ui/container'
import { getBranches } from '@/lib/api/branches'
import { getPage } from '@/lib/api/pages'
import { getSettings } from '@/lib/api/settings'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, localePath } from '@/lib/i18n/config'
import { absoluteUrl } from '@/content/seo-defaults'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbJsonLd, restaurantJsonLd } from '@/lib/seo/json-ld'

const PAGE_SLUG = 'reservation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const page = await getPage(locale, PAGE_SLUG)
  if (!page) return {}
  return buildMetadata(page.seo)
}

/**
 * /reservation. A scrolling book: opening band here, then the four chapters
 * and the progress rail in the island. Design:
 * docs/superpowers/specs/2026-10-01-reservation-page-design.md.
 *
 * Statically prerendered. The island reads `?branch=` with useSearchParams,
 * which is why it sits in Suspense: the server renders the fallback and the
 * route never goes dynamic. Spec §4.1's "NOT cached" is satisfied the same
 * way /contact and the footer newsletter satisfy it.
 *
 * JSON-LD is Restaurant + ReserveAction, never a Reservation entity (spec
 * 2026-10-01 R4).
 */
export default async function ReservationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [page, branches, settings, dict] = await Promise.all([
    getPage(locale, PAGE_SLUG),
    getBranches(locale),
    getSettings(locale),
    getDictionary(locale),
  ])
  if (!page) notFound()

  const crumbs = [
    { name: settings.site_name, url: absoluteUrl(locale, '/') },
    { name: page.heading, url: absoluteUrl(locale, '/reservation') },
  ]

  return (
    <main id="main-content" className="bg-ink text-ivory">
      {/* Opening band. Short on purpose: the book is the page. */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <Container>
          <nav
            aria-label="Breadcrumb"
            className="text-[0.6875rem] tracking-[0.2em] text-ivory-dim uppercase"
          >
            <ol className="flex items-center gap-3">
              <li>
                <Link
                  href={localePath(locale, '/')}
                  className="transition-colors duration-300 hover:text-gold"
                >
                  {settings.site_name}
                </Link>
              </li>
              <li aria-hidden="true" className="text-gold/60">
                /
              </li>
              <li aria-current="page" className="text-ivory">
                {page.heading}
              </li>
            </ol>
          </nav>
          <h1 className="lr-display lr-unmask mt-6 text-[clamp(2.5rem,1.4rem+4.4vw,4.75rem)] leading-[1.05] tracking-[0.06em] uppercase">
            {page.heading}
          </h1>
          {/* Sanitised HTML from the CMS, as every page body is. */}
          <div
            className="lr-reveal mt-6 max-w-[44ch] text-base leading-relaxed text-pretty text-ivory-dim md:text-lg [&_p]:mt-3 [&_p:first-child]:mt-0"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        </Container>
      </section>

      {/* The fallback holds the book's rough height so the footer does not
          jump up on the server render. */}
      <Suspense fallback={<Container className="min-h-[60vh]" />}>
        <ReservationBook branches={branches} locale={locale} dict={dict} />
      </Suspense>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(crumbs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            restaurantJsonLd({
              name: settings.site_name,
              description: page.seo.description,
              url: absoluteUrl(locale, '/'),
              image: page.seo.og.image,
              branches,
              reserveUrl: page.seo.canonical,
            }),
          ),
        }}
      />
    </main>
  )
}
```

- [ ] **Step 3: Verify in the browser**

Run: `npx tsc --noEmit && npx eslint "app/[locale]/reservation" components/reservation`
Expected: no output.

With `npm run dev` running, open `http://localhost:3000/en/reservation?branch=al-yasmin` and `http://localhost:3000/ar/reservation`. Expected: the heading "Reserve a table" / "احجز طاولة", the body line, and the stub reading `2 rooms, en, al-yasmin, Room`. View source: two `application/ld+json` scripts, the second containing `"ReserveAction"`.

Run: `npm run build 2>&1 | grep -i "reservation"`
Expected: `/reservation` and `/ar/reservation` listed as prerendered (○ or ●), not dynamic (ƒ). If dynamic, the `useSearchParams` call is outside the `Suspense` boundary; fix before continuing.

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/reservation/page.tsx" components/reservation/reservation-book.tsx
git commit -m "feat(reservation): route, opening band and JSON-LD

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: The book: rail, chapters, ticket, submit

**Files:**
- Modify: `components/reservation/reservation-book.tsx` (replace the stub)

**Interfaces:**
- Consumes: everything from Task 1; `interpolate` from `lib/i18n/dictionaries`; `formatDateTime`, `formatPhone` from `lib/format`; `groupOpeningHours` from `lib/hours`; `Figure` from `components/ui/figure`; `Container`; `VALIDATION_MESSAGES`, `OCCASIONS`, `SEATING_PREFERENCES` from `lib/schemas/reservation`; icons `ArrowRightIcon`, `CheckIcon`, `CircleNotchIcon`, `MinusIcon`, `PlusIcon` from `@phosphor-icons/react/ssr`.
- Produces: the finished `ReservationBook`.

This is the one large file of the feature (expected 420–480 lines). If it passes 480, move `Ticket` to `components/reservation/ticket.tsx` with the same props shown below; nothing else changes.

- [ ] **Step 1: Replace the stub with the full island**

```tsx
// components/reservation/reservation-book.tsx
'use client'

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ArrowRightIcon,
  CheckIcon,
  CircleNotchIcon,
  MinusIcon,
  PlusIcon,
} from '@phosphor-icons/react/ssr'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { formatDateTime, formatPhone } from '@/lib/format'
import { groupOpeningHours } from '@/lib/hours'
import { interpolate } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import {
  CHAPTERS,
  allIssues,
  chapterIssues,
  dateBounds,
  firstChapterWithIssues,
  hoursForDate,
  initialState,
  toPayload,
  toReservedFor,
  type BookState,
  type Chapter,
} from '@/lib/reservation'
import {
  OCCASIONS,
  SEATING_PREFERENCES,
  VALIDATION_MESSAGES,
} from '@/lib/schemas/reservation'
import type { Branch } from '@/lib/schemas'

/**
 * The reservation book: one form, one state object, four chapters read top
 * to bottom, a progress rail, and the ticket that is both the review step and
 * the success state. Design: docs/superpowers/specs/2026-10-01-reservation-page-design.md.
 *
 * Validation is the schema's (lib/reservation.ts wraps it). The rail checks
 * each chapter silently as values change; error MESSAGES appear only after a
 * submit attempt, and a 422 replaces them with the server's own words.
 *
 * `reserved_for` is assembled with Riyadh's offset, never the device's.
 */
type Status = 'idle' | 'sending' | 'error' | 'done'
type Issues = Record<string, string[]>
type Received = {
  reference: string
  reserved_for: string
  branch: { slug: string; name: string; phone: string; email: string }
}

const CHAPTER_IDS: Record<Chapter | 'review', string> = {
  room: 'room',
  when: 'when',
  details: 'details',
  review: 'review',
}
const LABEL =
  'block text-[0.6875rem] tracking-[0.18em] text-ivory-dim/70 uppercase'
const INPUT =
  'mt-2 w-full border-b border-ivory/25 bg-transparent py-3 text-base text-ivory transition-colors duration-300 ease-brand placeholder:text-ivory-dim/40 focus:border-gold focus:outline-none aria-invalid:border-gold-pale disabled:opacity-60'
const TAB =
  'cursor-pointer border border-ivory/20 px-5 py-2.5 text-sm text-ivory-dim transition-colors duration-300 ease-brand hover:border-ivory/50 has-[:checked]:border-gold has-[:checked]:text-ivory has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold'

export function ReservationBook({
  branches,
  locale,
  dict,
}: {
  branches: Branch[]
  locale: Locale
  dict: Dictionary
}) {
  const id = useId()
  const initialBranch = useSearchParams().get('branch')
  const [state, setState] = useState<BookState>(() =>
    initialState(initialBranch),
  )
  const [status, setStatus] = useState<Status>('idle')
  const [issues, setIssues] = useState<Issues>({})
  const [notice, setNotice] = useState('')
  const [received, setReceived] = useState<Received | null>(null)
  const [active, setActive] = useState<Chapter | 'review'>('room')
  const bounds = useMemo(() => dateBounds(), [])

  const patch = (next: Partial<BookState>) =>
    setState((current) => ({ ...current, ...next }))

  const complete = useMemo(
    () =>
      Object.fromEntries(
        CHAPTERS.map((chapter) => [
          chapter,
          Object.keys(chapterIssues(state, chapter, locale)).length === 0,
        ]),
      ) as Record<Chapter, boolean>,
    [state, locale],
  )

  const branch = branches.find((b) => b.slug === state.branch_slug) ?? null

  // The rail follows the chapter nearest the top of the viewport.
  useEffect(() => {
    const sections = Object.values(CHAPTER_IDS)
      .map((key) => document.getElementById(key))
      .filter((el): el is HTMLElement => el !== null)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id as Chapter | 'review')
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const error = (field: string) => issues[field]?.[0]
  const describe = (field: string) =>
    error(field) ? `${id}-${field}-error` : undefined

  function goTo(chapter: Chapter | 'review') {
    const section = document.getElementById(CHAPTER_IDS[chapter])
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    section?.querySelector<HTMLElement>('h2')?.focus()
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    const clientIssues = allIssues(state, locale)
    if (Object.keys(clientIssues).length > 0) {
      setIssues(clientIssues)
      setNotice(VALIDATION_MESSAGES[locale].form)
      setStatus('error')
      goTo(firstChapterWithIssues(clientIssues) ?? 'review')
      return
    }

    setStatus('sending')
    setIssues({})
    setNotice('')
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(state, locale)),
      })
      if (response.ok) {
        const body = (await response.json()) as { data: Received }
        setReceived(body.data)
        setStatus('done')
        goTo('review')
        return
      }
      if (response.status === 429) {
        setNotice(dict.reservation.errorRateLimit)
      } else if (response.status === 422) {
        const body = (await response.json().catch(() => null)) as {
          message?: string
          errors?: Issues
        } | null
        const serverIssues = body?.errors ?? {}
        setIssues(serverIssues)
        setNotice(body?.message ?? VALIDATION_MESSAGES[locale].form)
        goTo(firstChapterWithIssues(serverIssues) ?? 'review')
      } else {
        setNotice(dict.reservation.errorNetwork)
      }
      setStatus('error')
    } catch {
      setNotice(dict.reservation.errorNetwork)
      setStatus('error')
    }
  }

  const sending = status === 'sending'
  const rail: { key: Chapter | 'review'; label: string }[] = [
    { key: 'room', label: dict.reservation.chapterRoom },
    { key: 'when', label: dict.reservation.chapterWhen },
    { key: 'details', label: dict.reservation.chapterDetails },
    { key: 'review', label: dict.reservation.chapterReview },
  ]
  const activeIndex = rail.findIndex((item) => item.key === active)

  return (
    <Container className="pb-24 md:pb-32 lg:grid lg:grid-cols-[10rem_1fr] lg:gap-16">
      {/* The rail. One nav, two renderings: a sticky column from lg, a slim
          bar pinned under the header below it. Numerals are the stepper
          position spec §9 requires, not decoration. */}
      <nav aria-label={dict.nav.primary} className="lg:self-start lg:sticky lg:top-32">
        <ol className="hidden lg:flex lg:flex-col lg:gap-6">
          {rail.map((item, index) => {
            const done = item.key !== 'review' && complete[item.key]
            const current = item.key === active
            return (
              <li key={item.key}>
                <a
                  href={`#${CHAPTER_IDS[item.key]}`}
                  aria-current={current ? 'step' : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    goTo(item.key)
                  }}
                  className={`group flex items-baseline gap-3 transition-colors duration-300 ease-brand hover:text-gold ${current ? 'text-ivory' : 'text-ivory-dim/70'}`}
                >
                  <span
                    className={`lr-display text-2xl tabular-nums transition-colors duration-500 ease-brand ${current ? 'text-gold' : ''}`}
                  >
                    0{index + 1}
                  </span>
                  <span className="text-[0.75rem] tracking-[0.16em] uppercase">
                    {item.label}
                  </span>
                  {done ? (
                    <CheckIcon
                      aria-hidden="true"
                      weight="bold"
                      className="size-3 text-gold"
                    />
                  ) : null}
                </a>
              </li>
            )
          })}
        </ol>
        <p className="sticky top-20 z-10 -mx-5 flex items-center justify-between border-b border-ivory/10 bg-ink/95 px-5 py-3 text-[0.75rem] tracking-[0.16em] uppercase backdrop-blur-sm sm:-mx-8 sm:px-8 lg:hidden">
          <span className="text-gold">
            {interpolate(dict.reservation.stepOf, {
              step: `0${activeIndex + 1}`,
              total: `0${rail.length}`,
            })}
          </span>
          <span className="text-ivory">{rail[activeIndex]?.label}</span>
        </p>
      </nav>

      <form onSubmit={onSubmit} noValidate className="min-w-0">
        {/* Chapter 1: Room */}
        <ChapterFrame
          id={CHAPTER_IDS.room}
          number="01"
          title={dict.reservation.askRoom}
          error={error('branch_slug')}
          errorId={describe('branch_slug')}
        >
          <fieldset
            aria-describedby={describe('branch_slug')}
            className="grid gap-px md:grid-cols-2"
          >
            <legend className="sr-only">{dict.reservation.chapterRoom}</legend>
            {branches.map((room) => (
              <label
                key={room.slug}
                className="group relative isolate flex min-h-[22rem] cursor-pointer flex-col justify-end overflow-hidden p-8 md:min-h-[28rem]"
              >
                <input
                  type="radio"
                  name="branch_slug"
                  value={room.slug}
                  checked={state.branch_slug === room.slug}
                  onChange={() => patch({ branch_slug: room.slug })}
                  disabled={sending}
                  className="peer sr-only"
                />
                <Figure
                  src={room.hero_image}
                  slot={`branch.${room.slug}`}
                  alt=""
                  shot={`${room.name}. Entrance or exterior.`}
                  sizes="(min-width: 768px) 45vw, 100vw"
                  className="absolute inset-0 -z-20"
                />
                {/* Unchosen rooms sit under heavy ink; the chosen one lifts. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-ink/80 transition-colors duration-700 ease-brand peer-checked:bg-ink/35 group-hover:bg-ink/55"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-3 border border-ivory/15 transition-colors duration-500 ease-brand peer-checked:border-gold peer-focus-visible:border-gold-pale"
                />
                <span className="lr-display pb-1 text-base leading-[1.15] text-gold italic">
                  {room.tagline}
                </span>
                <span className="lr-display text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] leading-[1.1] text-ivory">
                  {room.name}
                </span>
                <span className="mt-3 flex flex-col gap-0.5 text-sm text-ivory-dim">
                  {groupOpeningHours(room.opening_hours, locale, dict.branch.closed).map(
                    (group) => (
                      <span key={group.days}>
                        {group.days} {group.hours}
                      </span>
                    ),
                  )}
                </span>
              </label>
            ))}
          </fieldset>
        </ChapterFrame>

        {/* Chapter 2: When */}
        <ChapterFrame
          id={CHAPTER_IDS.when}
          number="02"
          title={dict.reservation.askWhen}
          error={error('reserved_for')}
          errorId={describe('reserved_for')}
        >
          <div className="grid gap-8 md:grid-cols-3 md:gap-x-10">
            <div>
              <label htmlFor={`${id}-date`} className={LABEL}>
                {dict.reservation.date}
              </label>
              {/* Native, ltr even in Arabic: the picker is the one control
                  that breaks when mirrored (spec §9). */}
              <input
                id={`${id}-date`}
                type="date"
                required
                min={bounds.min}
                max={bounds.max}
                value={state.date}
                onChange={(e) => patch({ date: e.target.value })}
                disabled={sending}
                dir="ltr"
                aria-invalid={error('reserved_for') ? true : undefined}
                aria-describedby={describe('reserved_for')}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor={`${id}-time`} className={LABEL}>
                {dict.reservation.time}
              </label>
              <input
                id={`${id}-time`}
                type="time"
                required
                step={900}
                value={state.time}
                onChange={(e) => patch({ time: e.target.value })}
                disabled={sending}
                dir="ltr"
                aria-invalid={error('reserved_for') ? true : undefined}
                aria-describedby={`${id}-hours`}
                className={INPUT}
              />
              <HoursHint
                id={`${id}-hours`}
                branch={branch}
                date={state.date}
                locale={locale}
                dict={dict}
              />
            </div>
            <div>
              <span id={`${id}-guests`} className={LABEL}>
                {dict.reservation.partySize}
              </span>
              <div className="mt-2 flex items-center border-b border-ivory/25 focus-within:border-gold">
                <button
                  type="button"
                  aria-label={dict.reservation.fewerGuests}
                  onClick={() =>
                    patch({ party_size: Math.max(1, state.party_size - 1) })
                  }
                  disabled={sending || state.party_size <= 1}
                  className="flex size-11 items-center justify-center text-gold transition-colors hover:text-gold-pale disabled:opacity-40"
                >
                  <MinusIcon aria-hidden="true" className="size-4" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={20}
                  aria-labelledby={`${id}-guests`}
                  aria-invalid={error('party_size') ? true : undefined}
                  aria-describedby={describe('party_size')}
                  value={state.party_size}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (Number.isInteger(n)) patch({ party_size: n })
                  }}
                  disabled={sending}
                  dir="ltr"
                  className="lr-display w-full bg-transparent py-2 text-center text-2xl text-ivory tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label={dict.reservation.moreGuests}
                  onClick={() =>
                    patch({ party_size: Math.min(20, state.party_size + 1) })
                  }
                  disabled={sending || state.party_size >= 20}
                  className="flex size-11 items-center justify-center text-gold transition-colors hover:text-gold-pale disabled:opacity-40"
                >
                  <PlusIcon aria-hidden="true" className="size-4" />
                </button>
              </div>
              <FieldError id={describe('party_size')} message={error('party_size')} />
            </div>
          </div>
        </ChapterFrame>

        {/* Chapter 3: Details */}
        <ChapterFrame
          id={CHAPTER_IDS.details}
          number="03"
          title={dict.reservation.askDetails}
        >
          <div className="grid gap-8 md:grid-cols-2 md:gap-x-10">
            <Field
              id={`${id}-guest_name`}
              label={dict.reservation.name}
              error={error('guest_name')}
            >
              <input
                id={`${id}-guest_name`}
                type="text"
                autoComplete="name"
                value={state.guest_name}
                onChange={(e) => patch({ guest_name: e.target.value })}
                disabled={sending}
                aria-invalid={error('guest_name') ? true : undefined}
                aria-describedby={describe('guest_name')}
                className={INPUT}
              />
            </Field>
            <Field
              id={`${id}-guest_email`}
              label={dict.reservation.email}
              error={error('guest_email')}
            >
              <input
                id={`${id}-guest_email`}
                type="email"
                autoComplete="email"
                value={state.guest_email}
                onChange={(e) => patch({ guest_email: e.target.value })}
                disabled={sending}
                dir="ltr"
                aria-invalid={error('guest_email') ? true : undefined}
                aria-describedby={describe('guest_email')}
                className={INPUT}
              />
            </Field>
            <Field
              id={`${id}-guest_phone`}
              label={dict.reservation.phone}
              error={error('guest_phone')}
            >
              <input
                id={`${id}-guest_phone`}
                type="tel"
                autoComplete="tel"
                placeholder="+966 5x xxx xxxx"
                value={state.guest_phone}
                onChange={(e) => patch({ guest_phone: e.target.value })}
                disabled={sending}
                dir="ltr"
                aria-invalid={error('guest_phone') ? true : undefined}
                aria-describedby={describe('guest_phone')}
                className={INPUT}
              />
            </Field>
            <Field
              id={`${id}-whatsapp`}
              label={dict.reservation.whatsapp}
              error={error('whatsapp')}
            >
              <input
                id={`${id}-whatsapp`}
                type="tel"
                autoComplete="tel"
                placeholder="+966 5x xxx xxxx"
                value={state.whatsapp}
                onChange={(e) => patch({ whatsapp: e.target.value })}
                disabled={sending}
                dir="ltr"
                aria-invalid={error('whatsapp') ? true : undefined}
                aria-describedby={describe('whatsapp')}
                className={INPUT}
              />
            </Field>

            <Tabs
              legend={dict.reservation.occasion}
              name="occasion"
              value={state.occasion}
              options={[
                { value: '', label: dict.reservation.noPreference },
                ...OCCASIONS.map((o) => ({ value: o, label: dict.reservation.occasions[o] })),
              ]}
              onChange={(value) => patch({ occasion: value as BookState['occasion'] })}
              disabled={sending}
            />
            <Tabs
              legend={dict.reservation.seating}
              name="seating_preference"
              value={state.seating_preference}
              options={[
                { value: '', label: dict.reservation.noPreference },
                ...SEATING_PREFERENCES.map((s) => ({ value: s, label: dict.reservation.seatings[s] })),
              ]}
              onChange={(value) =>
                patch({ seating_preference: value as BookState['seating_preference'] })
              }
              disabled={sending}
            />

            <Field
              id={`${id}-notes`}
              label={dict.reservation.notes}
              error={error('notes')}
              className="md:col-span-2"
            >
              <textarea
                id={`${id}-notes`}
                rows={3}
                maxLength={1000}
                value={state.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                disabled={sending}
                aria-invalid={error('notes') ? true : undefined}
                aria-describedby={describe('notes')}
                className={`${INPUT} resize-y`}
              />
            </Field>

            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-ivory-dim">
                <input
                  type="checkbox"
                  checked={state.consent}
                  onChange={(e) => patch({ consent: e.target.checked })}
                  disabled={sending}
                  aria-invalid={error('consent') ? true : undefined}
                  aria-describedby={describe('consent')}
                  className="mt-1 size-4 shrink-0 appearance-none border border-ivory/40 transition-colors checked:border-gold checked:bg-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                />
                {dict.reservation.consent}
              </label>
              <FieldError id={describe('consent')} message={error('consent')} />
            </div>
          </div>
        </ChapterFrame>

        {/* Chapter 4: Review, as a ticket. Also the success state. */}
        <ChapterFrame
          id={CHAPTER_IDS.review}
          number="04"
          title={status === 'done' ? dict.reservation.successTitle : dict.reservation.askReview}
        >
          <Ticket
            state={state}
            branch={branch}
            received={received}
            locale={locale}
            dict={dict}
            onEdit={goTo}
          />
          {status !== 'done' ? (
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-3 border border-gold/60 px-8 py-4 text-[0.8125rem] font-medium tracking-[0.16em] text-gold uppercase transition-[background-color,border-color,color,transform] duration-300 ease-brand hover:border-gold hover:bg-gold/10 active:translate-y-px disabled:opacity-60"
              >
                {dict.reservation.requestTable}
                {sending ? (
                  <CircleNotchIcon
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <ArrowRightIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
                )}
              </button>
              <p role="alert" aria-live="polite" className="text-sm text-gold-pale">
                {status === 'error' ? notice : ''}
              </p>
            </div>
          ) : null}
        </ChapterFrame>
      </form>
    </Container>
  )
}

/** A chapter: anchor target, numeral, question, optional chapter-level
    error line (for fields with no single input, like the room radios). */
function ChapterFrame({
  id,
  number,
  title,
  error,
  errorId,
  children,
}: {
  id: string
  number: string
  title: string
  error?: string
  errorId?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 border-t border-ivory/10 py-14 first:border-t-0 first:pt-4 md:py-20 lg:scroll-mt-32"
    >
      <p aria-hidden="true" className="lr-display text-sm text-gold tabular-nums">
        {number}
      </p>
      <h2
        id={`${id}-title`}
        tabIndex={-1}
        className="lr-display lr-unmask mt-2 text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] leading-[1.1] text-ivory focus:outline-none"
      >
        {title}
      </h2>
      <FieldError id={errorId} message={error} className="mt-3 text-sm" />
      <div className="lr-reveal mt-10" style={{ '--i': 1 } as CSSProperties}>
        {children}
      </div>
    </section>
  )
}

function Field({
  id,
  label,
  error,
  className = '',
  children,
}: {
  id: string
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children}
      <FieldError id={error ? `${id}-error` : undefined} message={error} />
    </div>
  )
}

function FieldError({
  id,
  message,
  className = 'mt-2 text-[0.75rem]',
}: {
  id?: string
  message?: string
  className?: string
}) {
  if (!message) return null
  return (
    <p id={id} role="alert" className={`${className} leading-relaxed text-gold-pale`}>
      {message}
    </p>
  )
}

function Tabs({
  legend,
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  legend: string
  name: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled: boolean
}) {
  return (
    <fieldset className="md:col-span-2">
      <legend className={LABEL}>{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className={TAB}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function HoursHint({
  id,
  branch,
  date,
  locale,
  dict,
}: {
  id: string
  branch: Branch | null
  date: string
  locale: Locale
  dict: Dictionary
}) {
  const hint = branch ? hoursForDate(branch, date, locale) : null
  return (
    <p id={id} className="mt-2 min-h-5 text-[0.75rem] leading-relaxed text-ivory-dim/70">
      {hint && branch
        ? hint.open
          ? interpolate(dict.reservation.hoursOpen, { branch: branch.name, hours: hint.hours })
          : interpolate(dict.reservation.hoursClosed, { branch: branch.name })
        : ''}
    </p>
  )
}

/** The request as a ticket: bone on ink, the one container on the page.
    Before submit each line can be edited; after a 201 it carries the
    reference and the branch's own number. */
function Ticket({
  state,
  branch,
  received,
  locale,
  dict,
  onEdit,
}: {
  state: BookState
  branch: Branch | null
  received: Received | null
  locale: Locale
  dict: Dictionary
  onEdit: (chapter: Chapter) => void
}) {
  const when = toReservedFor(state.date, state.time)
  const lines: { chapter: Chapter; label: string; value: string }[] = [
    { chapter: 'room', label: dict.reservation.chapterRoom, value: branch?.name ?? '' },
    { chapter: 'when', label: dict.reservation.date, value: when ? formatDateTime(when, locale) : '' },
    { chapter: 'when', label: dict.reservation.partySize, value: String(state.party_size) },
    { chapter: 'details', label: dict.reservation.name, value: state.guest_name },
    { chapter: 'details', label: dict.reservation.email, value: state.guest_email },
    { chapter: 'details', label: dict.reservation.phone, value: state.guest_phone },
    { chapter: 'details', label: dict.reservation.whatsapp, value: state.whatsapp },
    { chapter: 'details', label: dict.reservation.occasion, value: state.occasion ? dict.reservation.occasions[state.occasion] : '' },
    { chapter: 'details', label: dict.reservation.seating, value: state.seating_preference ? dict.reservation.seatings[state.seating_preference] : '' },
    { chapter: 'details', label: dict.reservation.notes, value: state.notes },
  ]

  return (
    <div className="relative max-w-2xl bg-bone p-8 text-ink md:p-10">
      <span aria-hidden="true" className="pointer-events-none absolute inset-3 border border-gold-ink/30" />
      {received ? (
        <div role="status" className="border-b border-gold-ink/20 pb-6">
          <p className="text-[0.6875rem] tracking-[0.18em] text-gold-ink uppercase">
            {dict.reservation.reference}
          </p>
          <p className="lr-display mt-1 text-3xl text-ink tabular-nums" dir="ltr">
            {received.reference}
          </p>
          <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
            {interpolate(dict.reservation.successBody, { reference: received.reference })}
          </p>
          <a
            href={`tel:${received.branch.phone}`}
            className="mt-3 inline-flex min-h-6 items-center border-b border-gold-ink/40 pb-0.5 text-sm text-gold-ink transition-colors hover:border-gold-ink hover:text-ink"
          >
            <bdi dir="ltr">{formatPhone(received.branch.phone)}</bdi>
          </a>
        </div>
      ) : null}
      <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-[auto_1fr_auto]">
        {lines
          .filter((line) => line.value)
          .map((line) => (
            <div key={line.label} className="contents">
              <dt className="text-[0.6875rem] tracking-[0.18em] text-ink-soft uppercase sm:pt-1">
                {line.label}
              </dt>
              <dd className={`${line.chapter === 'details' && line.label !== dict.reservation.name ? 'text-sm text-ink-soft' : 'lr-display text-xl text-ink'} break-words`}>
                <bdi>{line.value}</bdi>
              </dd>
              <dd className="sm:text-end">
                {received ? null : (
                  <button
                    type="button"
                    onClick={() => onEdit(line.chapter)}
                    className="text-[0.6875rem] tracking-[0.16em] text-gold-ink uppercase underline-offset-4 hover:underline"
                  >
                    {dict.reservation.edit}
                  </button>
                )}
              </dd>
            </div>
          ))}
      </dl>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint components/reservation`
Expected: no output. Likely first-pass errors and their fixes:
- `dict.reservation.occasions[o]` not indexable: the dictionary keys in Task 2 must be spelled exactly `occasions` and `seatings` with the five and three values.
- `useSearchParams` needs the `Suspense` boundary from Task 3; the page already provides it.

- [ ] **Step 3: Browser pass, desktop English**

With `npm run dev` running, open `http://localhost:3000/en/reservation?branch=al-yasmin` at 1512×860 and check, in order:
1. Al Yasmin's panel is lit with the gold frame; Narjis is dim. Clicking Narjis swaps them.
2. The rail reads `01 Room` in gold; scrolling to When moves the gold to `02`, and `01` gains a check mark (a branch is chosen).
3. Pick a date; the hours line under Time reads e.g. "La Rio Al Narjis is open 12:00 PM - 11:30 PM that day." Pick a Tuesday if a branch is closed that day and confirm the closed line (no branch is closed today; skip if so).
4. Guests: minus stops at 1, plus stops at 20; typing 25 then submitting shows the party-size message.
5. Click "Request a table" with Details empty: the page scrolls to Details, its heading takes focus, the name, email, phone and consent lines show messages, and the review notice reads "Please check the highlighted fields."
6. Fill valid details (phone `+966 51 234 5678` with spaces) and submit: the ticket shows `LR-` + six characters, the success copy, and the branch phone. The submit button is gone.
7. Reload, fill everything, then set the date to today and the time to `00:01`: submit scrolls to When with the "next 90 days" message under Time.

- [ ] **Step 4: Browser pass, Arabic on a phone**

Open `http://localhost:3000/ar/reservation` at 390×844. Check:
1. No horizontal scroll: `document.documentElement.scrollWidth === innerWidth`.
2. The pinned bar reads `01 / 04` and `الفرع`, and changes while scrolling.
3. The date and time inputs render left-to-right and open the browser's picker.
4. Room panels stack; the chosen one lifts.
5. Submit the full flow; the ticket's reference renders left-to-right and the Arabic success line shows it.

- [ ] **Step 5: Commit**

```bash
git add components/reservation/reservation-book.tsx
git commit -m "feat(reservation): the book, rail, chapters and ticket

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Error-state demo, status docs, full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-09-18-lario-frontend-design.md` (§9, add a BUILT line)
- Modify: `../CLAUDE.md` (status bullet that names `/reservation` as unbuilt)
- Modify: `../lario-web-CLAUDE.md` (the "What does NOT exist yet" paragraph)

- [ ] **Step 1: Demo the 429 and the network state**

In the browser console on `/en/reservation`, with a filled form, run:

```js
const orig = window.fetch
window.fetch = (url, init) => orig(url, { ...init, headers: { ...init.headers, 'x-lario-simulate': '429' } })
```

Submit. Expected: "Too many requests. Please try again in a few minutes." under the button, button re-enabled. Then run `window.fetch = () => Promise.reject(new Error('offline'))` and submit. Expected: "We could not send that. Check your connection and try again." Reload to restore fetch.

- [ ] **Step 2: Update the status docs**

In the 2026-09-18 spec, directly under the `## 9. Reservation` heading's first paragraph, add:

```markdown
**BUILT 2026-10-01** as a scrolling book; see
`2026-10-01-reservation-page-design.md` and
`docs/superpowers/plans/2026-10-01-reservation-page.md`.
```

In `../CLAUDE.md`, change the bullet beginning `- **\`/contact\` was built 2026-10-01**` so that it reads: `/contact` and `/reservation` were built 2026-10-01; only the branch routes are still unbuilt, and they are the next job.

In `../lario-web-CLAUDE.md`, in the paragraph beginning `**What does NOT exist yet.**`, change "The branch routes and `/reservation` are still unbuilt" to "`/reservation` was built 2026-10-01 (`app/[locale]/reservation/`, `components/reservation/`, `lib/reservation.ts`). The branch routes are still unbuilt".

- [ ] **Step 3: Full verification**

Run: `npx tsc --noEmit && npx eslint . && npx vitest run && npm run build 2>&1 | tail -15`
Expected: no type or lint errors; all tests pass (229 existing + 16 from Task 1 + 2 from Task 2 = 247); the build lists `/reservation` and `/ar/reservation` as static.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-09-18-lario-frontend-design.md ../CLAUDE.md ../lario-web-CLAUDE.md
git commit -m "docs: record the reservation page as built

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Note: `../CLAUDE.md` and `../lario-web-CLAUDE.md` are outside this repository's root (`lario-web`). If `git add ../CLAUDE.md` fails with "outside repository", those two files belong to the workspace, not this repo: leave them edited and mention it in the handoff.
