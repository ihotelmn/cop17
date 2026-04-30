import { describe, it, expect } from "vitest";
import {
    getPreferredHotelName,
    getPreferredHotelAddress,
    getPreferredHotelDescription,
} from "./hotel-display";

const base = {
    name: "",
    name_en: null as string | null,
    address: null as string | null,
    address_en: null as string | null,
    description: null as string | null,
    description_en: null as string | null,
    stars: 4,
};

describe("getPreferredHotelName", () => {
    it("prefers name_en when set", () => {
        expect(getPreferredHotelName({ ...base, name: "Шангрила", name_en: "Shangri-La" }))
            .toBe("Shangri-La");
    });

    it("extracts the English side of 'MN | EN' name", () => {
        expect(getPreferredHotelName({ ...base, name: "Шангрила | Shangri-La Ulaanbaatar" }))
            .toBe("Shangri-La Ulaanbaatar");
    });

    it("falls back to raw name when no English found", () => {
        expect(getPreferredHotelName({ ...base, name: "Шангрила" }))
            .toBe("Шангрила");
    });

    it("returns empty string for empty inputs", () => {
        expect(getPreferredHotelName({ ...base })).toBe("");
    });

    it("treats 'null'/'none' as empty", () => {
        expect(getPreferredHotelName({ ...base, name_en: "null", name: "Real Name" }))
            .toBe("Real Name");
    });
});

describe("getPreferredHotelAddress", () => {
    it("prefers address_en", () => {
        expect(getPreferredHotelAddress({ ...base, address: "Улаанбаатар", address_en: "Ulaanbaatar" }))
            .toBe("Ulaanbaatar");
    });

    it("falls back to Ulaanbaatar synth when text mentions UB", () => {
        expect(getPreferredHotelAddress({ ...base, name_en: "Hotel Ulaanbaatar" }))
            .toMatch(/Ulaanbaatar|Mongolia/);
    });
});

describe("getPreferredHotelDescription", () => {
    it("prefers long English description", () => {
        const desc = "<p>This is a wonderful English description of the hotel and its amenities.</p>";
        const out = getPreferredHotelDescription({ ...base, description_en: desc });
        expect(out).toMatch(/wonderful English/);
    });

    it("synthesises a fallback when both descriptions empty", () => {
        const out = getPreferredHotelDescription({
            ...base,
            name: "Sample Hotel",
            address_en: "Ulaanbaatar, Mongolia",
            stars: 4,
        });
        expect(out).toMatch(/Sample Hotel/);
        expect(out).toMatch(/4-star/);
    });
});
