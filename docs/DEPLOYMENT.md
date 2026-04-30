# Deployment

## Stack

- **Hosting:** Vercel (Next.js 16)
- **Database:** Supabase Postgres (project `ybwylibmckofuvktvihs`)
- **Email:** Resend
- **Payments:** Golomt Bank hosted checkout
- **Maps:** Google Maps + Leaflet

## Required env (Vercel production)

| Var | Purpose | Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public client | Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | admin ops | Supabase dashboard (**rotate for prod**) |
| `DATABASE_URL` | direct pg (rarely used — pooler DNS disabled) | Supabase |
| `ENCRYPTION_KEY` | 32-byte hex for guest PII | `openssl rand -hex 32` |
| `BOOKING_ACCESS_TOKEN_SECRET` | HMAC for guest booking portal links | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | canonical site | `https://hotel.unccdcop17.org` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | displayed in UI | `hotel@unccdcop17.org` |
| `EMAIL_FROM` | Resend sender | `COP17 Mongolia <noreply@hotel.unccdcop17.org>` |
| `RESEND_API_KEY` | Resend API | Resend dashboard |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | client-side maps | GCP (must be referer-restricted) |
| `GOLOMT_MODE` | `live` in prod | constant |
| `GOLOMT_MERCHANT_ID` | Golomt merchant id | Golomt account |
| `GOLOMT_SECRET_TOKEN` | Golomt API secret | Golomt account |
| `GOLOMT_CALLBACK_SECRET` | HMAC for callback verification | coordinated with Golomt |
| `GOLOMT_CHECKOUT_URL` | hosted checkout endpoint | Golomt account |
| `GOLOMT_STATUS_URL` | server→server status check | Golomt account |

The app runs `src/instrumentation.ts` on boot and will fail loudly if any required env is missing or still a placeholder (`YOUR_...`).

## Google Maps key restrictions (required)

In Google Cloud Console → Credentials:
1. **Application restrictions:** HTTP referrers → only `*.unccdcop17.org/*`
2. **API restrictions:** only `Maps JavaScript API` + `Distance Matrix API` + `Places API`
3. Set a daily billing budget alert.

## Deploy checklist

### First-time cutover
- [ ] Rotate ALL secrets that have ever been in `.env.local` (they have been seen by the audit and may have been shared).
- [ ] Apply migrations to prod Supabase in chronological order (see `supabase/migrations/`, most recent: `20260418_perf_hot_indexes.sql`).
- [ ] Confirm Golomt live creds are set (ask the Golomt integration contact before go-live).
- [ ] Run `node scripts/stress-test.js` against staging.
- [ ] Verify `/api/payments/golomt/callback` is reachable from Golomt's IPs.
- [ ] Set up Sentry (see `docs/OBSERVABILITY.md`).
- [ ] Wire uptime monitoring.
- [ ] Update DNS: `hotel.unccdcop17.org` → Vercel.

### Every deploy
- [ ] `npm run verify` passes locally.
- [ ] No new migrations uncommitted.
- [ ] `.env.local` untouched.
- [ ] Deploy preview URL renders homepage + one hotel detail page without errors.

## Migrations

Migrations live in `supabase/migrations/` and are named `<timestamp>_<description>.sql`. To apply a new one in prod:

1. Open Supabase Dashboard → SQL Editor.
2. Paste the file contents.
3. Run. Verify zero errors.
4. (Optional) run `scripts/apply-migration.ts` locally pointed at prod DB — this expects the pg direct URL which in our env is DNS-blocked, so dashboard is the primary path.

## Rollback

Vercel supports instant rollback: `Deployments → select previous → Promote to Production`.

For DB rollbacks, each migration should be paired with a reverse migration. Current migrations are mostly additive (new columns, new indexes), so rolling back the app code is usually sufficient.

## Known constraints

- **Pooled Postgres DNS is disabled** from some networks — the app uses the Supabase HTTP client (`@supabase/supabase-js`) everywhere except `scripts/setup-amenities.ts`, which uses `pg` for initial setup. Don't add runtime code that depends on `pg`.
- **`revalidateTag` in Next.js 16 requires 2 args** (`tag`, profile). We use `updateTag(tag)` as a single-arg drop-in.
