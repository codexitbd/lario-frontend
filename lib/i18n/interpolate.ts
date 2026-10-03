/** "{count} guests" + {count: '4'} → "4 guests". Client-safe (no data fetching). */
export function interpolate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  )
}
