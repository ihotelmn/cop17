import Link from "next/link";
import { Plus, Wand2 } from "lucide-react";
import { getHotels } from "@/app/actions/admin";
import { HotelsAdminTable, type AdminHotelRow } from "@/components/admin/hotels-admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPreferredHotelAddress, getPreferredHotelName } from "@/lib/hotel-display";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const FILTER_DEFINITIONS = [
    { key: "published", label: "Published" },
    { key: "unpublished", label: "Unpublished" },
    { key: "no-rooms", label: "No Rooms" },
    { key: "no-images", label: "No Images" },
    { key: "missing-english", label: "Missing English" },
    { key: "missing-location", label: "Missing Location" },
    { key: "duplicates", label: "Possible Duplicates" },
    { key: "low-completeness", label: "Low Completeness" },
] as const;

type FilterKey = typeof FILTER_DEFINITIONS[number]["key"];

export default async function HotelsAdminPage({
    searchParams,
}: {
    searchParams?: Promise<{ q?: string; filters?: string }>;
}) {
    const hotels = await getHotels();
    const adminClient = getSupabaseAdmin();
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const query = resolvedSearchParams?.q?.trim() || "";
    const activeFilters = parseFilters(resolvedSearchParams?.filters);

    const hotelIds = hotels.map((hotel) => hotel.id);
    const { data: rooms } = hotelIds.length > 0
        ? await adminClient
            .from("rooms")
            .select("hotel_id, price_per_night, total_inventory")
            .in("hotel_id", hotelIds)
        : { data: [] as Array<{ hotel_id: string; price_per_night: number; total_inventory: number }> };

    const roomMetricsByHotel = buildRoomMetrics(rooms || []);
    const duplicateCounts = buildDuplicateCounts(hotels);

    const rows: AdminHotelRow[] = hotels.map((hotel) => {
        const displayName = getPreferredHotelName(hotel);
        const displayAddress = getPreferredHotelAddress(hotel) || "Ulaanbaatar, Mongolia";
        const roomMetrics = roomMetricsByHotel.get(hotel.id) || { roomCount: 0, pricedRoomCount: 0, activeInventoryCount: 0 };
        const missingEnglish = !hotel.name_en || !hotel.address_en || !hotel.description_en;
        const missingLocation = !hotel.latitude || !hotel.longitude;
        const noImages = !hotel.images || hotel.images.length === 0;
        const noRooms = roomMetrics.roomCount === 0;
        const noPricedRooms = roomMetrics.pricedRoomCount === 0;
        const duplicateCount = duplicateCounts.get(hotel.id) || 0;

        const completenessChecks = [
            !noImages,
            !noRooms,
            !missingEnglish,
            !missingLocation,
            !!hotel.description,
            !!hotel.address,
            !!(hotel.contact_phone || hotel.contact_email),
            !noPricedRooms,
        ];

        const completenessScore = Math.round(
            (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100
        );

        const needsAttention = [
            noRooms ? "No rooms" : null,
            noPricedRooms ? "No pricing" : null,
            noImages ? "No images" : null,
            missingEnglish ? "Missing English" : null,
            missingLocation ? "Missing location" : null,
            duplicateCount > 0 ? "Possible duplicate" : null,
        ].filter(Boolean) as string[];

        return {
            id: hotel.id,
            displayName,
            displayAddress,
            image: hotel.images?.[0] || null,
            stars: hotel.stars || 0,
            isPublished: hotel.is_published !== false,
            roomCount: roomMetrics.roomCount,
            pricedRoomCount: roomMetrics.pricedRoomCount,
            completenessScore,
            needsAttention,
            duplicateLabel: duplicateCount > 0 ? `${duplicateCount + 1} similar records` : null,
        };
    });

    const filteredRows = rows
        .filter((hotel) => {
            const normalizedQuery = query.toLowerCase();
            if (!normalizedQuery) return true;
            return (
                hotel.displayName.toLowerCase().includes(normalizedQuery) ||
                hotel.displayAddress.toLowerCase().includes(normalizedQuery)
            );
        })
        .filter((hotel) => matchesFilters(hotel, activeFilters));

    const filterCounts = Object.fromEntries(
        FILTER_DEFINITIONS.map(({ key }) => [key, rows.filter((hotel) => matchesSingleFilter(hotel, key)).length])
    ) as Record<FilterKey, number>;

    const publishedCount = rows.filter((hotel) => hotel.isPublished).length;
    const unpublishedCount = rows.length - publishedCount;
    const needsAttentionCount = rows.filter((hotel) => hotel.needsAttention.length > 0).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Hotels</h2>
                    <p className="text-zinc-500">Manage authorized hotels, detect weak data, and keep inventory clean.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        asChild
                        variant="outline"
                        className="border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50"
                    >
                        <Link href="/admin/hotels/import">
                            <Wand2 className="mr-2 h-4 w-4" />
                            Import Assistant
                        </Link>
                    </Button>
                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                        <Link href="/admin/hotels/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Hotel
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="border-zinc-200 bg-white shadow-sm">
                <CardHeader className="space-y-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div className="space-y-3">
                            <div>
                                <CardTitle className="text-zinc-950">Hotel Inventory</CardTitle>
                                <CardDescription className="text-zinc-500">
                                    {query || activeFilters.size
                                        ? `Showing ${filteredRows.length} of ${rows.length} hotels after search and filter rules.`
                                        : `List of all hotels available for booking. ${publishedCount} published, ${unpublishedCount} unpublished.`}
                                </CardDescription>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <CompactStat label="Total" value={rows.length} />
                                <CompactStat label="Published" value={publishedCount} tone="emerald" />
                                <CompactStat label="Needs Attention" value={needsAttentionCount} tone={needsAttentionCount > 0 ? "amber" : "slate"} />
                                <CompactStat
                                    label="Showing"
                                    value={filteredRows.length}
                                    tone={query || activeFilters.size ? "blue" : "slate"}
                                />
                            </div>
                        </div>

                        <form method="get" className="flex w-full max-w-2xl items-center gap-2">
                            <div className="flex-1">
                                <Input
                                    name="q"
                                    defaultValue={query}
                                    placeholder="Search hotel name or address"
                                    className="h-11 border-zinc-300 bg-white text-zinc-950 placeholder:text-zinc-400"
                                />
                            </div>
                            {activeFilters.size > 0 && (
                                <input type="hidden" name="filters" value={Array.from(activeFilters).join(",")} />
                            )}
                            <Button type="submit" variant="outline" className="h-11 border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50">
                                Search
                            </Button>
                            {(query || activeFilters.size > 0) && (
                                <Button asChild variant="ghost" className="h-11 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950">
                                    <Link href="/admin/hotels">Reset</Link>
                                </Button>
                            )}
                        </form>
                    </div>

                    <div className="space-y-2">
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                            Quick Filters
                        </div>
                        <div className="flex flex-wrap gap-2">
                        {FILTER_DEFINITIONS.map((filter) => {
                            const enabled = activeFilters.has(filter.key);
                            const href = buildFilterHref(query, activeFilters, filter.key);
                            return (
                                <Button
                                    key={filter.key}
                                    asChild
                                    size="sm"
                                    variant={enabled ? "default" : "outline"}
                                    className={enabled
                                        ? "h-9 rounded-full bg-amber-500 px-4 text-black hover:bg-amber-600"
                                        : "h-9 rounded-full border-zinc-300 bg-white px-4 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"}
                                >
                                    <Link href={href}>
                                        {filter.label}
                                        <Badge className={enabled ? "ml-2 bg-black/15 text-black" : "ml-2 border border-zinc-300 bg-zinc-100 text-zinc-600"}>
                                            {filterCounts[filter.key]}
                                        </Badge>
                                    </Link>
                                </Button>
                            );
                        })}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-1">
                    <HotelsAdminTable hotels={filteredRows} query={query} />
                </CardContent>
            </Card>
        </div>
    );
}

function CompactStat({
    label,
    value,
    tone = "slate",
}: {
    label: string;
    value: number;
    tone?: "slate" | "emerald" | "amber" | "blue";
}) {
    const toneClasses = {
        slate: "border-zinc-200 bg-zinc-50 text-zinc-700",
        emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
        amber: "border-amber-200 bg-amber-50 text-amber-700",
        blue: "border-blue-200 bg-blue-50 text-blue-700",
    } satisfies Record<string, string>;

    return (
        <div className={cn("inline-flex items-center gap-3 rounded-full border px-4 py-2", toneClasses[tone])}>
            <span className="text-xs font-medium uppercase tracking-[0.18em]">{label}</span>
            <span className="text-lg font-semibold">{value}</span>
        </div>
    );
}

function parseFilters(value?: string) {
    return new Set(
        (value || "")
            .split(",")
            .map((item) => item.trim())
            .filter((item): item is FilterKey => FILTER_DEFINITIONS.some((filter) => filter.key === item))
    );
}

function buildFilterHref(query: string, activeFilters: Set<FilterKey>, toggleKey: FilterKey) {
    const nextFilters = new Set(activeFilters);

    if (nextFilters.has(toggleKey)) {
        nextFilters.delete(toggleKey);
    } else {
        if (toggleKey === "published") nextFilters.delete("unpublished");
        if (toggleKey === "unpublished") nextFilters.delete("published");
        nextFilters.add(toggleKey);
    }

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextFilters.size > 0) params.set("filters", Array.from(nextFilters).join(","));
    const search = params.toString();
    return search ? `/admin/hotels?${search}` : "/admin/hotels";
}

function matchesFilters(hotel: AdminHotelRow, activeFilters: Set<FilterKey>) {
    return Array.from(activeFilters).every((filter) => matchesSingleFilter(hotel, filter));
}

function matchesSingleFilter(hotel: AdminHotelRow, filter: FilterKey) {
    switch (filter) {
        case "published":
            return hotel.isPublished;
        case "unpublished":
            return !hotel.isPublished;
        case "no-rooms":
            return hotel.roomCount === 0;
        case "no-images":
            return hotel.needsAttention.includes("No images");
        case "missing-english":
            return hotel.needsAttention.includes("Missing English");
        case "missing-location":
            return hotel.needsAttention.includes("Missing location");
        case "duplicates":
            return !!hotel.duplicateLabel;
        case "low-completeness":
            return hotel.completenessScore < 65;
        default:
            return true;
    }
}

function buildRoomMetrics(rooms: Array<{ hotel_id: string; price_per_night: number; total_inventory: number }>) {
    const metrics = new Map<string, { roomCount: number; pricedRoomCount: number; activeInventoryCount: number }>();

    for (const room of rooms) {
        const current = metrics.get(room.hotel_id) || { roomCount: 0, pricedRoomCount: 0, activeInventoryCount: 0 };
        current.roomCount += 1;
        if ((room.price_per_night || 0) > 0) {
            current.pricedRoomCount += 1;
        }
        if ((room.total_inventory || 0) > 0) {
            current.activeInventoryCount += 1;
        }
        metrics.set(room.hotel_id, current);
    }

    return metrics;
}

function buildDuplicateCounts(hotels: Awaited<ReturnType<typeof getHotels>>) {
    const groups = new Map<string, string[]>();

    for (const hotel of hotels) {
        const key = normalizeDuplicateKey(getPreferredHotelName(hotel), getPreferredHotelAddress(hotel));
        if (!key) continue;
        groups.set(key, [...(groups.get(key) || []), hotel.id]);
    }

    const counts = new Map<string, number>();
    for (const ids of groups.values()) {
        if (ids.length <= 1) continue;
        for (const id of ids) {
            counts.set(id, ids.length - 1);
        }
    }
    return counts;
}

function normalizeDuplicateKey(name: string, address?: string | null) {
    const normalizedName = name
        .toLowerCase()
        .replace(/\b(the|hotel|resort|ulaanbaatar|mongolia)\b/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const normalizedAddress = (address || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .split(" ")
        .slice(0, 6)
        .join(" ");

    return [normalizedName, normalizedAddress].filter(Boolean).join("::");
}
