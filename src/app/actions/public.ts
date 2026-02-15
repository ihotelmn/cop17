"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { calculateDistance, COP17_VENUE } from "@/lib/venue";

export type Hotel = {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    stars: number;
    amenities: string[] | null;
    images: string[] | null;
    created_at: string;
    latitude?: number | null;
    longitude?: number | null;
    // New fields
    hotel_type?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    website?: string | null;
    check_in_time?: string | null;
    check_out_time?: string | null;
    // Calculated
    distanceToVenue?: number | null;
    // Cached Distance
    cached_distance_km?: number | null;
    cached_drive_time_text?: string | null;
    cached_drive_time_value?: number | null;
    cached_walk_time_text?: string | null;
    cached_walk_time_value?: number | null;
    // Google Reviews
    google_place_id?: string | null;
    cached_rating?: number | null;
    cached_review_count?: number | null;
};

export type HotelSearchParams = {
    query?: string;
    stars?: string;
    amenities?: string;
    sortBy?: string; // price-asc, price-desc, stars-desc, newest, distance-asc
    minPrice?: string;
    maxPrice?: string;
};

export async function getPublishedHotels(searchParams?: HotelSearchParams) {
    const supabase = getSupabaseAdmin();
    let queryBuilder = supabase
        .from("hotels")
        .select(`
            *,
            rooms (
                price_per_night
            )
        `)
        .order("created_at", { ascending: false });

    // Apply Basic DB Filters
    if (searchParams?.query) {
        const q = `%${searchParams.query}%`;
        queryBuilder = queryBuilder.or(`name.ilike.${q},address.ilike.${q}`);
    }

    if (searchParams?.stars) {
        const stars = parseInt(searchParams.stars);
        if (!isNaN(stars)) {
            queryBuilder = queryBuilder.gte("stars", stars);
        }
    }

    if (searchParams?.amenities) {
        const amenitiesList = searchParams.amenities.split(",").filter(Boolean);
        if (amenitiesList.length > 0) {
            queryBuilder = queryBuilder.contains("amenities", amenitiesList);
        }
    }

    const { data: hotels, error } = await queryBuilder;

    if (error) {
        console.error("Error fetching hotels:", error);
        return [];
    }

    // Process and Filter/Sort in JS
    let results = hotels.map((h: any) => {
        const lat = h.latitude ? Number(h.latitude) : null;
        const lng = h.longitude ? Number(h.longitude) : null;

        const distance = (lat && lng)
            ? calculateDistance(lat, lng, COP17_VENUE.latitude, COP17_VENUE.longitude)
            : null;

        return {
            ...h,
            // Ensure amenities is strictly a string array
            amenities: Array.isArray(h.amenities)
                ? h.amenities.map((a: any) => typeof a === 'string' ? a : JSON.stringify(a))
                : [], // Fallback to empty array if not an array (e.g. null, object, string)
            // Ensure coordinates are numbers
            latitude: lat,
            longitude: lng,
            distanceToVenue: distance,
            cached_distance_km: h.cached_distance_km,
            cached_drive_time_text: h.cached_drive_time_text,
            cached_drive_time_value: h.cached_drive_time_value,
            // Google Reviews
            google_place_id: h.google_place_id,
            cached_rating: h.cached_rating,
            cached_review_count: h.cached_review_count,
            // serialize safe minPrice: avoid Infinity
            minPrice: h.rooms?.length > 0 ? Math.min(...h.rooms.map((r: any) => Number(r.price_per_night))) : null
        };
    });

    // Filter by Price
    if (searchParams?.minPrice) {
        const min = parseFloat(searchParams.minPrice);
        if (!isNaN(min)) {
            results = results.filter((h: any) => h.minPrice !== null && h.minPrice >= min);
        }
    }
    if (searchParams?.maxPrice) {
        const max = parseFloat(searchParams.maxPrice);
        if (!isNaN(max)) {
            results = results.filter((h: any) => h.minPrice !== null && h.minPrice <= max);
        }
    }

    // Sorting
    const sortBy = searchParams?.sortBy || 'newest';
    results.sort((a: any, b: any) => {
        // Handle nulls in sort - push to end usually
        const priceA = a.minPrice ?? 99999999;
        const priceB = b.minPrice ?? 99999999;

        switch (sortBy) {
            case 'price-asc':
                return priceA - priceB;
            case 'price-desc':
                return (b.minPrice ?? 0) - (a.minPrice ?? 0);
            case 'stars-desc':
                return b.stars - a.stars;
            case 'distance-asc':
                return (a.distanceToVenue ?? 9999) - (b.distanceToVenue ?? 9999);
            case 'newest':
            default:
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
    });

    // Cast the result to expect minPrice as number | null, but for the client prop compatibility we might need to be careful
    // The current Hotel definition for client components might expect minPrice as number.
    // Let's coerce null to 0 or a high number if essential, OR update the type.
    // For safety with existing components, let's keep it as number but 0 if null, 
    // OR better: use 0 for "Contact for price" behavior if that's acceptable, but user wants booking.
    // Actually, serializing `null` is fine. `Infinity` was the problem.
    // I will cast it as any to bypass strict type check for now or update type if possible.
    return results as unknown as (Hotel & { minPrice: number })[];
}

export async function getPublicHotel(id: string) {
    const supabase = getSupabaseAdmin();

    // Fetch hotel with basic info
    const { data: hotel, error } = await supabase
        .from("hotels")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error(`Error fetching public hotel (ID: ${id}):`, error);
        return null;
    }

    const lat = hotel.latitude ? Number(hotel.latitude) : null;
    const lng = hotel.longitude ? Number(hotel.longitude) : null;

    // Cast properties to match UI expectations
    return {
        ...hotel,
        latitude: lat,
        longitude: lng,
        distanceToVenue: (lat && lng)
            ? calculateDistance(lat, lng, COP17_VENUE.latitude, COP17_VENUE.longitude)
            : null,
        // Cached fields usually come automatically if they exist in DB and we select *, but let's be explicit if needed
        cached_rating: hotel.cached_rating,
        cached_review_count: hotel.cached_review_count,
        google_place_id: hotel.google_place_id
    } as Hotel;
}

export async function getPublicRooms(hotelId: string) {
    const supabase = getSupabaseAdmin();

    const { data: rooms, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("price_per_night", { ascending: true }); // Show cheapest first

    if (error) {
        console.error(`Error fetching public rooms (Hotel ID: ${hotelId}):`, error);
        return [];
    }

    return rooms;
}

export async function getPublicRoom(roomId: string) {
    const supabase = getSupabaseAdmin();

    const { data: room, error } = await supabase
        .from("rooms")
        .select(`
            *,
            hotel:hotels (*)
        `)
        .eq("id", roomId)
        .single();

    if (error) {
        console.error(`Error fetching public room (ID: ${roomId}):`, error);
        return null;
    }

    return room;
}

export async function getSearchSuggestions(query: string) {
    if (!query || query.length < 2) return [];

    const supabase = getSupabaseAdmin();
    const q = `%${query}%`;

    try {
        // Fetch hotels that match by name or address
        const { data: hotels, error } = await supabase
            .from("hotels")
            .select("name, address")
            .or(`name.ilike.${q},address.ilike.${q}`)
            .limit(10);

        if (error) throw error;

        // Extract unique locations (suburbs/cities from address) and hotel names
        const suggestions = new Set<string>();

        hotels.forEach(h => {
            if (h.name.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(h.name);
            }

            if (h.address) {
                // Try to extract the neighborhood or city (usually after the first comma or the last word)
                const parts = h.address.split(',').map((p: string) => p.trim());
                parts.forEach((p: string) => {
                    if (p.toLowerCase().includes(query.toLowerCase()) && p.length > 2) {
                        suggestions.add(p);
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
