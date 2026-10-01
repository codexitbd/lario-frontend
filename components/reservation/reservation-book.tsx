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
import { Ticket, type Received } from '@/components/reservation/ticket'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
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
    section?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
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
      <nav
        aria-label={dict.nav.primary}
        className="lg:sticky lg:top-32 lg:self-start"
      >
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
                name="date"
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
                name="time"
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
                name="guest_name"
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
                name="guest_email"
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
                name="guest_phone"
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
                name="whatsapp"
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
                ...OCCASIONS.map((o) => ({
                  value: o,
                  label: dict.reservation.occasions[o],
                })),
              ]}
              onChange={(value) =>
                patch({ occasion: value as BookState['occasion'] })
              }
              disabled={sending}
            />
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

        {/* Chapter 4: Review, as a ticket. Also the success state. */}
        <ChapterFrame
          id={CHAPTER_IDS.review}
          number="04"
          title={
            status === 'done'
              ? dict.reservation.successTitle
              : dict.reservation.askReview
          }
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
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="size-4 rtl:rotate-180"
                  />
                )}
              </button>
              <p
                role="alert"
                aria-live="polite"
                className="text-sm text-gold-pale"
              >
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
