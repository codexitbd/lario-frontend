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
