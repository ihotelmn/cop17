const BLOCK_TAG_BREAKS = /<\/?(?:p|div|section|article|br|li|ul|ol|h[1-6]|table|tr|td|th)\b[^>]*>/gi;
const SCRIPT_STYLE_BLOCKS = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const ALL_TAGS = /<[^>]+>/g;

function decodeHtmlEntities(value: string) {
    return value
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");
}

export function sanitizeRichTextToPlainText(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    return decodeHtmlEntities(
        value
            .replace(SCRIPT_STYLE_BLOCKS, " ")
            .replace(BLOCK_TAG_BREAKS, "\n")
            .replace(ALL_TAGS, " ")
    )
        .replace(/\r/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

export function sanitizeRichTextToParagraphs(value: string | null | undefined) {
    const plainText = sanitizeRichTextToPlainText(value);

    if (!plainText) {
        return [];
    }

    return plainText
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}
