import { cacheTag } from 'next/cache'
import { z } from 'zod'
import { API_URL } from '@/lario.config'
import type { Locale } from '@/lib/i18n/config'

/**
 * The one place the website talks to the Laravel API.
 *
 * Every response is `{data, meta: {cache_tags}}`. The server names the tags a
 * response depends on (a page that shows dishes depends on `menu`), and
 * `apiGet` attaches them to the surrounding 'use cache' entry — so an admin
 * edit refreshes exactly the pages that show it, with no tag lists here.
 * Call it only from inside a 'use cache' function.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

const envelope = <T extends z.ZodType>(data: T) =>
  z.object({
    data,
    meta: z.object({ cache_tags: z.array(z.string()) }).partial().optional(),
  })

type Options = {
  locale?: Locale
  /** Preview token from the admin's "Preview on website" link (draft mode only). */
  preview?: string
  query?: Record<string, string | number | undefined>
  /** For build-time lists (generateStaticParams) that run outside any 'use cache' scope. */
  untagged?: boolean
}

function headers(preview?: string): HeadersInit {
  return {
    Accept: 'application/json',
    ...(process.env.LARIO_API_KEY ? { 'X-Lario-Key': process.env.LARIO_API_KEY } : {}),
    ...(preview ? { 'X-Lario-Preview': preview } : {}),
  }
}

export function apiUrl(path: string, { locale, query }: Options = {}): string {
  const url = new URL(`${API_URL}${path}`)
  if (locale) url.searchParams.set('locale', locale)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function request<T extends z.ZodType>(
  path: string,
  schema: T,
  options: Options,
): Promise<z.infer<T> | null> {
  const url = apiUrl(path, options)
  const response = await fetch(url, { headers: headers(options.preview) }).catch((error: Error & { cause?: { code?: string } }) => {
    const code = error.cause?.code ?? error.message
    const hint = code.includes('CERT') || code.includes('VERIFY') || code.includes('SELF_SIGNED')
      ? ' The backend uses a certificate Node does not trust: start with `npm run dev` (sets NODE_EXTRA_CA_CERTS for Herd).'
      : ' Is the backend running, and is backendUrl in lario.config.ts right?'
    throw new ApiError(`Cannot reach the API at ${url} (${code}).${hint}`, 503)
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new ApiError(`GET ${path} failed: HTTP ${response.status}`, response.status)
  }

  const parsed = envelope(schema).safeParse(await response.json())
  if (!parsed.success) {
    // A shape mismatch is a contract bug: fail loudly in the build log
    // rather than render half a page.
    throw new ApiError(
      `GET ${path} broke the contract: ${z.prettifyError(parsed.error)}`,
      500,
    )
  }

  const body = parsed.data as { data: z.infer<T>; meta?: { cache_tags?: string[] } }
  const tags = body.meta?.cache_tags ?? []
  if (tags.length > 0 && !options.untagged) cacheTag(...tags)

  return body.data
}

/**
 * Slugs for generateStaticParams. Never cached or tagged: it runs at build time,
 * outside a cache scope. Returns [] when the API is unreachable so routes fall
 * back to on-demand rendering instead of failing the build.
 */
export async function apiSlugs(path: string, key = 'slug'): Promise<string[]> {
  try {
    const items = await apiGet(path, z.array(z.record(z.string(), z.unknown())), { untagged: true })
    return items.map((item) => String(item[key]))
  } catch {
    return []
  }
}

/** A resource that must exist (settings, lists). */
export async function apiGet<T extends z.ZodType>(
  path: string,
  schema: T,
  options: Options = {},
): Promise<z.infer<T>> {
  const data = await request(path, schema, options)
  if (data === null) throw new ApiError(`GET ${path}: not found`, 404)
  return data
}

/** A resource addressed by slug: null when it does not exist or is hidden. */
export async function apiFind<T extends z.ZodType>(
  path: string,
  schema: T,
  options: Options = {},
): Promise<z.infer<T> | null> {
  return request(path, schema, options)
}
