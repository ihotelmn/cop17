import { afterEach, describe, expect, it } from "vitest";
import {
    DEFAULT_APP_URL,
    getCanonicalUrl,
    getPublicAppUrl,
    getPublicSupportEmail,
    getTransactionalFromEmail,
    isLegacyAppHost,
} from "./site-config";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalSupportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
const originalFromEmail = process.env.EMAIL_FROM;

afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = originalSupportEmail;
    process.env.EMAIL_FROM = originalFromEmail;
});

describe("site config helpers", () => {
    it("defaults to the new guest-facing domain", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;

        expect(getPublicAppUrl()).toBe(DEFAULT_APP_URL);
        expect(getCanonicalUrl().toString()).toBe(`${DEFAULT_APP_URL}/`);
    });

    it("normalizes legacy URLs onto the new canonical host", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;

        expect(
            getCanonicalUrl("https://cop17.ihotel.mn/auth/callback?next=%2Fadmin").toString()
        ).toBe("https://hotel.unccdcop17.org/auth/callback?next=%2Fadmin");
        expect(isLegacyAppHost("cop17.ihotel.mn")).toBe(true);
    });

    it("uses explicit support and sender values when provided", () => {
        process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "delegates@unccdcop17.org";
        process.env.EMAIL_FROM = "COP17 Mongolia <bookings@unccdcop17.org>";

        expect(getPublicSupportEmail()).toBe("delegates@unccdcop17.org");
        expect(getTransactionalFromEmail()).toBe("COP17 Mongolia <bookings@unccdcop17.org>");
    });
});
