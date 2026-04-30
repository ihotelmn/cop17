import { describe, it, expect } from "vitest";
import { sanitizeRichTextToPlainText, sanitizeRichTextToParagraphs } from "./safe-rich-text";

describe("sanitizeRichTextToPlainText", () => {
    it("returns empty string for null/undefined/empty", () => {
        expect(sanitizeRichTextToPlainText(null)).toBe("");
        expect(sanitizeRichTextToPlainText(undefined)).toBe("");
        expect(sanitizeRichTextToPlainText("")).toBe("");
    });

    it("strips basic tags and keeps text", () => {
        expect(sanitizeRichTextToPlainText("<p>Hello <b>world</b></p>")).toContain("Hello");
        expect(sanitizeRichTextToPlainText("<p>Hello <b>world</b></p>")).toContain("world");
    });

    it("removes <script> blocks entirely (XSS)", () => {
        const malicious = `<p>Safe</p><script>alert('xss')</script><p>After</p>`;
        const out = sanitizeRichTextToPlainText(malicious);
        expect(out).not.toContain("alert");
        expect(out).not.toContain("<script");
        expect(out).toContain("Safe");
        expect(out).toContain("After");
    });

    it("removes <style> blocks entirely", () => {
        const html = `<style>body { display:none; }</style><p>Hello</p>`;
        const out = sanitizeRichTextToPlainText(html);
        expect(out).not.toContain("display:none");
        expect(out).toContain("Hello");
    });

    it("strips inline event handlers (via tag removal)", () => {
        const html = `<img src=x onerror="alert('xss')" /><span onclick="evil()">Text</span>`;
        const out = sanitizeRichTextToPlainText(html);
        expect(out).not.toContain("onerror");
        expect(out).not.toContain("onclick");
        expect(out).not.toContain("alert");
        expect(out).toContain("Text");
    });

    it("decodes common HTML entities", () => {
        expect(sanitizeRichTextToPlainText("Tom &amp; Jerry")).toBe("Tom & Jerry");
        expect(sanitizeRichTextToPlainText("&lt;tag&gt;")).toBe("<tag>");
        expect(sanitizeRichTextToPlainText("&quot;quoted&quot;")).toBe('"quoted"');
        expect(sanitizeRichTextToPlainText("don&#39;t")).toBe("don't");
        expect(sanitizeRichTextToPlainText("a&nbsp;b")).toBe("a b");
    });

    it("converts block-level tags into line breaks", () => {
        const out = sanitizeRichTextToPlainText("<p>A</p><p>B</p>");
        expect(out).toMatch(/A\s*\n\s*B/);
    });

    it("collapses excessive whitespace", () => {
        const out = sanitizeRichTextToPlainText("<p>A  B    C</p>");
        expect(out).toBe("A B C");
    });
});

describe("sanitizeRichTextToParagraphs", () => {
    it("returns empty array for empty input", () => {
        expect(sanitizeRichTextToParagraphs(null)).toEqual([]);
        expect(sanitizeRichTextToParagraphs("")).toEqual([]);
    });

    it("splits on blank lines", () => {
        const html = `<p>First paragraph</p><p>Second paragraph</p>`;
        const paras = sanitizeRichTextToParagraphs(html);
        expect(paras.length).toBe(2);
        expect(paras[0]).toBe("First paragraph");
        expect(paras[1]).toBe("Second paragraph");
    });

    it("drops empty paragraphs", () => {
        const paras = sanitizeRichTextToParagraphs("<p>A</p><p></p><p></p><p>B</p>");
        expect(paras.every((p) => p.length > 0)).toBe(true);
    });

    it("strips script in a paragraph context too", () => {
        const html = `<p>Clean<script>evil()</script>Text</p>`;
        const paras = sanitizeRichTextToParagraphs(html);
        expect(paras.join("")).not.toContain("evil");
    });
});
