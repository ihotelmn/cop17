import "server-only";

import crypto from "crypto";

let warnedAboutFallback = false;

function getGuestBookingAccessSecret() {
    const explicit = process.env.BOOKING_ACCESS_TOKEN_SECRET;
    if (explicit) {
        return explicit;
    }

    // Soft fallback: if the dedicated secret isn't set, reuse ENCRYPTION_KEY so
    // the booking flow keeps working. Log loudly the FIRST time only — repeating
    // the warning per request floods Vercel logs.
    //
    // Tradeoff: a compromise of ENCRYPTION_KEY would now compromise both PII
    // decryption AND guest-portal token forgery. Rotate to a separate
    // BOOKING_ACCESS_TOKEN_SECRET as soon as possible (see docs/DEPLOYMENT.md).
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (encryptionKey) {
        if (!warnedAboutFallback) {
            warnedAboutFallback = true;
            console.warn(
                "[guest-booking-access] BOOKING_ACCESS_TOKEN_SECRET is not set; falling back to ENCRYPTION_KEY. " +
                "This couples two secrets — set BOOKING_ACCESS_TOKEN_SECRET in env soon (openssl rand -hex 32)."
            );
        }
        return encryptionKey;
    }

    // No prod-suitable secret available at all. Use a dev-only fallback so the
    // server doesn't crash; the value is well-known so anyone can forge tokens
    // — only acceptable for local dev where the booking flow is exercised
    // without real guests.
    if (process.env.NODE_ENV === "production") {
        throw new Error(
            "Both BOOKING_ACCESS_TOKEN_SECRET and ENCRYPTION_KEY are missing in production."
        );
    }
    return process.env.BOOKING_ACCESS_TOKEN_SECRET_DEV || "dev-only-booking-access-secret";
}

function buildGuestBookingSignature(bookingId: string, guestEmail: string) {
    return crypto
        .createHmac("sha256", getGuestBookingAccessSecret())
        .update(`guest-booking:${bookingId}:${guestEmail.trim().toLowerCase()}`)
        .digest("base64url");
}

export function createGuestBookingAccessToken(bookingId: string, guestEmail: string) {
    return buildGuestBookingSignature(bookingId, guestEmail);
}

export function verifyGuestBookingAccessToken(bookingId: string, guestEmail: string, token: string) {
    if (!token || !guestEmail) {
        return false;
    }

    try {
        const expected = buildGuestBookingSignature(bookingId, guestEmail);
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    } catch {
        return false;
    }
}

export function buildGuestBookingPortalPath(bookingId: string, guestEmail: string) {
    const token = createGuestBookingAccessToken(bookingId, guestEmail);
    return `/my-bookings/${bookingId}/portal?access=${encodeURIComponent(token)}`;
}

export function buildGuestBookingReceiptPath(bookingId: string, guestEmail: string) {
    const token = createGuestBookingAccessToken(bookingId, guestEmail);
    return `/booking/receipt/${bookingId}?access=${encodeURIComponent(token)}`;
}
