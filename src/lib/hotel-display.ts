import type { Hotel } from "@/types/hotel";

const EMPTY_TEXT = new Set(["", "null", "none", "nan"]);

function cleanText(value: string | null | undefined) {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed || EMPTY_TEXT.has(trimmed.toLowerCase())) {
        return null;
    }

    return trimmed;
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function scoreEnglishSegment(segment: string) {
    const latin = (segment.match(/[A-Za-z]/g) || []).length;
    const cyrillic = (segment.match(/[\u0400-\u04FF]/g) || []).length;

    if (latin === 0) return Number.NEGATIVE_INFINITY;

    return latin - cyrillic * 2;
}

function extractEnglishSegment(value: string | null | undefined) {
    const cleaned = cleanText(value);
    if (!cleaned) return null;

    const segments = cleaned
        .split("|")
        .map((segment) => segment.trim())
        .filter(Boolean);

    if (segments.length === 0) {
        return /[A-Za-z]/.test(cleaned) ? cleaned : null;
    }

    const ranked = segments
        .map((segment) => ({ segment, score: scoreEnglishSegment(segment) }))
        .sort((a, b) => b.score - a.score);

    return ranked[0] && ranked[0].score > Number.NEGATIVE_INFINITY
        ? ranked[0].segment
        : null;
}

function toPlainText(value: string) {
    return value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/\r/g, "\n");
}

function hasUsefulEnglishText(value: string | null | undefined, minimumLatin = 12) {
    const cleaned = cleanText(value);
    if (!cleaned) return false;

    const plain = toPlainText(cleaned);
    const latin = (plain.match(/[A-Za-z]/g) || []).length;
    const cyrillic = (plain.match(/[\u0400-\u04FF]/g) || []).length;

    return latin >= minimumLatin && latin > cyrillic * 1.5;
}

function extractEnglishDescription(value: string | null | undefined) {
    const cleaned = cleanText(value);
    if (!cleaned) return null;

    const normalized = toPlainText(cleaned);

    const parts = normalized
        .split("\n")
        .map((part) => part.replace(/\s+/g, " ").trim())
        .filter(Boolean);

    const englishParts = parts.filter((part) => {
        const latin = (part.match(/[A-Za-z]/g) || []).length;
        const cyrillic = (part.match(/[\u0400-\u04FF]/g) || []).length;
        return latin >= 20 && latin > cyrillic * 1.5;
    });

    if (englishParts.length === 0) {
        const totalLatin = (cleaned.match(/[A-Za-z]/g) || []).length;
        const totalCyrillic = (cleaned.match(/[\u0400-\u04FF]/g) || []).length;
        if (totalLatin > totalCyrillic * 1.5 && totalLatin >= 20) {
            return cleaned;
        }
        return null;
    }

    return englishParts.map((part) => `<p>${escapeHtml(part)}</p>`).join("");
}

type HotelDisplayFields = Pick<
    Hotel,
    "name" | "name_en" | "address" | "address_en" | "description" | "description_en" | "stars"
>;

function buildFallbackAddress(hotel: Pick<HotelDisplayFields, "name" | "name_en" | "address">) {
    const locationSource = [hotel.address, hotel.name_en, hotel.name]
        .map((value) => cleanText(value))
        .filter(Boolean)
        .join(" ");

    if (!locationSource) return null;

    if (/(улаанбаатар|ulaanbaatar|\bub\b)/i.test(locationSource)) {
        return "Ulaanbaatar, Mongolia";
    }

    return "Mongolia";
}

function buildFallbackDescription(hotel: HotelDisplayFields) {
    const name = getPreferredHotelName(hotel) || "This hotel";
    const address = getPreferredHotelAddress(hotel) ?? "Ulaanbaatar, Mongolia";
    const starPrefix = typeof hotel.stars === "number" && hotel.stars > 0 ? `${hotel.stars}-star ` : "";

    return `<p>${escapeHtml(name)} is a ${starPrefix}hotel in ${escapeHtml(address)} for COP17 travelers. Room details, amenities, and arrival information are available through the official booking flow.</p>`;
}

export function getPreferredHotelName(hotel: HotelDisplayFields) {
    return cleanText(hotel.name_en) ?? extractEnglishSegment(hotel.name) ?? cleanText(hotel.name) ?? "";
}

export function getPreferredHotelAddress(hotel: HotelDisplayFields) {
    return cleanText(hotel.address_en) ?? extractEnglishSegment(hotel.address) ?? buildFallbackAddress(hotel);
}

export function getPreferredHotelDescription(hotel: HotelDisplayFields) {
    return (
        extractEnglishDescription(hotel.description_en)
        ?? (hasUsefulEnglishText(hotel.description_en) ? cleanText(hotel.description_en) : null)
        ?? extractEnglishDescription(hotel.description)
        ?? buildFallbackDescription(hotel)
    );
}

export function normalizeHotelForPublic<T extends Partial<HotelDisplayFields>>(hotel: T): T {
    return {
        ...hotel,
        name: getPreferredHotelName(hotel as HotelDisplayFields),
        address: getPreferredHotelAddress(hotel as HotelDisplayFields) ?? null,
        description: getPreferredHotelDescription(hotel as HotelDisplayFields) ?? null,
    };
}
