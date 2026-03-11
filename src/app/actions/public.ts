"use server";

import { unstable_cache } from "next/cache";

import { normalizeHotelForPublic } from "@/lib/hotel-display";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { calculateDistance, COP17_VENUE } from "@/lib/venue";
import type { Hotel, Room, HotelSearchParams } from "@/types/hotel";

function isMissingPublishedColumn(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "42703";
}

function isVisibleHotel(hotel: any) {
    return hotel?.is_published !== false;
}

function hasMeaningfulError(error: unknown) {
    if (!(typeof error === "object" && error !== null)) {
        return false;
    }

    const message = "message" in error ? (error as { message?: unknown }).message : undefined;
    const code = "code" in error ? (error as { code?: unknown }).code : undefined;

    return Boolean(message) || Boolean(code);
}

async function getPublishedHotelId(hotelId: string) {
    const publicClient = getSupabaseAdmin();
    const createQuery = (filterPublished: boolean, includePublishedColumn: boolean) => {
        let query = publicClient
            .from("hotels")
            .select((includePublishedColumn ? "id, is_published" : "id") as any)
            .eq("id", hotelId);

        if (filterPublished) {
            query = query.eq("is_published", true);
        }

        return query;
    };

    let { data, error } = await createQuery(true, true).maybeSingle();

    if (isMissingPublishedColumn(error)) {
        ({ data, error } = await createQuery(false, false).maybeSingle());
    }

    if (error) {
        throw error;
    }

    return isVisibleHotel(data) ? (data as any)?.id ?? null : null;
}

export const getPublishedHotels = async (searchParams?: HotelSearchParams) => {
    return unstable_cache(
        async (params?: HotelSearchParams) => {
            try {
                const publicClient = getSupabaseAdmin();
                const createQuery = (filterPublished: boolean) => {
                    let queryBuilder = publicClient
                        .from("hotels")
                        .select(`
                            *,
                            rooms (
                                id,
                                price_per_night,
                                capacity,
                                total_inventory
                            )
                        `)
                        .order("created_at", { ascending: false });

                    if (filterPublished) {
                        queryBuilder = queryBuilder.eq("is_published", true);
                    }

                    if (params?.query) {
                        const qLower = params.query.toLowerCase().trim();
                        const genericTerms = ["ulaanbaatar", "улаанбаатар", "ub", "уб", "ulaanbaatar, mongolia", "улаанбаатар хот"];

                        if (!genericTerms.includes(qLower)) {
                            const q = `%${params.query}%`;
                            queryBuilder = queryBuilder.or(`name.ilike.${q},name_en.ilike.${q},address.ilike.${q},address_en.ilike.${q}`);
                        }
                    }

                    if (params?.stars) {
                        const stars = parseInt(params.stars);
                        if (!Number.isNaN(stars)) {
                            queryBuilder = queryBuilder.gte("stars", stars);
                        }
                    }

                    if (params?.amenities) {
                        const amenitiesList = params.amenities.split(",").filter(Boolean);
                        if (amenitiesList.length > 0) {
                            queryBuilder = queryBuilder.contains("amenities", amenitiesList);
                        }
                    }

                    return queryBuilder;
                };

                let { data: hotels, error } = await createQuery(true);

                if (isMissingPublishedColumn(error)) {
                    ({ data: hotels, error } = await createQuery(false));
                }

                if (error) {
                    console.error("Error fetching hotels:", error);
                    return [];
                }

                const visibleHotels = (hotels ?? []).filter((hotel: any) => isVisibleHotel(hotel));
                let results = visibleHotels.map((hotel: any) => {
                    const lat = hotel.latitude ? Number(hotel.latitude) : null;
                    const lng = hotel.longitude ? Number(hotel.longitude) : null;
                    const distance = hotel.cached_distance_km ?? (
                        (lat && lng)
                            ? calculateDistance(lat, lng, COP17_VENUE.latitude, COP17_VENUE.longitude)
                            : null
                    );

                    return normalizeHotelForPublic({
                        ...hotel,
                        amenities: Array.isArray(hotel.amenities)
                            ? hotel.amenities.map((amenity: any) => typeof amenity === "string" ? amenity : JSON.stringify(amenity))
                            : [],
                        latitude: lat,
                        longitude: lng,
                        distanceToVenue: distance,
                        cached_distance_km: hotel.cached_distance_km,
                        cached_drive_time_text: hotel.cached_drive_time_text,
                        cached_drive_time_value: hotel.cached_drive_time_value,
                        google_place_id: hotel.google_place_id,
                        cached_rating: hotel.cached_rating,
                        cached_review_count: hotel.cached_review_count,
                        is_official_partner: !!hotel.is_official_partner,
                        is_recommended: !!hotel.is_recommended,
                        has_shuttle_service: !!hotel.has_shuttle_service,
                        minPrice: hotel.rooms?.length > 0 ? Math.min(...hotel.rooms.map((room: any) => Number(room.price_per_night))) : null,
                        max_capacity: hotel.rooms?.length > 0 ? Math.max(...hotel.rooms.map((room: any) => Number(room.capacity))) : 0,
                    });
                });

                const totalRequired = parseInt(params?.adults || "1") + parseInt(params?.children || "0");

                if (totalRequired > 1) {
                    results = results.filter((hotel: any) => {
                        // Keep hotels without sourced room rows visible until inventory is backfilled.
                        if (!hotel.rooms || hotel.rooms.length === 0) return true;
                        const totalHotelCapacity = hotel.rooms.reduce(
                            (sum: number, room: any) => sum + (Number(room.capacity) * Number(room.total_inventory || 0)),
                            0
                        );
                        return totalHotelCapacity >= totalRequired;
                    });
                }

                if (params?.from && params?.to && results.length > 0) {
                    const roomIds = results.flatMap((hotel: any) => hotel.rooms?.map((room: any) => room.id) ?? []);

                    if (roomIds.length > 0) {
                        const adminClient = getSupabaseAdmin();
                        const { data: overlappingBookings, error: bookingsError } = await adminClient
                            .from("bookings")
                            .select("room_id, status, created_at")
                            .in("room_id", roomIds)
                            .lt("check_in_date", params.to)
                            .gt("check_out_date", params.from)
                            .in("status", ["confirmed", "pending"]);

                        if (!bookingsError && overlappingBookings) {
                            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
                            const bookingsByRoom: Record<string, number> = {};

                            for (const booking of overlappingBookings) {
                                const isConfirmed = booking.status === "confirmed";
                                const isRecentPending = booking.status === "pending" && new Date(booking.created_at) >= fifteenMinutesAgo;

                                if (isConfirmed || isRecentPending) {
                                    bookingsByRoom[booking.room_id] = (bookingsByRoom[booking.room_id] || 0) + 1;
                                }
                            }

                            results = results.map((hotel: any) => {
                                if (!hotel.rooms || hotel.rooms.length === 0) return hotel;

                                const availableRooms = hotel.rooms
                                    .map((room: any) => {
                                        const bookedCount = bookingsByRoom[room.id] || 0;
                                        const availableInventory = Math.max(0, (room.total_inventory || 0) - bookedCount);
                                        return { ...room, availableInventory };
                                    })
                                    .filter((room: any) => room.availableInventory > 0);

                                return {
                                    ...hotel,
                                    rooms: hotel.rooms.map((room: any) => ({
                                        ...room,
                                        availableInventory: Math.max(0, (room.total_inventory || 0) - (bookingsByRoom[room.id] || 0)),
                                    })),
                                    minPrice: availableRooms.length > 0
                                        ? Math.min(...availableRooms.map((room: any) => Number(room.price_per_night)))
                                        : null,
                                    isFullyBooked: availableRooms.length === 0,
                                };
                            });

                            results = results.filter((hotel: any) => {
                                const totalAvailableHotelCapacity = hotel.rooms.reduce(
                                    (sum: number, room: any) => sum + (Number(room.capacity) * (room.availableInventory || 0)),
                                    0
                                );
                                return totalAvailableHotelCapacity >= totalRequired;
                            });
                        }
                    }
                }

                if (params?.minPrice) {
                    const min = parseFloat(params.minPrice);
                    if (!Number.isNaN(min)) {
                        results = results.filter((hotel: any) => hotel.minPrice !== null && hotel.minPrice >= min);
                    }
                }

                if (params?.maxPrice) {
                    const max = parseFloat(params.maxPrice);
                    if (!Number.isNaN(max)) {
                        results = results.filter((hotel: any) => hotel.minPrice !== null && hotel.minPrice <= max);
                    }
                }

                const sortBy = params?.sortBy || "newest";
                results.sort((a: any, b: any) => {
                    const priceA = a.minPrice ?? 99999999;
                    const priceB = b.minPrice ?? 99999999;

                    switch (sortBy) {
                        case "price-asc":
                            return priceA - priceB;
                        case "price-desc":
                            return priceB - priceA;
                        case "stars-desc":
                            return b.stars - a.stars;
                        case "distance-asc":
                            return (a.distanceToVenue ?? 9999) - (b.distanceToVenue ?? 9999);
                        case "newest":
                        default:
                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    }
                });

                return results as (Hotel & { minPrice: number })[];
            } catch (error) {
                console.error("Unexpected error fetching published hotels:", error);
                return [];
            }
        },
        ["published-hotels", JSON.stringify(searchParams || {})],
        {
            revalidate: 300,
            tags: ["hotels"],
        }
    )(searchParams);
};

export async function getPublicHotel(id: string) {
    try {
        const supabase = getSupabaseAdmin();
        const createQuery = (filterPublished: boolean) => {
            let query = supabase
                .from("hotels")
                .select("*")
                .eq("id", id);

            if (filterPublished) {
                query = query.eq("is_published", true);
            }

            return query;
        };

        let { data: hotel, error } = await createQuery(true).maybeSingle();

        if (isMissingPublishedColumn(error)) {
            ({ data: hotel, error } = await createQuery(false).maybeSingle());
        }

        if (error) {
            console.error(`Error fetching public hotel (ID: ${id}):`, error);
            return null;
        }

        if (!hotel || !isVisibleHotel(hotel)) {
            return null;
        }

        const lat = hotel.latitude ? Number(hotel.latitude) : null;
        const lng = hotel.longitude ? Number(hotel.longitude) : null;

        return normalizeHotelForPublic({
            ...hotel,
            latitude: lat,
            longitude: lng,
            distanceToVenue: hotel.cached_distance_km ?? (
                (lat && lng)
                    ? calculateDistance(lat, lng, COP17_VENUE.latitude, COP17_VENUE.longitude)
                    : null
            ),
            cached_rating: hotel.cached_rating,
            cached_review_count: hotel.cached_review_count,
            google_place_id: hotel.google_place_id,
        }) as Hotel;
    } catch (error) {
        console.error(`Unexpected error fetching public hotel (ID: ${id}):`, error);
        return null;
    }
}

export async function getPublicRooms(hotelId: string, _guests?: number, from?: string, to?: string) {
    try {
        const publicClient = getSupabaseAdmin();
        const publishedHotelId = await getPublishedHotelId(hotelId);

        if (!publishedHotelId) {
            return [];
        }

        const { data: rooms, error } = await publicClient
            .from("rooms")
            .select("*")
            .eq("hotel_id", publishedHotelId)
            .order("price_per_night", { ascending: true });

        if (error) {
            console.error(`Error fetching public rooms (Hotel ID: ${hotelId}):`, error);
            return [];
        }

        if (from && to && rooms && rooms.length > 0) {
            const roomIds = rooms.map((room) => room.id);
            const adminClient = getSupabaseAdmin();
            const { data: overlappingBookings, error: bookingsError } = await adminClient
                .from("bookings")
                .select("room_id, status, created_at")
                .in("room_id", roomIds)
                .lt("check_in_date", to)
                .gt("check_out_date", from)
                .in("status", ["confirmed", "pending"]);

            if (!bookingsError && overlappingBookings) {
                const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
                const bookingsByRoom: Record<string, number> = {};

                for (const booking of overlappingBookings) {
                    const isConfirmed = booking.status === "confirmed";
                    const isRecentPending = booking.status === "pending" && new Date(booking.created_at) >= fifteenMinutesAgo;

                    if (isConfirmed || isRecentPending) {
                        bookingsByRoom[booking.room_id] = (bookingsByRoom[booking.room_id] || 0) + 1;
                    }
                }

                return rooms.map((room) => ({
                    ...room,
                    total_inventory: Math.max(0, (room.total_inventory || 0) - (bookingsByRoom[room.id] || 0)),
                })) as Room[];
            }
        }

        return (rooms ?? []) as Room[];
    } catch (error) {
        console.error(`Unexpected error fetching public rooms (Hotel ID: ${hotelId}):`, error);
        return [];
    }
}

export async function getPublicRoom(roomId: string) {
    try {
        const supabase = getSupabaseAdmin();
        const { data: room, error } = await supabase
            .from("rooms")
            .select(`
                *,
                hotel:hotels (*)
            `)
            .eq("id", roomId)
            .maybeSingle();

        if (error) {
            console.error(`Error fetching public room (ID: ${roomId}):`, error);
            return null;
        }

        if (!room) {
            return null;
        }

        const hotel = Array.isArray(room.hotel) ? room.hotel[0] : room.hotel;
        if (!hotel || !isVisibleHotel(hotel)) {
            return null;
        }

        return {
            ...room,
            hotel: normalizeHotelForPublic(hotel),
        };
    } catch (error) {
        console.error(`Unexpected error fetching public room (ID: ${roomId}):`, error);
        return null;
    }
}

export async function getHomepageStats() {
    const supabase = getSupabaseAdmin();

    try {
        const createHotelsCountQuery = (filterPublished: boolean) => {
            let query = supabase
                .from("hotels")
                .select("*", { count: "exact", head: true });

            if (filterPublished) {
                query = query.eq("is_published", true);
            }

            return query;
        };

        let { count: hotelsCount, error: hotelsError } = await createHotelsCountQuery(true);

        if (isMissingPublishedColumn(hotelsError)) {
            ({ count: hotelsCount, error: hotelsError } = await createHotelsCountQuery(false));
        }

        if (hotelsError) {
            if (hasMeaningfulError(hotelsError)) {
                console.error("Supabase hotels error:", hotelsError);
            }
            return {
                hotels: 0,
                rooms: 0,
            };
        }

        const createHotelIdsQuery = (filterPublished: boolean, includePublishedColumn: boolean) => {
            let query = supabase
                .from("hotels")
                .select((includePublishedColumn ? "id, is_published" : "id") as any);

            if (filterPublished) {
                query = query.eq("is_published", true);
            }

            return query;
        };

        let { data: hotelIds, error: hotelIdsError } = await createHotelIdsQuery(true, true);

        if (isMissingPublishedColumn(hotelIdsError)) {
            ({ data: hotelIds, error: hotelIdsError } = await createHotelIdsQuery(false, false));
        }

        if (hotelIdsError) {
            if (hasMeaningfulError(hotelIdsError)) {
                console.error("Supabase hotel ids error:", hotelIdsError);
            }
            return {
                hotels: hotelsCount || 0,
                rooms: 0,
            };
        }

        const publishedHotelIds = (hotelIds ?? [])
            .filter((hotel) => isVisibleHotel(hotel))
            .map((hotel: any) => hotel.id);
        if (publishedHotelIds.length === 0) {
            return { hotels: hotelsCount || 0, rooms: 0 };
        }

        const { data: rooms, error: roomsError } = await supabase
            .from("rooms")
            .select("total_inventory")
            .in("hotel_id", publishedHotelIds);

        if (roomsError) {
            if (hasMeaningfulError(roomsError)) {
                console.error("Supabase rooms error:", roomsError);
            }
            return {
                hotels: hotelsCount || 0,
                rooms: 0,
            };
        }

        let totalRooms = rooms ? rooms.reduce((sum, room) => sum + (room.total_inventory || 0), 0) : 0;

        if (totalRooms === 0 && rooms && rooms.length > 0) {
            totalRooms = rooms.length;
        }

        return {
            hotels: hotelsCount || 0,
            rooms: totalRooms,
        };
    } catch (error) {
        if (hasMeaningfulError(error)) {
            console.error("Error fetching homepage stats:", error);
        }
        return {
            hotels: 0,
            rooms: 0,
        };
    }
}

export async function getSearchSuggestions(query: string) {
    if (!query || query.length < 2) return [];

    const supabase = getSupabaseAdmin();
    const q = `%${query}%`;

    try {
        const createSuggestionsQuery = (filterPublished: boolean, includePublishedColumn: boolean) => {
            let queryBuilder = supabase
                .from("hotels")
                .select((includePublishedColumn ? "name, name_en, address, address_en, is_published" : "name, name_en, address, address_en") as any)
                .or(`name.ilike.${q},name_en.ilike.${q},address.ilike.${q},address_en.ilike.${q}`)
                .limit(10);

            if (filterPublished) {
                queryBuilder = queryBuilder.eq("is_published", true);
            }

            return queryBuilder;
        };

        let { data: hotels, error } = await createSuggestionsQuery(true, true);

        if (isMissingPublishedColumn(error)) {
            ({ data: hotels, error } = await createSuggestionsQuery(false, false));
        }

        if (error) throw error;

        const suggestions = new Set<string>();

        (hotels ?? []).filter((hotel) => isVisibleHotel(hotel)).forEach((hotel: any) => {
            const normalizedHotel = normalizeHotelForPublic(hotel);

            if (normalizedHotel.name.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(normalizedHotel.name);
            }

            if (normalizedHotel.address) {
                const parts = normalizedHotel.address.split(",").map((part: string) => part.trim());
                parts.forEach((part: string) => {
                    if (part.toLowerCase().includes(query.toLowerCase()) && part.length > 2) {
                        suggestions.add(part);
                    }
                });
            }
        });

        return Array.from(suggestions).slice(0, 6);
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return [];
    }
}
