import { z } from "zod";

export const importImageAssetSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
});

export const hotelImportRoomDraftSchema = z.object({
    name: z.string().min(1),
    description: z.string().default(""),
    type: z.string().default("Room"),
    price_per_night: z.number().min(0).default(0),
    capacity: z.number().int().min(1).default(2),
    total_inventory: z.number().int().min(0).default(0),
    amenities: z.array(z.string()).default([]),
    images: z.array(importImageAssetSchema).default([]),
    source_line: z.string().optional(),
    confidence: z.number().min(0).max(1).default(0.5),
});

export const hotelImportDraftSchema = z.object({
    name: z.string().min(1),
    name_en: z.string().default(""),
    description: z.string().default(""),
    description_en: z.string().default(""),
    address: z.string().default(""),
    address_en: z.string().default(""),
    stars: z.number().int().min(1).max(5).default(4),
    hotel_type: z.string().default("Hotel"),
    contact_phone: z.string().default(""),
    contact_email: z.string().default(""),
    website: z.string().default(""),
    check_in_time: z.string().default("14:00"),
    check_out_time: z.string().default("12:00"),
    amenities: z.array(z.string()).default([]),
    images: z.array(importImageAssetSchema).default([]),
    rooms: z.array(hotelImportRoomDraftSchema).default([]),
    warnings: z.array(z.string()).default([]),
    source_summary: z.string().default(""),
    is_official_partner: z.boolean().default(false),
    is_recommended: z.boolean().default(false),
    has_shuttle_service: z.boolean().default(false),
});

export type ImportImageAsset = z.infer<typeof importImageAssetSchema>;
export type HotelImportRoomDraft = z.infer<typeof hotelImportRoomDraftSchema>;
export type HotelImportDraft = z.infer<typeof hotelImportDraftSchema>;

interface WebsiteSignals {
    title?: string;
    metaDescription?: string;
    bodyText?: string;
    contactPhone?: string;
    contactEmail?: string;
}

const AMENITY_KEYWORDS: Array<{ name: string; keywords: string[] }> = [
    { name: "WiFi", keywords: ["wifi", "wi-fi", "wireless internet", "internet"] },
    { name: "Breakfast", keywords: ["breakfast", "buffet breakfast"] },
    { name: "Airport Shuttle", keywords: ["airport shuttle", "shuttle", "transfer"] },
    { name: "Parking", keywords: ["parking", "car park", "garage"] },
    { name: "Restaurant", keywords: ["restaurant", "dining", "all day dining"] },
    { name: "Bar", keywords: ["bar", "lounge", "pub"] },
    { name: "Pool", keywords: ["pool", "swimming pool"] },
    { name: "Gym", keywords: ["gym", "fitness", "fitness center"] },
    { name: "Spa", keywords: ["spa", "sauna", "wellness"] },
    { name: "Conference Room", keywords: ["conference", "meeting room", "ballroom", "event hall"] },
    { name: "Business Center", keywords: ["business center", "business centre"] },
    { name: "Laundry", keywords: ["laundry", "dry cleaning"] },
    { name: "Room Service", keywords: ["room service"] },
    { name: "24-Hour Front Desk", keywords: ["24-hour front desk", "front desk", "reception"] },
    { name: "Air Conditioning", keywords: ["air conditioning", "air-conditioned", "ac "] },
];

const ROOM_TYPE_KEYWORDS = [
    "room",
    "suite",
    "deluxe",
    "standard",
    "superior",
    "twin",
    "king",
    "queen",
    "family",
    "executive",
    "accessible",
    "apartment",
    "studio",
    "residence",
    "single",
    "double",
];

const HOTEL_IMAGE_HINTS = [
    "hotel",
    "building",
    "exterior",
    "facade",
    "front",
    "lobby",
    "reception",
    "restaurant",
    "bar",
    "spa",
    "gym",
    "pool",
    "meeting",
    "conference",
];

const STOP_TOKENS = new Set([
    "the",
    "hotel",
    "room",
    "type",
    "king",
    "queen",
    "double",
    "single",
    "twin",
    "suite",
]);

export async function buildHotelImportDraft(input: {
    rawSource: string;
    websiteUrl?: string;
    images: ImportImageAsset[];
}): Promise<HotelImportDraft> {
    const rawSource = normalizeSourceText(input.rawSource || "");
    const websiteUrl = (input.websiteUrl || "").trim();
    const websiteSignals = await fetchWebsiteSignals(websiteUrl);

    const combinedText = [rawSource.replace(/\n/g, " "), websiteSignals.title, websiteSignals.metaDescription, websiteSignals.bodyText]
        .filter(Boolean)
        .join("\n");
    const lowerCombinedText = combinedText.toLowerCase();

    const rooms = dedupeRooms(
        matchImagesToRooms(
            extractRooms(rawSource, lowerCombinedText),
            input.images
        )
    );

    const hotelImages = extractHotelImages(input.images, rooms);
    const hotelName = extractHotelName(rawSource, websiteUrl, websiteSignals);
    const description = extractDescription(rawSource, websiteSignals);
    const address = extractAddress(rawSource, websiteSignals.bodyText || "");
    const contactPhone = extractPhone(rawSource, websiteSignals.contactPhone, websiteSignals.bodyText || "");
    const contactEmail = extractEmail(rawSource, websiteSignals.contactEmail, websiteSignals.bodyText || "");
    const stars = extractStars(rawSource, websiteSignals);
    const checkInTime = extractTime(rawSource, ["check in", "check-in"], "14:00");
    const checkOutTime = extractTime(rawSource, ["check out", "check-out"], "12:00");
    const amenities = extractAmenities(lowerCombinedText);
    const warnings: string[] = [];

    if (!rooms.length) {
        warnings.push("No room rows were confidently detected. Add or review room types before publishing.");
    }

    if (!hotelImages.length && input.images.length) {
        warnings.push("Images were uploaded but none matched the hotel confidently. Review image assignments.");
    }

    if (!description) {
        warnings.push("No strong hotel description was detected. Add a public description before publishing.");
    }

    if (!websiteSignals.title && websiteUrl) {
        warnings.push("The website could not be read automatically. Draft was generated from pasted data only.");
    }

    const nameEn = looksEnglish(hotelName) ? hotelName : "";
    const descriptionEn = looksEnglish(description) ? description : "";
    const addressEn = looksEnglish(address) ? address : "";

    return hotelImportDraftSchema.parse({
        name: hotelName || "New Hotel Draft",
        name_en: nameEn,
        description,
        description_en: descriptionEn,
        address,
        address_en: addressEn,
        stars,
        hotel_type: extractHotelType(lowerCombinedText),
        contact_phone: contactPhone,
        contact_email: contactEmail,
        website: websiteUrl,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        amenities,
        images: hotelImages,
        rooms,
        warnings,
        source_summary: summarizeSource(rawSource, websiteUrl, input.images.length, rooms.length),
        is_official_partner: false,
        is_recommended: false,
        has_shuttle_service: amenities.includes("Airport Shuttle"),
    });
}

async function fetchWebsiteSignals(websiteUrl: string): Promise<WebsiteSignals> {
    if (!websiteUrl) {
        return {};
    }

    try {
        const response = await fetch(websiteUrl, {
            cache: "no-store",
            headers: {
                "User-Agent": "COP17 Import Assistant/1.0",
            },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            return {};
        }

        const html = await response.text();
        const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
        const metaDescription = firstMatch(
            html,
            /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
        );
        const bodyText = normalizeWhitespace(stripHtml(html)).slice(0, 12000);

        return {
            title: decodeHtml(title),
            metaDescription: decodeHtml(metaDescription),
            bodyText,
            contactPhone: extractPhone(html),
            contactEmail: extractEmail(html),
        };
    } catch {
        return {};
    }
}

function extractHotelName(rawSource: string, websiteUrl: string, websiteSignals: WebsiteSignals): string {
    const labeled =
        extractLabeledValue(rawSource, ["hotel name", "property name", "name", "hotel"]) ||
        cleanWebsiteTitle(websiteSignals.title || "") ||
        hostnameToLabel(websiteUrl);

    if (labeled) {
        return labeled;
    }

    const firstLongLine = rawSource
        .split(/\r?\n/)
        .map((line) => normalizeWhitespace(line))
        .find((line) => line.length >= 6 && !looksLikeRoomLine(line));

    return firstLongLine || "New Hotel Draft";
}

function extractDescription(rawSource: string, websiteSignals: WebsiteSignals): string {
    const explicit =
        extractLabeledBlock(rawSource, ["description", "about", "overview"]) ||
        websiteSignals.metaDescription ||
        "";

    if (explicit) {
        return explicit;
    }

    const paragraphs = rawSource
        .split(/\n{2,}/)
        .map((chunk) => normalizeWhitespace(chunk))
        .filter((chunk) => chunk.length > 80 && !looksLikeTableHeader(chunk));

    return paragraphs[0] || "";
}

function extractAddress(rawSource: string, websiteBodyText: string): string {
    const explicit = extractLabeledValue(rawSource, ["address", "location", "property address"]);
    if (explicit) {
        return explicit;
    }

    const candidate = firstMatch(
        websiteBodyText,
        /([A-Z0-9][^.!?\n]{8,120}(?:Ulaanbaatar|Mongolia)[^.!?\n]{0,80})/i
    );

    return candidate ? normalizeWhitespace(candidate) : "";
}

function extractPhone(...sources: Array<string | undefined>): string {
    for (const source of sources) {
        if (!source) continue;
        const match = source.match(/(\+?\d[\d\s().-]{7,}\d)/);
        if (match) {
            return normalizeWhitespace(match[1]);
        }
    }
    return "";
}

function extractEmail(...sources: Array<string | undefined>): string {
    for (const source of sources) {
        if (!source) continue;
        const match = source.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
        if (match) {
            return match[1].toLowerCase();
        }
    }
    return "";
}

function extractStars(rawSource: string, websiteSignals: WebsiteSignals): number {
    const combined = `${rawSource}\n${websiteSignals.title || ""}\n${websiteSignals.metaDescription || ""}`;
    const match = combined.match(/\b([1-5])\s*(?:star|stars)\b/i);
    if (match) {
        return Number(match[1]);
    }
    return 4;
}

function extractTime(source: string, labels: string[], fallback: string): string {
    const value = extractLabeledValue(source, labels);
    const match = value?.match(/(\d{1,2}:\d{2})/);
    if (match) {
        return normalizeTime(match[1]);
    }
    return fallback;
}

function extractHotelType(text: string): string {
    if (text.includes("resort")) return "Resort";
    if (text.includes("ger camp")) return "Ger Camp";
    if (text.includes("camp")) return "Camp";
    if (text.includes("hostel")) return "Hostel";
    return "Hotel";
}

function extractAmenities(text: string): string[] {
    return AMENITY_KEYWORDS
        .filter((item) => item.keywords.some((keyword) => text.includes(keyword)))
        .map((item) => item.name);
}

function extractRooms(rawSource: string, lowerCombinedText: string): HotelImportRoomDraft[] {
    const tableRooms = extractRoomsFromTable(rawSource);
    if (tableRooms.length) {
        return tableRooms;
    }
    return extractRoomsFromLines(rawSource, lowerCombinedText);
}

function extractRoomsFromTable(rawSource: string): HotelImportRoomDraft[] {
    const lines = rawSource
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const headerIndex = lines.findIndex((line) => looksLikeRoomHeader(line));
    if (headerIndex === -1 || !lines[headerIndex + 1]) {
        return [];
    }

    const delimiter = detectDelimiter(lines[headerIndex]);
    const headers = splitLine(lines[headerIndex], delimiter).map((header) => normalizeHeader(header));

    const roomNameIndex = findHeaderIndex(headers, ["room name", "name", "room type", "type"]);
    const priceIndex = findHeaderIndex(headers, ["price", "rate", "nightly", "price per night"]);
    const capacityIndex = findHeaderIndex(headers, ["capacity", "occupancy", "pax", "guests"]);
    const inventoryIndex = findHeaderIndex(headers, ["inventory", "qty", "quantity", "count", "units", "rooms"]);
    const descriptionIndex = findHeaderIndex(headers, ["description", "details", "notes"]);
    const categoryIndex = findHeaderIndex(headers, ["category", "class", "type"]);

    if (roomNameIndex === -1) {
        return [];
    }

    const rooms: HotelImportRoomDraft[] = [];

    for (const line of lines.slice(headerIndex + 1)) {
        const values = splitLine(line, delimiter);
        if (values.length < 2) continue;

        const name = values[roomNameIndex]?.trim();
        if (!name) continue;

        const description = descriptionIndex >= 0 ? values[descriptionIndex]?.trim() || "" : "";
        const type = categoryIndex >= 0 ? values[categoryIndex]?.trim() || inferRoomType(name) : inferRoomType(name);
        const price_per_night = parseNumeric(values[priceIndex]);
        const capacity = parsePositiveInt(values[capacityIndex], inferCapacity(name, description));
        const total_inventory = parsePositiveInt(values[inventoryIndex], 0);

        rooms.push({
            name,
            description,
            type,
            price_per_night,
            capacity,
            total_inventory,
            amenities: [],
            images: [],
            source_line: line,
            confidence: 0.86,
        });
    }

    return rooms;
}

function extractRoomsFromLines(rawSource: string, lowerCombinedText: string): HotelImportRoomDraft[] {
    const rooms: HotelImportRoomDraft[] = [];
    const seen = new Set<string>();

    for (const line of rawSource.split(/\r?\n/)) {
        const normalizedLine = normalizeWhitespace(line);
        if (!normalizedLine || !looksLikeRoomLine(normalizedLine)) continue;

        const name = extractRoomNameFromLine(normalizedLine);
        if (!name) continue;

        const dedupeKey = name.toLowerCase();
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const description = extractInlineDescription(normalizedLine, name);
        rooms.push({
            name,
            description,
            type: inferRoomType(name),
            price_per_night: parseNumeric(normalizedLine),
            capacity: inferCapacity(name, normalizedLine),
            total_inventory: inferInventory(normalizedLine),
            amenities: extractAmenities(normalizedLine.toLowerCase()),
            images: [],
            source_line: normalizedLine,
            confidence: 0.62,
        });
    }

    if (!rooms.length && /suite|deluxe|standard|twin|king|queen|family/i.test(lowerCombinedText)) {
        return [
            {
                name: "Standard Room",
                description: "",
                type: "Standard",
                price_per_night: 0,
                capacity: 2,
                total_inventory: 0,
                amenities: [],
                images: [],
                confidence: 0.2,
            },
        ];
    }

    return rooms;
}

function matchImagesToRooms(rooms: HotelImportRoomDraft[], images: ImportImageAsset[]): HotelImportRoomDraft[] {
    if (!rooms.length || !images.length) {
        return rooms;
    }

    const assignments = new Map<string, ImportImageAsset[]>();
    const usedImageIds = new Set<string>();

    for (const room of rooms) {
        const roomTokens = getMeaningfulTokens(`${room.name} ${room.type}`);
        let scored: Array<{ asset: ImportImageAsset; score: number }> = [];

        for (const asset of images) {
            const fileTokens = getMeaningfulTokens(asset.name);
            const overlap = roomTokens.filter((token) => fileTokens.includes(token));
            if (!overlap.length) continue;
            scored.push({ asset, score: overlap.length });
        }

        scored = scored
            .sort((left, right) => right.score - left.score)
            .slice(0, 4);

        if (scored.length) {
            assignments.set(room.name, scored.map((item) => item.asset));
            scored.forEach((item) => usedImageIds.add(item.asset.id));
        }
    }

    return rooms.map((room) => ({
        ...room,
        images: assignments.get(room.name) || [],
        confidence: assignments.has(room.name) ? Math.max(room.confidence, 0.78) : room.confidence,
    }));
}

function extractHotelImages(images: ImportImageAsset[], rooms: HotelImportRoomDraft[]): ImportImageAsset[] {
    const roomImageIds = new Set(rooms.flatMap((room) => room.images.map((image) => image.id)));
    const unusedImages = images.filter((image) => !roomImageIds.has(image.id));

    const confidentHotelImages = unusedImages.filter((image) => {
        const lowerName = image.name.toLowerCase();
        return HOTEL_IMAGE_HINTS.some((hint) => lowerName.includes(hint));
    });

    if (confidentHotelImages.length) {
        return confidentHotelImages.slice(0, 8);
    }

    return unusedImages.slice(0, 8);
}

function dedupeRooms(rooms: HotelImportRoomDraft[]): HotelImportRoomDraft[] {
    const deduped = new Map<string, HotelImportRoomDraft>();

    for (const room of rooms) {
        const key = `${room.name}::${room.type}`.toLowerCase();
        if (!deduped.has(key)) {
            deduped.set(key, room);
            continue;
        }

        const existing = deduped.get(key)!;
        deduped.set(key, {
            ...existing,
            description: existing.description || room.description,
            price_per_night: existing.price_per_night || room.price_per_night,
            capacity: Math.max(existing.capacity, room.capacity),
            total_inventory: Math.max(existing.total_inventory, room.total_inventory),
            amenities: Array.from(new Set([...existing.amenities, ...room.amenities])),
            images: existing.images.length ? existing.images : room.images,
            confidence: Math.max(existing.confidence, room.confidence),
        });
    }

    return Array.from(deduped.values());
}

function looksLikeRoomHeader(line: string): boolean {
    const lowerLine = line.toLowerCase();
    return (
        (lowerLine.includes("room") || lowerLine.includes("type")) &&
        (lowerLine.includes("price") || lowerLine.includes("rate") || lowerLine.includes("inventory") || lowerLine.includes("qty"))
    );
}

function looksLikeRoomLine(line: string): boolean {
    const lowerLine = line.toLowerCase();
    return ROOM_TYPE_KEYWORDS.some((keyword) => lowerLine.includes(keyword));
}

function looksLikeTableHeader(line: string): boolean {
    return looksLikeRoomHeader(line) || /name\s*[:|]/i.test(line);
}

function extractRoomNameFromLine(line: string): string {
    const match = line.match(
        /((?:deluxe|standard|superior|executive|family|accessible|presidential|junior|classic|premium|club|studio|apartment|suite|twin|king|queen|single|double)[^,;|]*)/i
    );

    if (match) {
        return normalizeWhitespace(match[1].replace(/[:|-]\s*$/, ""));
    }

    return normalizeWhitespace(line.split(/[|,]/)[0] || "");
}

function extractInlineDescription(line: string, roomName: string): string {
    const remainder = normalizeWhitespace(line.replace(roomName, "").replace(/^[-:|,\s]+/, ""));
    return remainder.length > 12 ? remainder : "";
}

function inferRoomType(name: string): string {
    if (/suite/i.test(name)) return "Suite";
    if (/family/i.test(name)) return "Family";
    if (/deluxe/i.test(name)) return "Deluxe";
    if (/superior/i.test(name)) return "Superior";
    if (/executive|club/i.test(name)) return "Executive";
    return "Room";
}

function inferCapacity(name: string, description: string): number {
    const combined = `${name} ${description}`;
    const explicit = combined.match(/(\d+)\s*(?:pax|guest|guests|adult|adults)/i);
    if (explicit) {
        return Math.max(1, Number(explicit[1]));
    }
    if (/family/i.test(combined)) return 4;
    if (/single/i.test(combined)) return 1;
    return 2;
}

function inferInventory(line: string): number {
    const match = line.match(/(?:inventory|qty|count|rooms|units)\s*[:=-]?\s*(\d+)/i);
    return match ? Number(match[1]) : 0;
}

function detectDelimiter(line: string): string {
    if (line.includes("\t")) return "\t";
    if (line.includes("|")) return "|";
    if (line.includes(";")) return ";";
    return ",";
}

function splitLine(line: string, delimiter: string): string[] {
    return line.split(delimiter).map((part) => normalizeWhitespace(part));
}

function normalizeHeader(header: string): string {
    return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findHeaderIndex(headers: string[], candidates: string[]): number {
    return headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
}

function parseNumeric(value: string | undefined): number {
    if (!value) return 0;
    const match = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : 0;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = parseNumeric(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

function extractLabeledValue(source: string, labels: string[]): string {
    for (const label of labels) {
        const match = source.match(new RegExp(`${escapeRegex(label)}\\s*[:|-]\\s*(.+)`, "i"));
        if (match?.[1]) {
            return normalizeWhitespace(match[1]);
        }
    }
    return "";
}

function extractLabeledBlock(source: string, labels: string[]): string {
    for (const label of labels) {
        const match = source.match(
            new RegExp(`${escapeRegex(label)}\\s*[:|-]\\s*([\\s\\S]{20,600})`, "i")
        );
        if (match?.[1]) {
            return normalizeWhitespace(match[1].split(/\n{2,}/)[0]);
        }
    }
    return "";
}

function cleanWebsiteTitle(title: string): string {
    const cleaned = normalizeWhitespace(
        title
            .replace(/\s*[|•-]\s*(official site|official website|mongolia|ulaanbaatar).*$/i, "")
            .replace(/\s*[|•-]\s*book.*$/i, "")
    );
    return cleaned;
}

function hostnameToLabel(websiteUrl: string): string {
    try {
        const url = new URL(websiteUrl);
        const rawHost = url.hostname.replace(/^www\./i, "").split(".")[0];
        return rawHost
            .split(/[-_]/)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
    } catch {
        return "";
    }
}

function summarizeSource(rawSource: string, websiteUrl: string, imageCount: number, roomCount: number): string {
    const parts = [
        rawSource ? "Pasted source provided" : "No pasted source",
        websiteUrl ? "website linked" : "no website",
        `${imageCount} image${imageCount === 1 ? "" : "s"}`,
        `${roomCount} room draft${roomCount === 1 ? "" : "s"}`,
    ];
    return parts.join(" · ");
}

function getMeaningfulTokens(value: string): string[] {
    return Array.from(
        new Set(
            value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .split(" ")
                .map((token) => token.trim())
                .filter((token) => token.length > 2 && !STOP_TOKENS.has(token))
        )
    );
}

function stripHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ");
}

function decodeHtml(value: string): string {
    return value
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");
}

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function normalizeSourceText(value: string): string {
    return value
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => line.replace(/[ \u00A0]+/g, " ").trim())
        .join("\n")
        .trim();
}

function normalizeTime(value: string): string {
    const [hours = "14", minutes = "00"] = value.split(":");
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

function firstMatch(source: string, regex: RegExp): string {
    return source.match(regex)?.[1]?.trim() || "";
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looksEnglish(value: string): boolean {
    if (!value) return false;
    const latinCharacters = (value.match(/[A-Za-z]/g) || []).length;
    const cyrillicCharacters = (value.match(/[А-Яа-яЁёӨөҮү]/g) || []).length;
    return latinCharacters >= cyrillicCharacters;
}
