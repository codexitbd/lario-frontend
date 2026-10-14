# La Rio — website

Next.js 16 + TypeScript + Tailwind 4. The public, bilingual (English / Arabic,
RTL) website for La Rio Restaurant. All content comes from the Laravel API in
`../lario-backend`; the client edits it in that admin panel.

## Setup

```bash
cp .env.example .env    # LARIO_BACKEND_URL, LARIO_SITE_URL, LARIO_REVALIDATE_SECRET, LARIO_API_KEY
npm install
npm run dev
```

The backend address can also be set once in `lario.config.ts`.
`LARIO_REVALIDATE_SECRET` and `LARIO_API_KEY` must match the backend's `.env`.
`npm run dev` trusts Laravel Herd's local certificate, for a `*.test` backend.

## Scripts

```bash
npm test            # vitest
npm run lint
npm run typecheck
npm run build       # prerenders every page against the live API
npm start
```

## How it fits together

- Pages read the API through `lib/api/client.ts`, validated by the Zod schemas
  in `lib/schemas/`, cached with `'use cache'` and tagged with the cache tags
  the API names.
- The backend calls `POST /api/revalidate` (HMAC-signed) when content changes;
  the affected pages refresh on the next request.
- Forms post to `app/api/{reservations,contacts,newsletter}`, which forward to
  Laravel.
- `proxy.ts` sets security headers (CSP follows the admin's tracking settings),
  serves English unprefixed and Arabic at `/ar`, and applies the admin's
  redirects.

## Docs

- `../lario-web-CLAUDE.md` — design system, conventions, known gaps
- `PRODUCT.md` — users, purpose, design principles
- `design/` — reference images and notes
- `docs/content-gaps.md` — content the client still owes
- `../lario-docs/` — brief, decisions, schema, API contract, status
