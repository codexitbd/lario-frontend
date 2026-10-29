'use client'

import { useEffect, useRef } from 'react'
import type { Locale } from '@/lib/i18n/config'

type Grecaptcha = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string
      theme: 'dark' | 'light'
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ) => number
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
    lrRecaptchaReady?: () => void
  }
}

let loading: Promise<void> | null = null

/** Google's script, once per page, whichever form asks first. */
function load(locale: Locale): Promise<void> {
  loading ??= new Promise((resolve) => {
    window.lrRecaptchaReady = resolve
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?onload=lrRecaptchaReady&render=explicit&hl=${locale}`
    script.async = true
    document.head.append(script)
  })
  return loading
}

/**
 * The "I'm not a robot" checkbox (Google reCAPTCHA v2), shown only when the
 * admin has set both keys (Settings → Integrations). The token goes up with the
 * request and Laravel checks it with Google. A token works once, so the book
 * remounts this (a new `key`) after any refused request.
 */
export function Recaptcha({
  siteKey,
  locale,
  theme,
  onToken,
}: {
  siteKey: string
  locale: Locale
  /** Match the ground: dark on the page, light in the pop-up. */
  theme: 'dark' | 'light'
  onToken: (token: string) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const callback = useRef(onToken)
  useEffect(() => {
    callback.current = onToken
  })

  useEffect(() => {
    let cancelled = false
    load(locale).then(() => {
      // hasChildNodes: React's dev double-run must not render the widget twice.
      if (cancelled || !box.current || box.current.hasChildNodes()) return
      window.grecaptcha?.render(box.current, {
        sitekey: siteKey,
        theme,
        callback: (token) => callback.current(token),
        'expired-callback': () => callback.current(''),
        'error-callback': () => callback.current(''),
      })
    })
    return () => {
      cancelled = true
    }
  }, [siteKey, locale, theme])

  return <div ref={box} className="min-h-[78px]" />
}
