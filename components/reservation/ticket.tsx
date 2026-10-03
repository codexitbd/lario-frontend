import { formatDateTime, formatPhone } from '@/lib/format'
import { interpolate } from '@/lib/i18n/interpolate'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { toReservedFor, type BookState, type Chapter } from '@/lib/reservation'
import type { Branch } from '@/lib/schemas'

/** The mock's 201 body (03-api-contract.md, POST /reservations). */
export type Received = {
  reference: string
  reserved_for: string
  branch: { slug: string; name: string; phone: string; email: string }
}

/** The request as a ticket: bone on ink, the one container on the page.
    Before submit each line can be edited; after a 201 it carries the
    reference and the branch's own number. */
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
  const lines: {
    chapter: Chapter
    label: string
    value: string
    display?: boolean
  }[] = [
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
      chapter: 'details',
      label: dict.reservation.occasion,
      value: state.occasion ? dict.reservation.occasions[state.occasion] : '',
    },
    {
      chapter: 'details',
      label: dict.reservation.seating,
      value: state.seating_preference
        ? dict.reservation.seatings[state.seating_preference]
        : '',
    },
    { chapter: 'details', label: dict.reservation.notes, value: state.notes },
  ]

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
