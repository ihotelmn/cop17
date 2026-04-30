# COP17 Mongolia — hotel booking platform

Official delegate accommodation platform for UNCCD COP17 in Ulaanbaatar.
Production: **https://hotel.unccdcop17.org**.

Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Postgres + Auth +
Storage + Realtime) · Tailwind v4 · Golomt Bank payments · Resend email ·
Google Maps + Leaflet.

## Quick start

```bash
cp .env.local.example .env.local   # then fill in values — see docs/DEPLOYMENT.md
npm install
npm run dev                         # http://localhost:3000
```

Required env vars are documented in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).
The app validates them on boot via `src/instrumentation.ts` and will refuse
to start if any production-required var is missing or left as a placeholder.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run test:unit` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run lint:strict` | Strict lint on payment/auth/security-critical files (zero warnings allowed) |
| `npm run lint:ci` | Broader lint over `src/` (warnings allowed, errors fail) |
| `npm run verify` | `lint:strict` → `lint:ci` → `test:unit` → `test:e2e` → `build:ci` |

## Repository layout

```
src/
  app/           Next.js routes (public + /admin + /api)
  components/    UI; components/ui/ hosts shadcn primitives
  lib/           Domain logic — booking-search, golomt, payment-attempts, auth, encryption
  instrumentation.ts  Boots env validation
supabase/migrations/   Authoritative schema
scripts/               Maintenance / backfill / audit tooling
docs/                  Deployment, incidents, observability, audit report
tests/                 Playwright e2e
```

## Production readiness

Before any launch, read:
- [`docs/PRODUCTION_AUDIT_2026-04-18.md`](./docs/PRODUCTION_AUDIT_2026-04-18.md) — the full audit that drove 2026-04-18's hardening pass.
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — env vars, cutover checklist.
- [`docs/INCIDENTS.md`](./docs/INCIDENTS.md) — on-call playbooks.
- [`docs/OBSERVABILITY.md`](./docs/OBSERVABILITY.md) — logging, Sentry, load testing.

## Payments

Golomt Bank hosted checkout. Mock mode (`GOLOMT_MODE=mock`) is available only
outside production — in production `getMode()` throws if creds are missing or
set to placeholders. See [`src/lib/golomt.ts`](./src/lib/golomt.ts) and the
callback handler at
[`src/app/api/payments/golomt/callback/route.ts`](./src/app/api/payments/golomt/callback/route.ts).

## Security notes

- All server actions that mutate hotels/rooms verify admin role at the app layer
  (`isAdminRole`) in addition to RLS.
- Guest booking portal links are HMAC-signed with `BOOKING_ACCESS_TOKEN_SECRET`
  (separate from `ENCRYPTION_KEY`; no fallback in production).
- Row Level Security is enabled on every table; see
  [`supabase/migrations/`](./supabase/migrations/).
- PII fields (guest passport, phone) are AES-GCM encrypted via
  [`src/lib/encryption.ts`](./src/lib/encryption.ts).
