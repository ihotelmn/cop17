import { describe, it, expect } from "vitest";
import { COP17_VENUE, calculateDistance, estimateTravelTime } from "./venue";

describe("COP17_VENUE", () => {
    it("has the conference coordinates", () => {
        expect(COP17_VENUE.latitude).toBeCloseTo(47.9, 1);
        expect(COP17_VENUE.longitude).toBeCloseTo(106.96, 1);
        expect(COP17_VENUE.name).toMatch(/National Garden Park/);
    });
});

describe("calculateDistance (Haversine)", () => {
    it("returns 0 for the same point", () => {
        expect(calculateDistance(47.9, 106.9, 47.9, 106.9)).toBe(0);
    });

    it("returns a finite positive number for realistic Ulaanbaatar pair", () => {
        // Sukhbaatar Square ~ 47.9184, 106.9177
        const d = calculateDistance(47.9184, 106.9177, COP17_VENUE.latitude, COP17_VENUE.longitude);
        expect(d).toBeGreaterThan(0);
        expect(d).toBeLessThan(10); // Within 10km in Ulaanbaatar
    });

    it("approximately symmetric", () => {
        const a = calculateDistance(47.9, 106.9, 47.95, 106.95);
        const b = calculateDistance(47.95, 106.95, 47.9, 106.9);
        expect(a).toBe(b);
    });

    it("returns a distance rounded to 1 decimal", () => {
        const d = calculateDistance(0, 0, 0, 1);
        // Should be ~ 111.2 km but rounded to 1dp
        expect(d.toString()).toMatch(/^\d+(\.\d)?$/);
    });
});

describe("estimateTravelTime", () => {
    it("returns walk minutes for mode=walking", () => {
        const text = estimateTravelTime(1, "walking");
        expect(text).toMatch(/\d+ min walk/);
    });

    it("returns drive minutes for mode=driving (default)", () => {
        const text = estimateTravelTime(1);
        expect(text).toMatch(/\d+ min drive/);
    });

    it("caps drive to a minimum of 2 minutes", () => {
        const text = estimateTravelTime(0.1);
        const mins = Number(text.match(/(\d+)/)?.[1]);
        expect(mins).toBeGreaterThanOrEqual(2);
    });
});
