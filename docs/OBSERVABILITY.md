# Observability

_Current state: Vercel Analytics only (page views)._

## What's missing

- **No error tracking.** Unhandled exceptions and promise rejections surface as Vercel log lines, with no deduplication, no release tagging, and no alerting.
- **131 `console.*` calls** across `src/` — structured log aggregation would help.
- **No uptime / healthcheck** — no pager when the site 500s on every request.

## Recommended — wire Sentry

[Sentry](https://sentry.io) is the lowest-friction option for Next.js 16.

### Install

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

The wizard will:
- Create `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Modify `next.config.ts` to wrap the export with `withSentryConfig`
- Add upload source-map step

### Required env (set in Vercel)

- `SENTRY_DSN` — from Sentry project settings
- `SENTRY_AUTH_TOKEN` — needed for source-map upload at build
- `NEXT_PUBLIC_SENTRY_DSN` — mirror of DSN, used by client bundle

### Wire into hot paths

1. **`src/app/error.tsx`** — already catches errors. Add `Sentry.captureException(error)` at the top.
2. **`src/app/api/payments/golomt/callback/route.ts`** — wrap the entire `handleCallback` body in `try/catch` and call `Sentry.captureException` for any failure. Payment failures must be alertable.
3. **Each server action** — prefer a shared wrapper:
   ```ts
   // src/lib/with-sentry.ts
   export function withSentry<T extends (...a: any[]) => any>(name: string, fn: T): T {
       return (async (...args: any[]) => {
           try { return await fn(...args); }
           catch (e) {
               Sentry.captureException(e, { tags: { action: name } });
               throw e;
           }
       }) as T;
   }
   ```

### Alerts to configure

- **Payment callback errors** (tag: `action = golomt-callback`) → page the on-call via Slack/email on a single occurrence.
- **Error rate > 1%** for 5 minutes → Slack.
- **New issue in production** → Slack (no paging).

## Interim logging discipline

Until Sentry lands, adopt this:

- `console.error` for truly unexpected errors (stack trace, request id where available)
- `console.warn` for recoverable conditions
- Do NOT use `console.log` in production code paths
- Never log secrets, encryption keys, booking tokens, `access` query params
- Redact emails and phone numbers if you must log them

## Uptime monitoring

Recommend [Better Stack](https://betterstack.com) or [UptimeRobot] free tier:
- Check `GET /` every 60s
- Check `GET /api/health` — **not yet implemented**, worth adding: returns 200 + `{"db":true,"golomt":"live"}` after hitting the DB and Golomt status endpoint.

## Load test before launch

`scripts/stress-test.js` exists. Run against staging:

```bash
node scripts/stress-test.js --base-url https://staging.hotel.unccdcop17.org --vu 200 --duration 120s
```

Watch for:
- p95 latency on `/` (homepage) — target < 500ms
- p95 on `/hotels/:id` — target < 400ms (ISR cached after first hit)
- Supabase connection-pool saturation in the Supabase dashboard
- Log errors proportion (< 0.1%)
