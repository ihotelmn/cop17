"use server";

import { createClient } from "@/lib/supabase/server";

export type Hotel = {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    stars: number;
    amenities: string[] | null;
    images: string[] | null;
    created_at: string;
    latitude?: number | null; // Added
    longitude?: number | null; // Added
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
    const supabase = await createClient();
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
        minPrice: h.rooms?.length > 0 ? Math.min(...h.rooms.map((r: any) => Number(r.price_per_night))) : Infinity
    }));

    // Filter by Price
    if (searchParams?.minPrice) {
        const min = parseFloat(searchParams.minPrice);
        if (!isNaN(min)) {
            results = results.filter((h: any) => h.minPrice >= min);
        }
    }
    if (searchParams?.maxPrice) {
        const max = parseFloat(searchParams.maxPrice);
        if (!isNaN(max)) {
            results = results.filter((h: any) => h.minPrice !== Infinity && h.minPrice <= max);
        }
    }

    // Sorting
    const sortBy = searchParams?.sortBy || 'newest';
    results.sort((a: any, b: any) => {
        switch (sortBy) {
            case 'price-asc':
                return (a.minPrice || 0) - (b.minPrice || 0);
            case 'price-desc':
                return (b.minPrice || 0) - (a.minPrice || 0);
            case 'stars-desc':
                return b.stars - a.stars;
            case 'newest':
            default:
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
    });

    return results as (Hotel & { minPrice: number })[];
}
