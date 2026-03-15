import { describe, expect, it } from "vitest";
import {
    hasActiveBookingSearchState,
    normalizeBookingSearchState,
    readPartialBookingSearchState,
} from "./booking-search";

describe("booking search state helpers", () => {
    it("does not treat an empty booking state as an active search", () => {
        const defaultState = normalizeBookingSearchState({});

        expect(defaultState.from).toBe("2026-08-17");
        expect(defaultState.to).toBe("2026-08-28");
        expect(hasActiveBookingSearchState({})).toBe(false);
        expect(hasActiveBookingSearchState({
            from: "2026-08-17",
            to: "2026-08-28",
        })).toBe(true);
    });

    it("treats explicit query and changed guest counts as active search state", () => {
        expect(hasActiveBookingSearchState({ query: "Blue Sky Hotel" })).toBe(true);
        expect(hasActiveBookingSearchState({ adults: 3 })).toBe(true);
        expect(hasActiveBookingSearchState({ children: 1 })).toBe(true);
    });

    it("reads only explicitly provided query params", () => {
        const params = new URLSearchParams("from=2026-08-17&to=2026-08-28&adults=2&rooms=1");
        const partial = readPartialBookingSearchState(params);

        expect(partial).toEqual({
            from: "2026-08-17",
            to: "2026-08-28",
            adults: 2,
            rooms: 1,
        });
        expect(hasActiveBookingSearchState(partial)).toBe(true);
    });

    it("normalizes reversed date ranges", () => {
        const normalized = normalizeBookingSearchState({
            from: "2026-08-31",
            to: "2026-08-28",
        });

        expect(normalized.from).toBe("2026-08-28");
        expect(normalized.to).toBe("2026-08-31");

        const partial = readPartialBookingSearchState(
            new URLSearchParams("from=2026-08-31&to=2026-08-28")
        );

        expect(partial).toEqual({
            from: "2026-08-28",
            to: "2026-08-31",
        });
    });
});
