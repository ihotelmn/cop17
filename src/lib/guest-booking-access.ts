import "server-only";

import crypto from "crypto";

function getGuestBookingAccessSecret() {
    const secret = process.env.BOOKING_ACCESS_TOKEN_SECRET || process.env.ENCRYPTION_KEY;

    if (!secret) {
        throw new Error("Guest booking access secret is not configured.");
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
