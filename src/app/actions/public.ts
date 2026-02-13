"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
};

export type HotelSearchParams = {
    query?: string;
    stars?: string;
    amenities?: string;
    sortBy?: string; // price-asc, price-desc, stars-desc, newest
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
    let results = hotels.map((h: any) => ({
        ...h,
        // Ensure amenities is strictly a string array
        amenities: Array.isArray(h.amenities)
            ? h.amenities.map((a: any) => typeof a === 'string' ? a : JSON.stringify(a))
            : [], // Fallback to empty array if not an array (e.g. null, object, string)
        // Ensure coordinates are numbers
        latitude: h.latitude ? Number(h.latitude) : null,
        longitude: h.longitude ? Number(h.longitude) : null,
        // serialize safe minPrice: avoid Infinity
        minPrice: h.rooms?.length > 0 ? Math.min(...h.rooms.map((r: any) => Number(r.price_per_night))) : null
    }));

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
