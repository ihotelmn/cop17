# Incident Response Playbook

Short, scenario-driven playbooks. Each one lists: **symptom → most likely cause → triage steps → mitigation.**

## 1. Delegates report "Booking confirmed but I didn't pay"

**Symptom:** `bookings.status = "confirmed"` but payment never cleared Golomt.

**Most likely cause:**
- `GOLOMT_MODE` misconfigured in prod (set to `mock` or unset with placeholder creds). Since 2026-04-18, `getMode()` throws in production if so — an older deploy before that change is suspect.
- Payment callback endpoint was called with a valid-looking payload but verification returned success spuriously.

**Triage:**
1. Pull the booking row: `SELECT * FROM bookings WHERE id = '…';`
2. Look for matching `payment_attempts` row: `SELECT * FROM payment_attempts WHERE group_id = '…';`
3. Inspect `payment_attempts.raw_callback` — does `signature` match what our app would produce?
4. Check Vercel logs for `"Provider returned"` or `"Signature verification"` entries.

**Mitigation:**
- Hot-patch: set `GOLOMT_MODE=live` with real creds, redeploy.
- Revert any "confirmed-but-unpaid" bookings to `pending` in a transaction, notify guests.
- File bug referencing `src/lib/golomt.ts` and `src/app/api/payments/golomt/callback/route.ts`.

## 2. Delegates cannot log in / sign up

**Symptom:** 500 on login, or sign-up flow silently hangs.

**Most likely cause:**
- Supabase auth is down → check `status.supabase.com`.
- `SUPABASE_SERVICE_ROLE_KEY` rotated but Vercel env not updated.
- Resend API key expired → verification emails fail silently.

**Triage:**
1. `curl -I https://ybwylibmckofuvktvihs.supabase.co/auth/v1/health` — expect 200.
2. Check Resend dashboard for bounce/error logs.
3. Inspect rate limit: `SELECT * FROM action_rate_limits WHERE scope = 'auth:signup:network:v2' ORDER BY updated_at DESC LIMIT 10;` — look for unexpectedly high hit counts (suggests abuse).

**Mitigation:**
- Rotate keys via Vercel env + redeploy.
- Manually verify email of stuck delegates via Supabase dashboard → Auth → Users → Confirm email.

## 3. Homepage 500s / "thundering herd"

**Symptom:** homepage times out during high traffic (press release, keynote).

**Most likely cause:**
- Supabase connection pool saturated.
- Missing index on a new filter column (re-check recent migrations).

**Triage:**
1. Supabase dashboard → Database → Connection pooler → look for saturation warnings.
2. Check slow queries: Supabase → Database → Query Performance.
3. Look for new unindexed filters in `getPublishedHotels` or `getHomepageStats`.

**Mitigation:**
- Short term: increase `max` connections on Supabase (it's soft-capped by plan tier).
- Long term: ensure `revalidate = 60` is set on `src/app/page.tsx` so CDN absorbs traffic.
- Add missing indexes via a new migration in `supabase/migrations/`.

## 4. Guest cannot access their booking portal

**Symptom:** link emailed to guest (`/my-bookings/:id/portal?access=...`) returns 404 or "Invalid access".

**Most likely cause:**
- `BOOKING_ACCESS_TOKEN_SECRET` rotated but already-issued tokens were signed with the old secret.
- Guest email on booking doesn't match the email in the link params.

**Triage:**
1. Decode the booking id, confirm it exists: `SELECT id, guest_email, status FROM bookings WHERE id = '…';`
2. Verify the token in `src/lib/guest-booking-access.ts` against the stored email.

**Mitigation:**
- If secret was rotated recently, reissue the portal link to the guest: run an admin action that builds the link with `buildGuestBookingPortalPath` and email it.
- Document which secret rotation invalidates guest tokens in the deployment log.

## 5. Hotel details page shows stale prices

**Symptom:** Admin updates a room price, but delegates still see the old price for minutes.

**Most likely cause:**
- ISR cache (`revalidate = 300` on `/hotels/[id]`).
- CDN edge cache on top of ISR.

**Mitigation:**
- Admin edit flow calls `revalidatePath("/hotels")` — confirm it's present in `src/app/actions/admin.ts`.
- For urgent updates, trigger `updateTag("hotels")` — already present in most hotel mutations.
- If needed, Vercel dashboard → Deployments → Redeploy forces a full rebuild.

## 6. "Rate limited" messages for legitimate users

**Symptom:** delegates see "Too many attempts" on a legitimate flow (often sign-up).

**Triage:**
```sql
SELECT scope, hit_count, window_started_at, last_seen_at
FROM action_rate_limits
WHERE key_hash = encode(digest('<their-email-lower>', 'sha256'), 'hex')
ORDER BY updated_at DESC;
```

**Mitigation:**
- Reset the row: `DELETE FROM action_rate_limits WHERE key_hash = '…';`
- If the legitimate threshold is too low, adjust `maxHits` in the action code and redeploy.

## 7. Payment callback is spamming

**Symptom:** alert fires on `golomt-callback` rate limit (30/min per IP).

**Most likely cause:**
- A bug in Golomt's retry logic.
- Malicious probing.

**Triage:**
1. Check `action_rate_limits WHERE scope = 'golomt-callback'` for the offending IP (hash — you need the raw IP from Vercel logs to match).
2. Inspect the last few `payment_attempts` rows for that `transactionId`.

**Mitigation:**
- If Golomt bug: coordinate with Golomt integration contact. Raise the per-IP limit temporarily if needed.
- If malicious: block at Vercel firewall (Pro plan) or via `middleware.ts` IP allowlist.

## On-call contacts

Fill in before launch:

- **Platform / devops:** TBD
- **Golomt integration:** TBD (Golomt Bank payment team contact)
- **Supabase support:** dashboard → Support
- **Resend support:** [support@resend.com](mailto:support@resend.com)
