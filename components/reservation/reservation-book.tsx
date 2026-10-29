'use client'

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleNotchIcon,
  MinusIcon,
  PlusIcon,
} from '@phosphor-icons/react/ssr'
import { Recaptcha } from '@/components/reservation/recaptcha'
import { Ticket, type Received } from '@/components/reservation/ticket'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { formatClock, formatDay, formatMonth } from '@/lib/format'
import { groupOpeningHours } from '@/lib/hours'
import { interpolate } from '@/lib/i18n/interpolate'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import {
  CHAPTERS,
  allIssues,
  bookableDates,
  chapterIssues,
  firstChapterWithIssues,
  hoursForDate,
  initialState,
  timeSlots,
  toPayload,
  type BookState,
  type Chapter,
} from '@/lib/reservation'
import {
  OCCASIONS,
  SEATING_PREFERENCES,
  VALIDATION_MESSAGES,
} from '@/lib/schemas/reservation'
import type { Branch, Settings } from '@/lib/schemas'

/**
 * The reservation book: one form, one state object, a chapter per question,
 * and the ticket that is both the review step and the success state. Design:
 * docs/superpowers/specs/2026-10-01-reservation-page-design.md.
 *
 * Two readings of the same book. On /reservation the chapters run top to
 * bottom beside a progress rail. With `steps` (the header's pop-up, client
 * request 2026-10-29) one chapter shows at a time and Next checks it first.
 *
 * With a single active branch there is nothing to choose, so the Room chapter
 * is left out and that branch is the booking's. Dates are the next "Dates
 * offered" days (Settings → Reservations) and times are slots from opening to
 * closing, so a guest never types either.
 *
 * Validation is the schema's (lib/reservation.ts wraps it). Error MESSAGES
 * appear after a submit attempt (or a Next), and a 422 replaces them with the
 * server's own words. `reserved_for` is assembled with Riyadh's offset, never
 * the device's.
 */
type Status = 'idle' | 'sending' | 'error' | 'done'
type Issues = Record<string, string[]>
type Step = Chapter | 'review'

const LABEL =
  'block text-[0.6875rem] tracking-[0.18em] text-ivory-dim/70 uppercase'
const INPUT =
  'mt-2 w-full border-b border-ivory/25 bg-transparent py-3 text-base text-ivory transition-colors duration-300 ease-brand placeholder:text-ivory-dim/40 focus:border-gold focus:outline-none aria-invalid:border-gold-pale disabled:opacity-60 [&>option]:bg-bone [&>option]:text-ink'
const TAB =
  'cursor-pointer border border-ivory/20 px-5 py-2.5 text-sm text-ivory-dim transition-colors duration-300 ease-brand hover:border-ivory/50 has-[:checked]:border-gold has-[:checked]:text-ivory has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold'
const CHIP = `${TAB} flex flex-col items-center px-2 text-center has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-35 has-[:disabled]:hover:border-ivory/20`
const GRID_CHIPS = 'mt-3 grid gap-2'

export function ReservationBook({
  branches,
  locale,
  dict,
  settings,
  steps = false,
}: {
  branches: Branch[]
  locale: Locale
  dict: Dictionary
  settings: Settings['reservations']
  /** One chapter at a time, for the pop-up. */
  steps?: boolean
}) {
  const id = useId()
  const initialBranch = useSearchParams().get('branch')
  const [state, setState] = useState<BookState>(() =>
    initialState(
      initialBranch,
      branches.map((b) => b.slug),
    ),
  )
  const [status, setStatus] = useState<Status>('idle')
  const [issues, setIssues] = useState<Issues>({})
  const [notice, setNotice] = useState('')
  const [received, setReceived] = useState<Received | null>(null)
  // What was actually sent. The ticket renders this after a 201, so the
  // reference never sits over details the server did not receive.
  const [submitted, setSubmitted] = useState<BookState | null>(null)
  // A reCAPTCHA token works once: a new round remounts the checkbox.
  const [captchaRound, setCaptchaRound] = useState(0)

  const order: Step[] = [
    ...CHAPTERS.filter((chapter) => chapter !== 'room' || branches.length > 1),
    'review',
  ]
  const [active, setActive] = useState<Step>(order[0])

  const every = settings.slot_minutes ?? 30
  const noticeMinutes = settings.min_notice_minutes ?? 60
  const siteKey = settings.recaptcha_site_key ?? null
  const dates = useMemo(
    () => bookableDates(settings.days_ahead ?? 10),
    [settings.days_ahead],
  )

  // Ids are prefixed in the pop-up: /reservation may hold both books at once.
  const anchor = (step: Step) => (steps ? `${id}-${step}` : step)

  const patch = (next: Partial<BookState>) =>
    setState((current) => ({ ...current, ...next }))
  // Functional, so a burst of clicks (or key auto-repeat) counts every one.
  const step = (delta: number) =>
    setState((current) => ({
      ...current,
      party_size: Math.min(20, Math.max(1, current.party_size + delta)),
    }))

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
  const slots = timeSlots(branch, state.date, every, noticeMinutes)

  // The rail follows the chapter nearest the top of the viewport.
  useEffect(() => {
    if (steps) return
    const sections = order
      .map((key) => document.getElementById(key))
      .filter((el): el is HTMLElement => el !== null)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id as Step)
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the chapters are fixed for the book's life
  }, [steps])

  // In steps, each new question takes focus so a screen reader hears it.
  const opened = useRef(false)
  useEffect(() => {
    if (!steps) return
    if (!opened.current) {
      opened.current = true
      return
    }
    document
      .getElementById(`${anchor(active)}-title`)
      ?.focus({ preventScroll: true })
    document.getElementById(anchor(active))?.scrollIntoView({ block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- anchor is derived from steps and id
  }, [active, status, steps])

  const error = (field: string) => issues[field]?.[0]
  const describe = (field: string) =>
    error(field) ? `${id}-${field}-error` : undefined

  function goTo(target: Step) {
    if (steps) {
      setActive(target)
      return
    }
    const section = document.getElementById(anchor(target))
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    section?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }

  /** Steps: check this chapter, then move on. */
  function next() {
    if (active === 'review') return
    const own = chapterIssues(state, active, locale)
    setIssues(own)
    if (Object.keys(own).length === 0) {
      setActive(order[order.indexOf(active) + 1])
    }
  }

  function back() {
    setIssues({})
    setActive(order[Math.max(0, order.indexOf(active) - 1)])
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return
    // Enter in a field of an earlier step means Next, not send.
    if (steps && active !== 'review') {
      next()
      return
    }

    const clientIssues = {
      ...allIssues(state, locale),
      ...(siteKey && !state.captcha_token
        ? { captcha_token: [VALIDATION_MESSAGES[locale].captcha_token] }
        : {}),
    }
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
        setSubmitted(state)
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
    patch({ captcha_token: '' })
    setCaptchaRound((round) => round + 1)
  }

  const sending = status === 'sending'
  const done = status === 'done'
  const labels: Record<Step, string> = {
    room: dict.reservation.chapterRoom,
    when: dict.reservation.chapterWhen,
    details: dict.reservation.chapterDetails,
    extras: dict.reservation.chapterExtras,
    review: dict.reservation.chapterReview,
  }
  const activeIndex = order.indexOf(active)
  const number = (key: Step) => `0${order.indexOf(key) + 1}`
  const frame = { compact: steps, anchor }

  const chapters: Record<Chapter, () => ReactNode> = {
    room: () => (
      <ChapterFrame
        key="room"
        {...frame}
        step="room"
        number={number('room')}
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
              className={`lr-dark group relative isolate flex cursor-pointer flex-col justify-end overflow-hidden p-8 ${steps ? 'min-h-[16rem]' : 'min-h-[22rem] md:min-h-[28rem]'}`}
            >
              <input
                type="radio"
                name="branch_slug"
                value={room.slug}
                checked={state.branch_slug === room.slug}
                onChange={() => patch({ branch_slug: room.slug, time: '' })}
                disabled={sending}
                className="peer sr-only"
              />
              <Figure
                src={room.card_image ?? room.hero_image}
                slot={`branch.${room.slug}`}
                alt={room.hero_image_alt ?? ''}
                shot={`${room.name}. Entrance or exterior.`}
                sizes="(min-width: 768px) 45vw, 100vw"
                className="absolute inset-0 -z-20"
              />
              {/* Unchosen rooms sit under heavy ink; the chosen one lifts. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-ink/80 transition-colors duration-700 ease-brand group-hover:bg-ink/55 peer-checked:bg-ink/35"
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
                {groupOpeningHours(
                  room.opening_hours,
                  locale,
                  dict.branch.closed,
                ).map((group) => (
                  <span key={group.days}>
                    {group.days} {group.hours}
                  </span>
                ))}
              </span>
            </label>
          ))}
        </fieldset>
      </ChapterFrame>
    ),

    when: () => (
      <ChapterFrame
        key="when"
        {...frame}
        step="when"
        number={number('when')}
        title={dict.reservation.askWhen}
        error={error('reserved_for')}
        errorId={describe('reserved_for')}
      >
        <div className="grid gap-10">
          <fieldset aria-describedby={describe('reserved_for')}>
            <legend className={LABEL}>{dict.reservation.date}</legend>
            <div
              className={`${GRID_CHIPS} grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))]`}
            >
              {dates.map((date, index) => {
                // Closed, or no slot left today: shown, but not offered.
                const open =
                  !branch ||
                  timeSlots(branch, date, every, noticeMinutes).length > 0
                const day = formatDay(date, locale)
                return (
                  <label key={date} className={`${CHIP} py-2.5`}>
                    <input
                      type="radio"
                      name="date"
                      value={date}
                      checked={state.date === date}
                      onChange={() => patch({ date, time: '' })}
                      disabled={sending || !open}
                      className="sr-only"
                    />
                    <span className="text-[0.6875rem] tracking-[0.12em] uppercase">
                      {index === 0 ? dict.reservation.today : day.weekday}
                    </span>
                    <span className="lr-display mt-0.5 text-base whitespace-nowrap">
                      {day.day}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <fieldset aria-describedby={`${id}-hours`}>
            <legend className={LABEL}>{dict.reservation.time}</legend>
            {slots.length > 0 ? (
              <div
                className={`${GRID_CHIPS} grid-cols-[repeat(auto-fill,minmax(6.25rem,1fr))]`}
              >
                {slots.map((time) => (
                  <label
                    key={time}
                    className={`${CHIP} py-2.5 whitespace-nowrap`}
                  >
                    <input
                      type="radio"
                      name="time"
                      value={time}
                      checked={state.time === time}
                      onChange={() => patch({ time })}
                      disabled={sending}
                      className="sr-only"
                    />
                    <bdi dir="ltr" className="tabular-nums">
                      {formatClock(time, locale)}
                    </bdi>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ivory-dim">
                {!branch
                  ? dict.reservation.chooseBranchFirst
                  : !state.date
                    ? dict.reservation.chooseDateFirst
                    : dict.reservation.noTimes}
              </p>
            )}
            <HoursHint
              id={`${id}-hours`}
              branch={branch}
              date={state.date}
              locale={locale}
              dict={dict}
            />
          </fieldset>

          <div className="max-w-xs">
            <span id={`${id}-guests`} className={LABEL}>
              {dict.reservation.partySize}
            </span>
            <div className="mt-2 flex items-center border-b border-ivory/25 focus-within:border-gold">
              <button
                type="button"
                aria-label={dict.reservation.fewerGuests}
                onClick={() => step(-1)}
                disabled={sending || state.party_size <= 1}
                className="flex size-11 items-center justify-center text-gold transition-colors hover:text-gold-pale disabled:opacity-40"
              >
                <MinusIcon aria-hidden="true" className="size-4" />
              </button>
              <input
                type="number"
                name="party_size"
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
                onClick={() => step(1)}
                disabled={sending || state.party_size >= 20}
                className="flex size-11 items-center justify-center text-gold transition-colors hover:text-gold-pale disabled:opacity-40"
              >
                <PlusIcon aria-hidden="true" className="size-4" />
              </button>
            </div>
            <FieldError
              id={describe('party_size')}
              message={error('party_size')}
            />
          </div>
        </div>
      </ChapterFrame>
    ),

    details: () => (
      <ChapterFrame
        key="details"
        {...frame}
        step="details"
        number={number('details')}
        title={dict.reservation.askDetails}
      >
        <div className="grid gap-8 md:grid-cols-2 md:gap-x-10">
          {(
            [
              ['guest_name', dict.reservation.name, 'text', 'name'],
              ['guest_email', dict.reservation.email, 'email', 'email'],
              ['guest_phone', dict.reservation.phone, 'tel', 'tel'],
              ['whatsapp', dict.reservation.whatsapp, 'tel', 'tel'],
            ] as const
          ).map(([field, label, type, autoComplete]) => (
            <Field
              key={field}
              id={`${id}-${field}`}
              label={label}
              error={error(field)}
            >
              <input
                id={`${id}-${field}`}
                name={field}
                type={type}
                autoComplete={autoComplete}
                placeholder={type === 'tel' ? '+966 5x xxx xxxx' : undefined}
                value={state[field]}
                onChange={(e) => patch({ [field]: e.target.value })}
                disabled={sending}
                dir={type === 'text' ? undefined : 'ltr'}
                aria-invalid={error(field) ? true : undefined}
                aria-describedby={describe(field)}
                className={INPUT}
              />
            </Field>
          ))}

          <div className="md:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-ivory-dim">
              <input
                type="checkbox"
                name="consent"
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
    ),

    extras: () => {
      const days = state.birth_month
        ? new Date(Date.UTC(2024, Number(state.birth_month), 0)).getUTCDate()
        : 31
      return (
        <ChapterFrame
          key="extras"
          {...frame}
          step="extras"
          number={number('extras')}
          title={dict.reservation.askExtras}
        >
          <div className="grid gap-8 md:grid-cols-2 md:gap-x-10">
            <fieldset className="md:col-span-2">
              <legend className={LABEL}>{dict.reservation.letUsKnow}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ['has_allergies', dict.reservation.hasAllergies],
                    ['has_occasion', dict.reservation.hasOccasion],
                  ] as const
                ).map(([flag, label]) => (
                  <label
                    key={flag}
                    className={`${TAB} inline-flex items-center gap-2`}
                  >
                    <input
                      type="checkbox"
                      checked={state[flag]}
                      onChange={(e) => patch({ [flag]: e.target.checked })}
                      disabled={sending}
                      className="peer sr-only"
                    />
                    <CheckIcon
                      aria-hidden="true"
                      weight="bold"
                      className="hidden size-3 text-gold peer-checked:block"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {state.has_allergies ? (
              <Field
                id={`${id}-allergies`}
                label={dict.reservation.allergies}
                error={error('allergies')}
                className="md:col-span-2"
              >
                <textarea
                  id={`${id}-allergies`}
                  name="allergies"
                  rows={2}
                  maxLength={500}
                  value={state.allergies}
                  onChange={(e) => patch({ allergies: e.target.value })}
                  disabled={sending}
                  aria-invalid={error('allergies') ? true : undefined}
                  aria-describedby={describe('allergies')}
                  className={`${INPUT} resize-y`}
                />
              </Field>
            ) : null}

            {state.has_occasion ? (
              <Tabs
                legend={dict.reservation.occasion}
                name="occasion"
                value={state.occasion}
                options={OCCASIONS.map((o) => ({
                  value: o,
                  label: dict.reservation.occasions[o],
                }))}
                onChange={(value) =>
                  patch({ occasion: value as BookState['occasion'] })
                }
                disabled={sending}
              />
            ) : null}

            <fieldset
              className="md:col-span-2"
              aria-describedby={`${id}-birthday-hint`}
            >
              <legend className={LABEL}>{dict.reservation.birthday}</legend>
              <div className="grid max-w-sm grid-cols-[1fr_6rem] gap-6">
                <select
                  aria-label={dict.reservation.birthMonth}
                  value={state.birth_month}
                  onChange={(e) => {
                    const month = e.target.value
                    const last = month
                      ? new Date(Date.UTC(2024, Number(month), 0)).getUTCDate()
                      : 31
                    patch({
                      birth_month: month,
                      birth_day:
                        Number(state.birth_day) > last ? '' : state.birth_day,
                    })
                  }}
                  disabled={sending}
                  aria-invalid={error('birth_month') ? true : undefined}
                  className={INPUT}
                >
                  <option value="">{dict.reservation.birthMonth}</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {formatMonth(i + 1, locale)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={dict.reservation.birthDay}
                  value={state.birth_day}
                  onChange={(e) => patch({ birth_day: e.target.value })}
                  disabled={sending}
                  aria-invalid={error('birth_day') ? true : undefined}
                  aria-describedby={describe('birth_day')}
                  dir="ltr"
                  className={INPUT}
                >
                  <option value="">{dict.reservation.birthDay}</option>
                  {Array.from({ length: days }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <p
                id={`${id}-birthday-hint`}
                className="mt-2 text-[0.75rem] text-ivory-dim/70"
              >
                {dict.reservation.birthdayHint}
              </p>
              <FieldError
                id={describe('birth_day')}
                message={error('birth_day') ?? error('birth_month')}
              />
            </fieldset>

            <Tabs
              legend={dict.reservation.seating}
              name="seating_preference"
              value={state.seating_preference}
              options={[
                { value: '', label: dict.reservation.noPreference },
                ...SEATING_PREFERENCES.map((s) => ({
                  value: s,
                  label: dict.reservation.seatings[s],
                })),
              ]}
              onChange={(value) =>
                patch({
                  seating_preference: value as BookState['seating_preference'],
                })
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
                name="notes"
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
          </div>
        </ChapterFrame>
      )
    },
  }

  const submitButton = (
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
  )
  const alert = (
    <p role="alert" aria-live="polite" className="text-sm text-gold-pale">
      {status === 'error' ? notice : ''}
    </p>
  )

  // Chapter: Review, as a ticket. Also the success state.
  const review = (
    <ChapterFrame
      key="review"
      {...frame}
      step="review"
      number={number('review')}
      title={done ? dict.reservation.successTitle : dict.reservation.askReview}
    >
      <Ticket
        state={submitted ?? state}
        branch={branch}
        received={received}
        locale={locale}
        dict={dict}
        onEdit={goTo}
      />
      {!done && siteKey ? (
        <div className="mt-8">
          <Recaptcha
            key={captchaRound}
            siteKey={siteKey}
            locale={locale}
            theme={steps ? 'light' : 'dark'}
            onToken={(token) => patch({ captcha_token: token })}
          />
          <FieldError
            id={describe('captcha_token')}
            message={error('captcha_token')}
          />
        </div>
      ) : null}
      {!done && !steps ? (
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          {submitButton}
          {alert}
        </div>
      ) : null}
    </ChapterFrame>
  )

  const stepButton =
    'inline-flex min-h-11 items-center gap-2 text-[0.75rem] font-medium tracking-[0.16em] uppercase transition-colors duration-300 ease-brand disabled:opacity-40'

  if (steps) {
    return (
      <form onSubmit={onSubmit} noValidate className="min-w-0">
        {done ? null : (
          <p className="flex items-center justify-between border-b border-ivory/10 pb-3 text-[0.75rem] tracking-[0.16em] uppercase">
            <span className="text-gold tabular-nums">
              {interpolate(dict.reservation.stepOf, {
                step: `0${activeIndex + 1}`,
                total: `0${order.length}`,
              })}
            </span>
            <span className="text-ivory">{labels[active]}</span>
          </p>
        )}
        {done || active === 'review' ? review : chapters[active]()}
        {done ? null : (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ivory/10 pt-6">
            {activeIndex > 0 ? (
              <button
                type="button"
                onClick={back}
                disabled={sending}
                className={`${stepButton} text-ivory-dim hover:text-ivory`}
              >
                <ArrowLeftIcon
                  aria-hidden="true"
                  className="size-4 rtl:rotate-180"
                />
                {dict.actions.back}
              </button>
            ) : (
              <span />
            )}
            {active === 'review' ? (
              <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
                {alert}
                {submitButton}
              </div>
            ) : (
              <button
                type="button"
                onClick={next}
                className={`${stepButton} border border-gold/60 px-7 py-3 text-gold hover:border-gold hover:bg-gold/10`}
              >
                {dict.actions.next}
                <ArrowRightIcon
                  aria-hidden="true"
                  className="size-4 rtl:rotate-180"
                />
              </button>
            )}
          </div>
        )}
      </form>
    )
  }

  return (
    <Container
      className={
        done
          ? 'pb-24 md:pb-32'
          : 'pb-24 md:pb-32 lg:grid lg:grid-cols-[10rem_1fr] lg:gap-16'
      }
    >
      {/* The rail. One nav, two renderings: a sticky column from lg, a slim
          bar pinned under the header below it. The nav itself is sticky:
          a sticky child cannot leave a parent that is exactly its own height.
          Numerals are the stepper position spec §9 requires, not decoration.
          Once the request is received the book is over, so the rail and the
          filled chapters go with it and only the ticket remains. */}
      {done ? null : (
        <nav
          aria-label={dict.reservation.progress}
          className="sticky top-20 z-10 lg:top-32 lg:self-start"
        >
          <ol className="hidden lg:flex lg:flex-col lg:gap-6">
            {order.map((key, index) => {
              const finished = key !== 'review' && complete[key]
              const current = key === active
              return (
                <li key={key}>
                  <a
                    href={`#${key}`}
                    aria-current={current ? 'step' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      goTo(key)
                    }}
                    className={`group flex items-baseline gap-3 transition-colors duration-300 ease-brand hover:text-gold ${current ? 'text-ivory' : 'text-ivory-dim/70'}`}
                  >
                    <span
                      className={`lr-display text-2xl tabular-nums transition-colors duration-500 ease-brand ${current ? 'text-gold' : ''}`}
                    >
                      0{index + 1}
                    </span>
                    <span className="text-[0.75rem] tracking-[0.16em] uppercase">
                      {labels[key]}
                    </span>
                    {finished ? (
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
          <p className="-mx-5 flex items-center justify-between border-b border-ivory/10 bg-ink/95 px-5 py-3 text-[0.75rem] tracking-[0.16em] uppercase backdrop-blur-sm sm:-mx-8 sm:px-8 lg:hidden">
            <span className="text-gold">
              {interpolate(dict.reservation.stepOf, {
                step: `0${activeIndex + 1}`,
                total: `0${order.length}`,
              })}
            </span>
            <span className="text-ivory">{labels[active]}</span>
          </p>
        </nav>
      )}

      <form onSubmit={onSubmit} noValidate className="min-w-0">
        {done
          ? null
          : order.map((key) => (key === 'review' ? null : chapters[key]()))}
        {review}
      </form>
    </Container>
  )
}

/** A chapter: anchor target, numeral, question, optional chapter-level
    error line (for fields with no single input, like the room radios).
    `compact` is the pop-up's: tighter, and no scroll-driven entrance. */
function ChapterFrame({
  step,
  anchor,
  compact,
  number,
  title,
  error,
  errorId,
  children,
}: {
  step: Step
  anchor: (step: Step) => string
  compact: boolean
  number: string
  title: string
  error?: string
  errorId?: string
  children: ReactNode
}) {
  const id = anchor(step)
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={
        compact
          ? 'scroll-mt-4 pt-8'
          : 'scroll-mt-28 border-t border-ivory/10 py-14 first:border-t-0 first:pt-4 md:py-20 lg:scroll-mt-32'
      }
    >
      <p
        aria-hidden="true"
        className="lr-display text-sm text-gold tabular-nums"
      >
        {number}
      </p>
      <h2
        id={`${id}-title`}
        tabIndex={-1}
        className={`lr-display mt-2 leading-[1.1] text-ivory focus:outline-none ${compact ? 'text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)]' : 'lr-unmask text-[clamp(1.75rem,1.2rem+2vw,2.75rem)]'}`}
      >
        {title}
      </h2>
      <FieldError id={errorId} message={error} className="mt-3 text-sm" />
      <div
        className={compact ? 'mt-8' : 'lr-reveal mt-10'}
        style={compact ? undefined : ({ '--i': 1 } as CSSProperties)}
      >
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
    <p
      id={id}
      role="alert"
      className={`${className} leading-relaxed text-gold-pale`}
    >
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
    <p
      id={id}
      className="mt-2 min-h-5 text-[0.75rem] leading-relaxed text-ivory-dim/70"
    >
      {hint && branch
        ? hint.open
          ? interpolate(dict.reservation.hoursOpen, {
              branch: branch.name,
              hours: hint.hours,
            })
          : interpolate(dict.reservation.hoursClosed, { branch: branch.name })
        : ''}
    </p>
  )
}
