import "server-only";

import crypto from "crypto";

function getGuestBookingAccessSecret() {
    const secret = process.env.BOOKING_ACCESS_TOKEN_SECRET;

    if (!secret) {
        // In production, instrumentation.ts enforces this at boot. Dev/test should
        // set BOOKING_ACCESS_TOKEN_SECRET explicitly too — falling back to
        // ENCRYPTION_KEY coupled guest-token forgery to PII-decryption compromise.
        if (process.env.NODE_ENV === "production") {
            throw new Error("BOOKING_ACCESS_TOKEN_SECRET is required in production.");
        }
        // Non-prod fallback kept so local dev continues to work without extra setup,
        // but explicitly NOT the encryption key.
        const fallback = process.env.BOOKING_ACCESS_TOKEN_SECRET_DEV || "dev-only-booking-access-secret";
        return fallback;
    }

    return secret;
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
