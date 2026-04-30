import { describe, it, expect } from "vitest";
import { parseStringArray } from "./parse-utils";

describe("parseStringArray", () => {
    it("returns empty array for nullish / empty", () => {
        expect(parseStringArray(null)).toEqual([]);
        expect(parseStringArray(undefined)).toEqual([]);
        expect(parseStringArray("")).toEqual([]);
    });

    it("parses JSON array strings", () => {
        expect(parseStringArray('["a","b","c"]')).toEqual(["a", "b", "c"]);
    });

    it("parses comma-separated strings", () => {
        expect(parseStringArray("a, b,c")).toEqual(["a", "b", "c"]);
    });

    it("trims and drops empties in comma path", () => {
        expect(parseStringArray("a,  ,b, , ")).toEqual(["a", "b"]);
    });

    it("falls back to comma-split when JSON is not an array", () => {
        expect(parseStringArray('{"foo":"bar"}')).toEqual(['{"foo":"bar"}']);
    });

    it("preserves entries with commas inside JSON array", () => {
        expect(parseStringArray('["hello, world","b"]')).toEqual(["hello, world", "b"]);
    });
});
