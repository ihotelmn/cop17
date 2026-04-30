import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function freshModule() {
    vi.resetModules();
    return await import("./guest-booking-access");
}

describe("guest-booking-access — HMAC tokens", () => {
    beforeEach(() => {
        process.env.BOOKING_ACCESS_TOKEN_SECRET = "test-booking-secret-1234567890";
        (process.env as Record<string, string>).NODE_ENV = "test";
    });

    afterEach(() => {
        for (const k of Object.keys(process.env)) {
            if (k.startsWith("BOOKING_") || k === "NODE_ENV") delete process.env[k];
        }
        Object.assign(process.env, ORIGINAL_ENV);
        vi.resetModules();
    });

    it("creates a deterministic token for (bookingId, email)", async () => {
        const { createGuestBookingAccessToken } = await freshModule();
        const t1 = createGuestBookingAccessToken("bid", "alice@example.com");
        const t2 = createGuestBookingAccessToken("bid", "alice@example.com");
        expect(t1).toBe(t2);
        expect(typeof t1).toBe("string");
        expect(t1.length).toBeGreaterThan(20);
    });

    it("verifies a valid token", async () => {
        const { createGuestBookingAccessToken, verifyGuestBookingAccessToken } = await freshModule();
        const tok = createGuestBookingAccessToken("bid-1", "alice@example.com");
        expect(verifyGuestBookingAccessToken("bid-1", "alice@example.com", tok)).toBe(true);
    });

    it("is case-insensitive on email", async () => {
        const { createGuestBookingAccessToken, verifyGuestBookingAccessToken } = await freshModule();
        const tok = createGuestBookingAccessToken("bid-2", "Alice@Example.com");
        expect(verifyGuestBookingAccessToken("bid-2", "alice@example.com", tok)).toBe(true);
    });

    it("rejects a token for a different bookingId", async () => {
        const { createGuestBookingAccessToken, verifyGuestBookingAccessToken } = await freshModule();
        const tok = createGuestBookingAccessToken("bid-A", "a@x");
        expect(verifyGuestBookingAccessToken("bid-B", "a@x", tok)).toBe(false);
    });

    it("rejects a token for a different email", async () => {
        const { createGuestBookingAccessToken, verifyGuestBookingAccessToken } = await freshModule();
        const tok = createGuestBookingAccessToken("bid", "a@x");
        expect(verifyGuestBookingAccessToken("bid", "b@x", tok)).toBe(false);
    });

    it("rejects an empty or missing token without throwing", async () => {
        const { verifyGuestBookingAccessToken } = await freshModule();
        expect(verifyGuestBookingAccessToken("bid", "a@x", "")).toBe(false);
        expect(verifyGuestBookingAccessToken("bid", "a@x", "xxx")).toBe(false);
    });

    it("token for same inputs differs when the secret changes (prevents forged rotation)", async () => {
        const mod1 = await freshModule();
        const t1 = mod1.createGuestBookingAccessToken("bid", "a@x");

        process.env.BOOKING_ACCESS_TOKEN_SECRET = "a-completely-different-secret";
        const mod2 = await freshModule();
        const t2 = mod2.createGuestBookingAccessToken("bid", "a@x");

        expect(t1).not.toBe(t2);
    });

    it("buildGuestBookingPortalPath returns /my-bookings/:id/portal?access=<token>", async () => {
        const { buildGuestBookingPortalPath } = await freshModule();
        const path = buildGuestBookingPortalPath("bid-123", "a@x");
        expect(path).toMatch(/^\/my-bookings\/bid-123\/portal\?access=/);
    });

    it("buildGuestBookingReceiptPath returns /booking/receipt/:id?access=<token>", async () => {
        const { buildGuestBookingReceiptPath } = await freshModule();
        const path = buildGuestBookingReceiptPath("bid-456", "a@x");
        expect(path).toMatch(/^\/booking\/receipt\/bid-456\?access=/);
    });
});

describe("guest-booking-access — fallback ordering", () => {
    beforeEach(() => {
        delete process.env.BOOKING_ACCESS_TOKEN_SECRET;
        process.env.ENCRYPTION_KEY = "fallback-encryption-key-value";
        (process.env as Record<string, string>).NODE_ENV = "test";
    });

    afterEach(() => {
        for (const k of Object.keys(process.env)) {
            if (k.startsWith("BOOKING_") || k === "ENCRYPTION_KEY" || k === "NODE_ENV") delete process.env[k];
        }
        Object.assign(process.env, ORIGINAL_ENV);
        vi.resetModules();
    });

    it("falls back to ENCRYPTION_KEY when BOOKING_ACCESS_TOKEN_SECRET is missing", async () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { createGuestBookingAccessToken } = await freshModule();
        const token = createGuestBookingAccessToken("b", "a@x");
        expect(token.length).toBeGreaterThan(0);
        // The first call should log a warning suggesting the operator set a dedicated secret.
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    it("prefers BOOKING_ACCESS_TOKEN_SECRET when both are set", async () => {
        process.env.BOOKING_ACCESS_TOKEN_SECRET = "dedicated-secret";
        const { createGuestBookingAccessToken: mk } = await freshModule();
        const tDedicated = mk("b", "a@x");

        delete process.env.BOOKING_ACCESS_TOKEN_SECRET;
        const { createGuestBookingAccessToken: mk2 } = await freshModule();
        const tFromEncryption = mk2("b", "a@x");

        expect(tDedicated).not.toBe(tFromEncryption);
    });
});
