'use client'

import { useId, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRightIcon,
  CheckIcon,
  CircleNotchIcon,
} from '@phosphor-icons/react/ssr'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Branch } from '@/lib/schemas'

/**
 * The contact form. Posts to /api/contacts, the mock of `POST /contacts` in
 * 03-api-contract.md, and renders every state the contract can produce: idle,
 * sending, received (201), field errors (422, one line under each field, in
 * the request locale, straight from the response), rate limited (429) and a
 * transport failure.
 *
 * RULED LINES, NOT BOXES, the same as the newsletter form in the footer: the
 * field is a baseline that brightens to gold on focus and to gold-pale when it
 * carries an error. The branch choice is a row of native radios styled as
 * small square tabs, because "which room is this about" is a choice, not a
 * text answer, and a <select> would put the two names behind a click.
 *
 * Validation is the server's. The browser's own `required` / `type` pass runs
 * first, and anything that gets past it comes back as a 422 whose messages are
 * already localised, so no error copy is hard-coded here. The phone field
 * strips spaces and dashes before sending because the contract wants E.164 and
 * people type "+966 51 234 5678".
 *
 * Uncontrolled inputs on purpose: nothing here needs to re-render per
 * keystroke, and FormData reads the whole form once on submit.
 */
type Status = 'idle' | 'sending' | 'done' | 'error'
type FieldName =
  | 'name'
  | 'email'
  | 'phone'
  | 'subject'
  | 'message'
  | 'branch_slug'
type Errors = Partial<Record<FieldName, string>>

const LABEL =
  'block text-[0.6875rem] tracking-[0.18em] text-ivory-dim/70 uppercase'
const INPUT =
  'mt-2 w-full border-b border-ivory/25 bg-transparent py-3 text-base text-ivory transition-colors duration-300 ease-brand placeholder:text-ivory-dim/40 focus:border-gold focus:outline-none aria-invalid:border-gold-pale disabled:opacity-60'

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
      {/* Always rendered so the live region exists before it has anything to
          say; `empty:hidden` keeps it from taking space until then. */}
      <p
        id={`${id}-error`}
        role="alert"
        className="mt-2 text-[0.75rem] leading-relaxed text-gold-pale empty:hidden"
      >
        {error ?? ''}
      </p>
    </div>
  )
}

export function ContactForm({
  branches,
  locale,
  dict,
}: {
  branches: Branch[]
  locale: Locale
  dict: Dictionary
}) {
  const id = useId()
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Errors>({})
  const [notice, setNotice] = useState('')

  const field = (name: FieldName) => ({
    id: `${id}-${name}`,
    name,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined,
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    const data = new FormData(event.currentTarget)
    const text = (name: FieldName) => String(data.get(name) ?? '').trim()
    // Optional fields go as `undefined`, not "": the schema accepts absent or
    // null, and an empty string would fail the phone regex.
    const optional = (value: string) => (value ? value : undefined)

    setStatus('sending')
    setErrors({})
    setNotice('')

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: text('name'),
          email: text('email'),
          phone: optional(text('phone').replace(/[\s-]/g, '')),
          subject: optional(text('subject')),
          message: text('message'),
          branch_slug: optional(text('branch_slug')),
          locale,
        }),
      })

      if (response.ok) {
        setStatus('done')
        return
      }

      if (response.status === 429) {
        setNotice(dict.reservation.errorRateLimit)
      } else if (response.status === 422) {
        const body = (await response.json().catch(() => null)) as {
          message?: string
          errors?: Record<string, string[]>
        } | null
        const next: Errors = {}
        for (const [key, messages] of Object.entries(body?.errors ?? {})) {
          if (messages[0]) next[key as FieldName] = messages[0]
        }
        setErrors(next)
        setNotice(body?.message ?? dict.reservation.errorNetwork)
      } else {
        setNotice(dict.reservation.errorNetwork)
      }
      setStatus('error')
    } catch {
      setNotice(dict.reservation.errorNetwork)
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div role="status" className="lg:pt-3">
        <p className="flex items-center gap-3 text-gold">
          <CheckIcon aria-hidden="true" weight="bold" className="size-5" />
          <span className="lr-display text-2xl text-ivory">
            {dict.contact.successTitle}
          </span>
        </p>
        <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-ivory-dim">
          {dict.contact.successBody}
        </p>
      </div>
    )
  }

  const sending = status === 'sending'

  return (
    <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-2 md:gap-x-10">
      <Field
        id={`${id}-name`}
        label={dict.reservation.name}
        error={errors.name}
      >
        <input
          {...field('name')}
          type="text"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          disabled={sending}
          className={INPUT}
        />
      </Field>

      <Field
        id={`${id}-email`}
        label={dict.reservation.email}
        error={errors.email}
      >
        <input
          {...field('email')}
          type="email"
          required
          autoComplete="email"
          disabled={sending}
          dir="ltr"
          className={INPUT}
        />
      </Field>

      <Field
        id={`${id}-phone`}
        label={dict.contact.phoneOptional}
        error={errors.phone}
      >
        <input
          {...field('phone')}
          type="tel"
          autoComplete="tel"
          disabled={sending}
          dir="ltr"
          placeholder="+966 5x xxx xxxx"
          className={INPUT}
        />
      </Field>

      <Field
        id={`${id}-subject`}
        label={dict.contact.subject}
        error={errors.subject}
      >
        <input
          {...field('subject')}
          type="text"
          maxLength={200}
          disabled={sending}
          className={INPUT}
        />
      </Field>

      <fieldset className="md:col-span-2">
        <legend className={LABEL}>{dict.contact.branch}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { value: '', label: dict.contact.branchAny },
            ...branches.map((branch) => ({
              value: branch.slug,
              label: branch.name,
            })),
          ].map((option) => (
            <label
              key={option.value}
              className="cursor-pointer border border-ivory/20 px-5 py-2.5 text-sm text-ivory-dim transition-colors duration-300 ease-brand hover:border-ivory/50 has-[:checked]:border-gold has-[:checked]:text-ivory has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold"
            >
              <input
                type="radio"
                name="branch_slug"
                value={option.value}
                defaultChecked={option.value === ''}
                disabled={sending}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.branch_slug ? (
          <p role="alert" className="mt-2 text-[0.75rem] text-gold-pale">
            {errors.branch_slug}
          </p>
        ) : null}
      </fieldset>

      <Field
        id={`${id}-message`}
        label={dict.contact.message}
        error={errors.message}
        className="md:col-span-2"
      >
        <textarea
          {...field('message')}
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          disabled={sending}
          className={`${INPUT} resize-y`}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 md:col-span-2">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-3 border border-gold/60 px-8 py-4 text-[0.8125rem] font-medium tracking-[0.16em] text-gold uppercase transition-[background-color,border-color,color,transform] duration-300 ease-brand hover:border-gold hover:bg-gold/10 active:translate-y-px disabled:opacity-60"
        >
          {dict.contact.send}
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
        <p role="alert" aria-live="polite" className="text-sm text-gold-pale">
          {status === 'error' ? notice : ''}
        </p>
      </div>
    </form>
  )
}
