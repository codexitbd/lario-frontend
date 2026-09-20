'use client'

import { useId, useRef, useState } from 'react'
import { ArrowRightIcon, CheckIcon, CircleNotchIcon } from '@phosphor-icons/react/ssr'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * Newsletter signup. Posts to /api/newsletter, which is a real endpoint with
 * real validation, not a form that swallows the submit.
 *
 * NOT A BOXED FIELD. The input is a ruled line, which is how a signature panel
 * or a reservation book is set, and it keeps the footer's no-container rule
 * intact. The rule brightens to gold on focus so the affordance survives
 * without a box.
 *
 * Every state is built, not just the happy one: idle, submitting (the control
 * is disabled and the spinner replaces the arrow), success (the form is
 * replaced by the confirmation, so nobody submits twice), and error, which
 * distinguishes a 422 field message from a transport failure and puts both in
 * an `aria-live` region.
 *
 * Validation is the server's. `type="email"` plus `required` gives the browser
 * its own pass first, and the 422 body carries messages already localised by
 * the endpoint, so this never hard-codes English error copy.
 */
type Status = 'idle' | 'sending' | 'done' | 'error'

export function NewsletterForm({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  const id = useId()
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    const email = inputRef.current?.value.trim() ?? ''
    setStatus('sending')
    setMessage('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      })

      if (response.ok) {
        setStatus('done')
        return
      }

      // 422 carries per-field messages already in the request locale; anything
      // else is a transport or server problem and gets the generic line.
      const body = await response.json().catch(() => null)
      const fieldError = body?.errors?.email?.[0] as string | undefined
      setMessage(fieldError ?? body?.message ?? dict.footer.newsletterError)
      setStatus('error')
    } catch {
      setMessage(dict.footer.newsletterError)
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <p
        role="status"
        className="mt-7 flex items-start gap-3 text-sm leading-relaxed text-gold"
      >
        <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {dict.footer.newsletterSuccess}
      </p>
    )
  }

  const sending = status === 'sending'

  return (
    <form onSubmit={onSubmit} noValidate={false} className="mt-7 max-w-md">
      <label
        htmlFor={id}
        className="block text-[0.6875rem] tracking-[0.18em] text-ivory-dim/70 uppercase"
      >
        {dict.footer.newsletterLabel}
      </label>

      {/* The rule lives on the wrapper, not the input, so it lights up when
          either the field or the submit has focus. */}
      <div className="mt-2 flex items-center gap-3 border-b border-ivory/25 transition-colors duration-300 ease-brand focus-within:border-gold">
        <input
          ref={inputRef}
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={sending}
          dir="ltr"
          aria-describedby={`${id}-note`}
          aria-invalid={status === 'error'}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-ivory placeholder:text-ivory-dim/50 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending}
          className="flex min-h-11 items-center gap-2 py-2 text-[0.75rem] font-medium tracking-[0.16em] text-gold uppercase transition-colors duration-300 ease-brand hover:text-gold-pale disabled:opacity-60"
        >
          {dict.footer.newsletterAction}
          {sending ? (
            <CircleNotchIcon
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <ArrowRightIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
          )}
        </button>
      </div>

      <p
        id={`${id}-note`}
        className="mt-3 text-[0.75rem] leading-relaxed text-ivory-dim/60"
      >
        {dict.footer.newsletterConsent}
      </p>

      <p role="alert" aria-live="polite" className="mt-2 text-[0.75rem] text-gold-pale empty:mt-0">
        {status === 'error' ? message : ''}
      </p>
    </form>
  )
}
