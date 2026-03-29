# Domain Cutover Checklist

Canonical guest domain: `https://hotel.unccdcop17.org`

## App runtime

- Set `NEXT_PUBLIC_APP_URL=https://hotel.unccdcop17.org`
- Set `NEXT_PUBLIC_SUPPORT_EMAIL` to the mailbox guests should see on the site, such as `info@ihotel.mn`
- Set `EMAIL_FROM` to the verified sender that Resend is allowed to use
- If the new domain is not verified in Resend yet, keep the existing verified sender until DNS changes are available

## DNS and hosting

- Keep SSL active for `hotel.unccdcop17.org`
- Redirect the old guest-facing domain to the new canonical domain at the edge/load balancer if available
- Confirm the deployed environment variables match the new domain values

## Supabase Auth

- In Supabase Auth settings, set the site URL to `https://hotel.unccdcop17.org`
- Add `https://hotel.unccdcop17.org/auth/callback` to the redirect URL allowlist
- Keep the previous callback URL temporarily during cutover if users may still click older email links

## Google OAuth and Maps

- Add `https://hotel.unccdcop17.org` to the Google OAuth authorized JavaScript origins if Google sign-in is enabled
- Add `https://hotel.unccdcop17.org/auth/callback` to the OAuth redirect URIs if your provider requires it
- Update Google Maps API HTTP referrer restrictions to allow `https://hotel.unccdcop17.org/*`

## Payments and email

- Update Golomt to call back to `https://hotel.unccdcop17.org/api/payments/golomt/callback`
- Verify the sender domain in Resend for the `EMAIL_FROM` address
- Send one real booking confirmation after deploy to verify links and sender identity
