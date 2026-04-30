import { describe, it, expect } from "vitest";
import {
    normalizeBookingLifecycleStatus,
    getAllowedBookingStatusTransitions,
    isValidBookingStatusTransition,
} from "./booking-status";

describe("normalizeBookingLifecycleStatus", () => {
    it("lowercases and trims", () => {
        expect(normalizeBookingLifecycleStatus("  CONFIRMED  ")).toBe("confirmed");
        expect(normalizeBookingLifecycleStatus("Cancelled")).toBe("cancelled");
    });
});

describe("getAllowedBookingStatusTransitions", () => {
    it("allows pending → confirmed or cancelled", () => {
        const allowed = getAllowedBookingStatusTransitions("pending");
        expect(allowed).toContain("confirmed");
        expect(allowed).toContain("cancelled");
    });

    it("allows confirmed → checked-in or cancelled", () => {
        expect(getAllowedBookingStatusTransitions("confirmed")).toEqual(
            expect.arrayContaining(["checked-in", "cancelled"])
        );
    });

    it("treats completed and cancelled as terminal", () => {
        expect(getAllowedBookingStatusTransitions("completed")).toEqual([]);
        expect(getAllowedBookingStatusTransitions("cancelled")).toEqual([]);
    });

    it("returns [] for unknown status", () => {
        expect(getAllowedBookingStatusTransitions("banana")).toEqual([]);
    });
});

describe("isValidBookingStatusTransition", () => {
    it("accepts valid transitions", () => {
        expect(isValidBookingStatusTransition("pending", "confirmed")).toBe(true);
        expect(isValidBookingStatusTransition("confirmed", "checked-in")).toBe(true);
        expect(isValidBookingStatusTransition("checked-in", "completed")).toBe(true);
    });

    it("rejects forward skips", () => {
        expect(isValidBookingStatusTransition("pending", "completed")).toBe(false);
        expect(isValidBookingStatusTransition("pending", "checked-in")).toBe(false);
    });

    it("rejects transitions out of terminal states", () => {
        expect(isValidBookingStatusTransition("cancelled", "confirmed")).toBe(false);
        expect(isValidBookingStatusTransition("completed", "cancelled")).toBe(false);
    });

    it("handles case + whitespace in inputs", () => {
        expect(isValidBookingStatusTransition("PENDING", "Confirmed")).toBe(true);
        expect(isValidBookingStatusTransition("  pending  ", "  confirmed  ")).toBe(true);
    });
});
