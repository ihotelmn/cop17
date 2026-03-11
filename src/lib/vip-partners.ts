import type { Hotel } from "@/types/hotel";

const VIP_PARTNER_NAMES = new Set([
    "the blue sky hotel and tower",
    "ulaanbaatar hotel",
    "chinggis khaan hotel",
    "premium hotel",
    "khubilai hotel",
]);

function normalizeHotelName(value: string) {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isVipPartnerHotel(hotel: Pick<Hotel, "name" | "name_en">) {
    const names = [hotel.name_en, hotel.name]
        .filter((value): value is string => Boolean(value))
        .map(normalizeHotelName);

    return names.some((name) =>
        VIP_PARTNER_NAMES.has(name) ||
        name.includes("corporate hotel and convention center") ||
        name.includes("corporate hotel and convention centre")
    );
}
