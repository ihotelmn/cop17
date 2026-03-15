/**
 * Parse a JSON array string or comma-separated string into a string array.
 * Used for amenities, images, and other array fields from form data.
 */
export function parseStringArray(input: string | undefined | null): string[] {
    if (!input) return [];
    try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed;
    } catch { }
    return input.split(",").map((s) => s.trim()).filter(Boolean);
}
