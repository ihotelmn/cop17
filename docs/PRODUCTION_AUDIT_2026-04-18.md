# COP17 Mongolia — Production Readiness Audit

**Date:** 2026-04-18
**Scope:** `cop17-platform/` (Next.js 16 + Supabase + Golomt Bank)
**Target:** `https://hotel.unccdcop17.org`

## Automated checks — state on 2026-04-18

| Check | Result | Notes |
|---|---|---|
| `npx tsc --noEmit` | ✅ Clean | No TypeScript errors |
| `npm run test:unit` | ✅ 20/20 pass | vitest; only covers `booking-search`, `cancellation-policy`, `encryption`, `site-config` |
| `npm run lint:ci` | ⚠️ 1 error, 1 warning | `booking.ts:1288` uses `any`; `auth.ts:121` unused var. Note: `lint:ci` only lints 14 files of ~183. |
| `npm run test:e2e` | Not run in audit | Playwright only covers homepage & login pages (`tests/booking-flow.spec.ts` — 21 lines) |
| CI workflow | `.github/workflows/ci.yml` | Runs `npm run verify` on push/PR to main, master, codex/** |

---

## Executive summary

The platform has **solid fundamentals** (parameterized queries, RLS, HMAC with `timingSafeEqual`, good schema migrations) but **5 issues would block production launch** for a payment-handling delegate booking system.

**Blocking for production:**
1. Hardcoded payment signature fallback secret — `src/lib/golomt.ts:94`
2. Mock-payment endpoint exposes free-booking path in any non-live environment
3. Payment callback idempotency path skips signature re-verification
4. Rooms N+1 and missing `hotels.is_published` index — homepage will not scale to 200+ concurrent delegates
5. CI lints only 14 of ~183 source files — most admin + action code is unlinted

**Recommended minimum before launch:**
- Section "BLOCKERS" (5 items), all of Section "HIGH" (14 items)
- Smoke-test the full payment flow with real Golomt creds on staging
- Load-test the homepage + search with `scripts/stress-test.js`

---

# BLOCKERS — fix before going live

## B1. Hardcoded fallback secret for Golomt HMAC [CRITICAL]
**File:** `src/lib/golomt.ts:94`, `src/lib/golomt.ts:59`

`CALLBACK_SECRET || "cop17-fallback-payment-secret"` — if the env var is unset the code uses a hardcoded string that is in the repo. Anyone with repo access can forge valid payment-confirmation signatures.

**Fix:**
```ts
if (!CALLBACK_SECRET) throw new Error("GOLOMT_CALLBACK_SECRET is required");
```
Do the same check at startup in `instrumentation.ts` so a misconfigured deploy fails fast instead of silently falling back.

## B2. `/mock-payment` is reachable in production [CRITICAL]
**Files:** `src/app/mock-payment/page.tsx`, `src/lib/golomt.ts:65-72`, `src/lib/golomt.ts:210-225`

`getMode()` auto-detects mock mode when `GOLOMT_MERCHANT_ID` is a placeholder (`YOUR_…`). In mock mode the server builds a *pre-signed* callback URL and redirects the user to `/mock-payment`; clicking "Pay" navigates the browser to the signed callback, which then confirms the booking with no real payment.

If prod env vars are ever misconfigured (e.g. accidentally kept `YOUR_MERCHANT_ID` from `.env.local`), every booking becomes free.

**Fix (pick one):**
- Compile-out the mock branch in production: wrap it in `if (process.env.NODE_ENV !== "production")` and throw from `getMode()` if the detected mode is `"mock"` in prod.
- Or: hard-require `GOLOMT_MODE === "live"` + valid creds on boot in `instrumentation.ts`; refuse to serve otherwise.
- Additionally gate `/mock-payment` behind `NODE_ENV !== "production"` in a dedicated `src/app/mock-payment/layout.tsx`.

## B3. Payment callback "already paid" path skips signature verification [HIGH]
**File:** `src/app/api/payments/golomt/callback/route.ts:83-103`

```ts
if (paymentAttempt?.status === "paid") {
  const confirmed = await confirmBookingAction(paymentAttempt.group_id || groupId, true);
  // returns success — NO signature re-check
}
```
The guard intent is idempotency, but the side effect is that anyone who knows a paid `transactionId` can re-invoke the confirm path. Impact is bounded (`group_id` comes from the stored attempt, not from the URL), so it cannot re-point to a different booking — but the principle is wrong and a future refactor could widen the hole.

**Fix:** Always call `verifyCallbackSignature` before doing anything with `confirmBookingAction`. If the signature is absent for an "already paid" replay, return 200 with `alreadyProcessed:true` *without* touching the booking.

## B4. Missing `hotels.is_published` index + homepage has zero cache [CRITICAL for traffic]
**Files:** `src/app/page.tsx:22-23` (`dynamic=force-dynamic; revalidate=0`), migrations (no index on `is_published`)

Every homepage hit runs `getPublishedHotels`, `getHomepageStats`, and a booking-overlap fan-out per room — with no ISR cache and no covering index on `hotels.is_published`. A conference keynote link drop will produce a thundering-herd at a fully-dynamic route.

**Fix:**
1. New migration `add_hotels_is_published_index.sql`:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_hotels_published_created
     ON hotels(is_published, created_at DESC);
   ```
2. `src/app/page.tsx`: change to `export const revalidate = 60;`, drop `dynamic = "force-dynamic"`. Move live availability into a child Server Component wrapped in `<Suspense>` so the hero + hotel list stream from cache while availability resolves per-request.
3. Mirror on `/hotels/[id]/page.tsx` (add `revalidate = 300`).

## B5. CI lints only 14 files [HIGH, fast to fix]
**File:** `package.json:11`

`lint:ci` runs eslint against a hand-picked allowlist. The rest of `src/**` (admin.ts, booking-admin.ts, bulk-admin.ts, group-actions.ts, hotel-import.ts, inventory-admin.ts, liaison-actions.ts, public.ts, super-admin.ts, every page, every component) is not linted in CI. Developers merge unlinted code daily.

**Fix:** `"lint:ci": "eslint src scripts --max-warnings=0 --ignore-pattern 'scripts/data/**' --ignore-pattern 'scripts/out/**'"`. Run locally first — expect to fix a backlog of warnings before flipping it on.

---

# HIGH severity — fix this week

## H1. No signature in audit-log PII encryption
**File:** `supabase/migrations/20260214_create_audit_logs.sql`, `src/app/admin/audit-logs/page.tsx:59-73`

`audit_logs.old_data` / `new_data` are stored as JSONB and can contain guest passport + phone. UI redacts client-side, but DB dump = plaintext PII.

**Fix:** Encrypt sensitive sub-fields before insert (reuse `src/lib/encryption.ts`). Better: don't log the *values* of protected fields — only the fact that they changed.

## H2. Guest booking access token falls back to `ENCRYPTION_KEY`
**File:** `src/lib/guest-booking-access.ts:5-12`

If `BOOKING_ACCESS_TOKEN_SECRET` is unset the code uses `ENCRYPTION_KEY`. One compromised secret → both token forgery *and* PII decryption.

**Fix:** `if (!process.env.BOOKING_ACCESS_TOKEN_SECRET) throw …`; remove fallback.

## H3. `updateHotelPublishedStatus` and peers don't verify admin role
**File:** `src/app/actions/admin.ts:361-398` (and grep for `.from("hotels").update` across `admin.ts`, `booking-admin.ts`, `inventory-admin.ts`)

Functions check `auth.getUser()` but not role — relying on RLS as the only gate. Defense-in-depth requires the app layer to refuse non-admins early.

**Fix:** Introduce `await requireRole(["admin", "super_admin"])` at the top of every admin action. Same treatment for super-admin actions (`src/app/actions/super-admin.ts`).

## H4. Payment verification + booking confirmation not atomic
**File:** `src/app/api/payments/golomt/callback/route.ts:128-141`

Steps run sequentially: verify → mark paid → confirm. If step 3 fails after step 2, DB says "paid" but booking isn't confirmed. On retry the B3 path triggers.

**Fix:** Wrap steps 2 and 3 in a Postgres function (`pg.query('BEGIN')` … `COMMIT`) via `src/lib/postgres.ts`. Or make `confirmBookingAction` transactional with the payment-attempt update in a single SQL statement using `FOR UPDATE`.

## H5. Rate-limit coverage gaps
**File:** `src/lib/action-rate-limit.ts` + all action files

Currently rate-limited: booking creation, password reset (partial). **Not** rate-limited: `requestPasswordResetAction`, the Golomt callback route, group-request form, autocomplete search. Attacker can spam password-reset emails (sender = unccdcop17.org, harming deliverability reputation) or flood the callback.

**Fix:** Wrap each of these with `withRateLimit(…)`. Set callback limit at 10/min per IP via `NextRequest.headers.get("x-forwarded-for")`.

## H6. No server-side upload size/type enforcement
**File:** `src/components/admin/image-upload.tsx`, `scripts/update-bucket.ts:16`

Client compresses to 2MB, bucket allows 10MB, mime allowlist is `image/*` (includes TIFF/BMP). Attacker curls 10MB TIFFs directly to storage.

**Fix:** Supabase Storage bucket policies — tighten `file_size_limit` to 3MB, `allowed_mime_types` to `['image/jpeg','image/png','image/webp']`. Re-run `scripts/update-bucket.ts` with new values.

## H7. Golomt payment code has zero tests
**File:** `src/lib/golomt.ts`, `src/lib/payment-attempts.ts`

300+ lines of signature/HMAC/checksum logic, critical business logic — no unit tests. Given B1–B4 live here, this is the highest-leverage place to add tests.

**Fix:** Create `src/lib/golomt.test.ts`:
- `verifyCallbackSignature` accepts valid, rejects tampered amount/status/transactionId
- `buildChecksum` stable across runs
- `extractCallbackPayload` handles the raw-text path
- mock-mode callback URL is *self-signed* (this is the attack surface in B2)

## H8. E2E test is a smoke test only
**File:** `tests/booking-flow.spec.ts` (21 lines)

Tests only that homepage and login pages render. The full journey (search → room select → checkout → payment → confirmation email) is uncovered.

**Fix:** Add `tests/booking-flow-full.spec.ts` that drives the whole flow against a seeded test DB. Include a negative path: payment callback with bad signature → booking not confirmed.

## H9. `getPublicHotel()` does `select("*")` and nulls sensitive fields client-side
**File:** `src/app/actions/public.ts:289-341`

Over-fetches, then returns. Wastes bandwidth and risks the "forgot to null a new column" bug when future columns get added to `hotels`.

**Fix:** Replace `select("*")` with an explicit column list. Same for `getPublishedHotels` (public.ts:73-116).

## H10. Homepage N+1 on booking-overlap per hotel
**File:** `src/app/actions/public.ts:186-246`

Per-hotel loop calls `bookings.in("room_id", roomIds)`. With 228 hotels and no cache, that's 228 sequential DB round-trips.

**Fix:** Pre-fetch ALL active bookings in one query, then bucket in memory:
```ts
const { data: bookings } = await supabase.from("bookings")
  .select("room_id, check_in_date, check_out_date, status")
  .in("status", ["confirmed","pending","prebook_requested"])
  .gte("check_out_date", today);
```

## H11. `rooms.total_inventory` + `is_active` not covered by composite index
**File:** `20260214_optimize_indexes.sql` + `src/app/actions/public.ts:352-357`

Common filter is `WHERE hotel_id = $1 AND is_active = true`. Single-column `idx_rooms_hotel_id` forces a filter after the index lookup on large hotels.

**Fix:** `CREATE INDEX idx_rooms_hotel_active ON rooms(hotel_id, is_active) WHERE is_active = true;`

## H12. Sitemap doesn't list hotel pages
**File:** `src/app/sitemap.ts`

Only static routes. Google won't crawl individual hotel detail pages — a big SEO miss for the launch.

**Fix:** Fetch `getPublishedHotels()` in sitemap.ts and append `/hotels/${id}` entries with `priority: 0.8`, `changeFrequency: "weekly"`.

## H13. Realtime publishes full `bookings` + `notifications` without user filter
**File:** `supabase/migrations/20260315043000_add_booking_change_tracking_and_realtime.sql:24-44`

Every subscriber receives every booking change. Admin dashboard works; for delegates subscribing to their own notifications this leaks others' booking updates over the wire.

**Fix:** In each `channel(...)` call, add `{ filter: \`user_id=eq.${userId}\` }` or `{ filter: \`hotel_id=eq.${hotelId}\` }`.

## H14. No error-tracking service
**Codebase-wide** (131 `console.*` calls in `src/`)

Errors only surface via Vercel logs. No alerting, no aggregation, no release tracking. During a COP conference an unhandled payment error goes unnoticed for hours.

**Fix:** `npm install @sentry/nextjs && npx @sentry/wizard@latest -i nextjs`. Add DSN to Vercel env. Wire into `src/app/error.tsx`, the Golomt callback route, and all server actions via a shared `withSentry()` wrapper.

---

# MEDIUM severity — fix this month

| # | File | Issue | Fix |
|---|---|---|---|
| M1 | `src/lib/encryption.ts:61-85` | Decrypt failure returns ciphertext silently | Return `null` or throw; force caller to handle |
| M2 | `src/lib/encryption.ts:33-44` | `ENCRYPTION_KEY` format validated lazily | Validate in `instrumentation.ts` |
| M3 | `src/app/actions/admin.ts` | No zod validation on IDs (`getHotel(id)` etc.) | Add `z.string().uuid().parse(id)` guard |
| M4 | `src/app/actions/booking.ts:308` | Price comes from DB (ok) but no `expected !== actual` assertion | Explicit mismatch check |
| M5 | `supabase/migrations/20260214_rls_final_fix.sql` | `SECURITY DEFINER` functions used but not documented | Comment + add negative-path tests |
| M6 | `src/lib/supabase/admin.ts:6` | New admin client per call | Memoize singleton |
| M7 | `src/lib/supabase/server.ts:5-32` | New server client per call | Wrap with React `cache()` |
| M8 | `src/lib/postgres.ts:19-25` | Pool `max: 5` too low for 100+ concurrent | Bump to 20–30, verify Supabase connection cap |
| M9 | `src/components/admin/map-picker.tsx` | 500KB leaflet loaded up-front in admin | `dynamic(() => import(...), { ssr: false })` |
| M10 | `src/components/ui/fallback-image.tsx:30-42` | Plain `<img>` in fallback | Use `next/image` |
| M11 | `src/components/image-gallery.tsx:123-128` | Placeholder plain `<img>` | Use `next/image` |
| M12 | `src/app/actions/booking.ts:1012-1026` | Email send failure silently ignored | Persist result, retry queue |
| M13 | `src/app/api/payments/golomt/callback/route.ts` | Both GET and POST accepted | Restrict to POST; GET only for browser redirect with distinct handler |
| M14 | `src/app/actions/admin.ts:319,354,395,630,937` | 5 × `(revalidateTag as any)` | Upgrade call sites; Next 16 types should cover it |
| M15 | `src/app/actions/booking.ts:1288` | `(booking as any).guest_name` | Type properly; currently breaks `lint:ci` |
| M16 | `src/app/actions/auth.ts:121` | Unused `supabase` variable | Delete; currently breaks `lint:ci` |
| M17 | `src/app/actions/public.ts:45,65,474,553` | `as any` on Supabase selects | Use generated DB types from `src/types/database.ts` |
| M18 | `package.json:47` | `nodemailer` installed but unused (only `resend` used) | `npm remove nodemailer @types/nodemailer` |
| M19 | `src/app/hotels/[id]/opengraph-image.tsx` | OG image DB-fetched per request | Add `revalidate = 3600` |
| M20 | `src/app/admin/*/` | Several admin sub-routes lack `loading.tsx` | Add skeleton loaders |
| M21 | `src/app/robots.ts` | `/mock-payment` disallowed but not auth-gated | See B2 |
| M22 | `temp-db-fix.js` (repo root) | Forgotten one-off script | Delete or move to `scripts/historical/` |
| M23 | `scripts/fix_guest_bookings.js` + `.ts` | Duplicate JS + TS | Delete the `.js`, keep `.ts` |
| M24 | `scripts/debug-*.{ts,js,py}`, `scripts/debug/` | 8+ debug scripts shipped in repo | Quarantine under `scripts/debug/` with a warning README |
| M25 | `scripts/` (49 files, no README) | No docs on which scripts are one-off vs reusable | Add `scripts/README.md` with table |
| M26 | `README.md` | Default Next.js boilerplate | Rewrite with env vars, dev setup, deploy procedure |
| M27 | `docs/` | No runbook / no deployment doc | Add `docs/DEPLOYMENT.md`, `docs/INCIDENTS.md` (payment failure, auth issue flowcharts) |
| M28 | `src/components/admin/dashboard-realtime.tsx:23-58` | `useEffect` deps include `router` (re-subscribes) | Move router out of deps or memoize |
| M29 | i18n | Ad-hoc bilingual (DB columns + helper fns), no translation layer | Track as tech debt; not a launch blocker |
| M30 | `package.json` | All deps use `^` ranges | Pin critical deps (`@supabase/*`, `zod`, `pg`, `resend`) exactly |

---

# LOW severity / nice-to-have

| # | File | Note |
|---|---|---|
| L1 | `src/app/actions/booking.ts:159-170` | `isBookingStatusConstraintError` does string matching; prefer PG error code `23514` |
| L2 | All action files | Return typed `{ success: false, error: string }` shape inconsistently; standardize a `Result<T>` helper |
| L3 | Google Maps API key | Must be domain-restricted + API-restricted in GCP console (client-side by design, but audit the restriction) |
| L4 | `src/app/mock-payment/page.tsx:64` | Amount from query param (cosmetic — server re-validates) |
| L5 | Error messages | Audit for accidental schema leakage; current handling is conservative |
| L6 | Bundle size | Run `npx @next/bundle-analyzer` post-fix to measure impact of M9/M10/M11 |

---

# Verified OK — no action needed

- ✅ `.env.local` is **not** in git history (`git log -p --all -- .env.local` empty)
- ✅ `.env*` is in `.gitignore`
- ✅ `crypto.timingSafeEqual` used for signature comparison (`src/lib/golomt.ts:119`) — not `===`
- ✅ AES-GCM IV generated with `crypto.randomBytes(12)` per message (`src/lib/encryption.ts:48`)
- ✅ RLS enabled on all tables (verified via migrations)
- ✅ Parameterized queries only (no string-concat SQL in `src/**` or `scripts/**`)
- ✅ Admin layout enforces role check server-side (`src/app/admin/layout.tsx:13-44`)
- ✅ Supabase server client uses `persistSession: false, autoRefreshToken: false`
- ✅ `hotel-map-wrapper.tsx` lazy-loads `@react-google-maps/api`
- ✅ `middleware.ts` is minimal and correctly scoped
- ✅ `error.tsx` and `not-found.tsx` both exist at app root
- ✅ `robots.ts` disallows `/admin`, `/auth`, `/mock-payment`, `/my-bookings`
- ✅ Swallowed errors (`catch {}`) — none found in `src/**`
- ✅ Booking overlap index exists (`20260315_add_booking_overlap_index.sql`)
- ✅ 20/20 unit tests pass; booking-search covers date-overlap logic; encryption covers round-trip; cancellation-policy covers edge cases; site-config covers canonical URL

---

# Pre-launch checklist (TL;DR)

## Must do (blockers)
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY`, DB password, `RESEND_API_KEY`, `ENCRYPTION_KEY` before prod cutover (the current `.env.local` values have been seen by the audit process).
- [ ] Set `GOLOMT_MODE=live` + real `GOLOMT_MERCHANT_ID` / `GOLOMT_SECRET_TOKEN` / `GOLOMT_CALLBACK_SECRET` in Vercel env. Verify `getMode() === "live"` on staging.
- [ ] Remove hardcoded fallback secret from `golomt.ts:94`.
- [ ] Gate `/mock-payment` behind `NODE_ENV !== "production"` in its own layout.
- [ ] Move signature verification to run unconditionally in `callback/route.ts`.
- [ ] Add `idx_hotels_published_created` index; set `revalidate = 60` on homepage.
- [ ] Flip `lint:ci` to lint all of `src/`, fix the resulting backlog (starts with M15, M16).
- [ ] Add `instrumentation.ts` that validates all required env vars on boot.

## Should do (HIGH)
- [ ] `requireRole()` guard in every admin action (H3).
- [ ] Rate-limit password reset, callback, group-request, search (H5).
- [ ] Tighten Storage bucket policies (H6).
- [ ] Unit tests for `golomt.ts` + `payment-attempts.ts` (H7).
- [ ] Full booking-flow E2E (H8).
- [ ] Pre-fetch all bookings once in homepage flow (H10).
- [ ] `idx_rooms_hotel_active` partial index (H11).
- [ ] Sitemap includes hotel pages (H12).
- [ ] Realtime subscriptions use user/hotel filters (H13).
- [ ] Sentry wired up (H14).

## Good to have (MEDIUM + infra)
- [ ] Bundle analyzer run, leaflet/framer-motion audit (M9-M11)
- [ ] `scripts/` quarantined; README added
- [ ] `docs/DEPLOYMENT.md`, `docs/INCIDENTS.md`
- [ ] Pin `@supabase/*`, `zod`, `pg`, `resend` exact versions (M30)
- [ ] Load test: `node scripts/stress-test.js` against staging with 200+ VUs against homepage + `/hotels/:id`; confirm p95 <500ms
