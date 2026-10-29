import { DownloadSimpleIcon } from '@phosphor-icons/react/ssr'
import { formatDateTime, formatMonth, formatPhone } from '@/lib/format'
import { interpolate } from '@/lib/i18n/interpolate'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { toReservedFor, type BookState, type Chapter } from '@/lib/reservation'
import type { Branch } from '@/lib/schemas'

/** The 201 body (03-api-contract.md, POST /reservations). */
export type Received = {
  reference: string
  reserved_for: string
  /** The guest's token: an SVG data URI that staff scan at the door. */
  qr?: string
  branch: { slug: string; name: string; phone: string; email: string }
}

/** The request as a ticket: bone on ink, the one container on the page.
    Before submit each line can be edited; after a 201 it carries the
    reference, the branch's own number and the QR token, which the guest can
    save as an image. */
export function Ticket({
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
  type Line = {
    chapter: Chapter
    label: string
    value: string
    display?: boolean
  }
  const lines = (
    [
      {
        chapter: 'room',
        label: dict.reservation.chapterRoom,
        value: branch?.name ?? '',
        display: true,
      },
      {
        chapter: 'when',
        label: dict.reservation.date,
        value: when ? formatDateTime(when, locale) : '',
        display: true,
      },
      {
        chapter: 'when',
        label: dict.reservation.partySize,
        value: String(state.party_size),
        display: true,
      },
      {
        chapter: 'details',
        label: dict.reservation.name,
        value: state.guest_name,
        display: true,
      },
      {
        chapter: 'details',
        label: dict.reservation.email,
        value: state.guest_email,
      },
      {
        chapter: 'details',
        label: dict.reservation.phone,
        value: state.guest_phone,
      },
      {
        chapter: 'details',
        label: dict.reservation.whatsapp,
        value: state.whatsapp,
      },
      {
        chapter: 'extras',
        label: dict.reservation.hasAllergies,
        value: state.has_allergies ? state.allergies.trim() : '',
      },
      {
        chapter: 'extras',
        label: dict.reservation.occasion,
        value:
          state.has_occasion && state.occasion
            ? dict.reservation.occasions[state.occasion]
            : '',
      },
      {
        chapter: 'extras',
        label: dict.reservation.birthdayShort,
        value:
          state.birth_month && state.birth_day
            ? `${state.birth_day} ${formatMonth(Number(state.birth_month), locale)}`
            : '',
      },
      {
        chapter: 'extras',
        label: dict.reservation.seating,
        value: state.seating_preference
          ? dict.reservation.seatings[state.seating_preference]
          : '',
      },
      { chapter: 'extras', label: dict.reservation.notes, value: state.notes },
    ] satisfies Line[]
  ).filter((line) => line.value)

  return (
    <div className="relative max-w-2xl bg-bone p-8 text-ink md:p-10">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 border border-gold-ink/30"
      />
      {received ? (
        <div role="status" className="border-b border-gold-ink/20 pb-6">
          <p className="text-[0.6875rem] tracking-[0.18em] text-gold-ink uppercase">
            {dict.reservation.reference}
          </p>
          <p
            className="lr-display mt-1 text-3xl text-ink tabular-nums"
            dir="ltr"
          >
            {received.reference}
          </p>
          <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
            {interpolate(dict.reservation.successBody, {
              reference: received.reference,
            })}
          </p>
          <a
            href={`tel:${received.branch.phone}`}
            className="mt-3 inline-flex min-h-6 items-center border-b border-gold-ink/40 pb-0.5 text-sm text-gold-ink transition-colors hover:border-gold-ink hover:text-ink"
          >
            <bdi dir="ltr">{formatPhone(received.branch.phone)}</bdi>
          </a>
          {received.qr ? (
            <div className="mt-6 flex flex-wrap items-end gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element -- a data URI, nothing to optimise */}
              <img
                src={received.qr}
                alt={interpolate(dict.reservation.qrAlt, {
                  reference: received.reference,
                })}
                width={160}
                height={160}
                className="size-40 bg-white"
              />
              <div className="flex flex-col gap-3">
                <p className="max-w-[24ch] text-sm leading-relaxed text-ink-soft">
                  {dict.reservation.qrNote}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    downloadTicket(
                      received,
                      lines.map((line) => [line.label, line.value]),
                      dict.reservation.reference,
                      locale,
                    )
                  }
                  className="inline-flex min-h-11 items-center gap-2 self-start border border-gold-ink/50 px-5 text-[0.75rem] font-medium tracking-[0.14em] text-gold-ink uppercase transition-colors hover:border-gold-ink hover:text-ink"
                >
                  <DownloadSimpleIcon aria-hidden="true" className="size-4" />
                  {dict.reservation.download}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-[auto_1fr_auto]">
        {lines.map((line) => (
          <div key={line.label} className="contents">
            <dt className="text-[0.6875rem] tracking-[0.18em] text-ink-soft uppercase sm:pt-1">
              {line.label}
            </dt>
            <dd
              className={`break-words ${line.display ? 'lr-display text-xl text-ink' : 'text-sm text-ink-soft'}`}
            >
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

/**
 * The ticket as a PNG the guest keeps: reference, the request's lines and the
 * QR, drawn on a canvas in the page's own colours. A picture saves to a phone's
 * photos, which a web page cannot.
 */
async function downloadTicket(
  received: Received,
  lines: [string, string][],
  referenceLabel: string,
  locale: Locale,
): Promise<void> {
  if (!received.qr) return
  const css = getComputedStyle(document.documentElement)
  const colour = (token: string, fallback: string) =>
    css.getPropertyValue(token).trim() || fallback
  const font = getComputedStyle(document.body).fontFamily
  const width = 720
  const pad = 64
  const qrSize = 300
  const height = pad * 2 + 120 + lines.length * 66 + qrSize + 40

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = colour('--color-bone', '#f4efe6')
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = colour('--color-gold-ink', '#8a6a2f')
  ctx.globalAlpha = 0.35
  ctx.strokeRect(14, 14, width - 28, height - 28)
  ctx.globalAlpha = 1

  const rtl = locale === 'ar'
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.textAlign = rtl ? 'right' : 'left'
  const x = rtl ? width - pad : pad
  const ink = colour('--color-ink', '#0e1413')
  const soft = colour('--color-ink-soft', '#4a4f4d')

  let y = pad + 16
  ctx.fillStyle = colour('--color-gold-ink', '#8a6a2f')
  ctx.font = `600 18px ${font}`
  ctx.fillText(referenceLabel.toUpperCase(), x, y)
  y += 52
  ctx.fillStyle = ink
  ctx.font = `600 44px ${font}`
  ctx.fillText(received.reference, x, y)
  y += 52

  for (const [label, value] of lines) {
    ctx.fillStyle = soft
    ctx.font = `16px ${font}`
    ctx.fillText(label.toUpperCase(), x, y)
    ctx.fillStyle = ink
    ctx.font = `24px ${font}`
    ctx.fillText(value, x, y + 30, width - pad * 2)
    y += 66
  }

  const qr = new Image()
  qr.src = received.qr
  await qr.decode()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect((width - qrSize) / 2, y + 8, qrSize, qrSize)
  ctx.drawImage(qr, (width - qrSize) / 2, y + 8, qrSize, qrSize)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  )
  if (!blob) return
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `la-rio-${received.reference}.png`
  link.click()
  // Later, not now: Safari cancels a download whose URL is already revoked.
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
}
