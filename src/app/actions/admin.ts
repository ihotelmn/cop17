"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const hotelSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    address: z.string().optional(),
    stars: z.preprocess((val) => Number(val), z.number().min(1).max(5).default(5)),
    amenities: z.string().optional(),
    images: z.string().optional(),

    // New Fields
    hotel_type: z.string().default('Hotel'),
    contact_phone: z.string().optional(),
    contact_email: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().email("Invalid email address").optional()
    ),
    website: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().url("Invalid website URL").optional()
    ),
    check_in_time: z.string().optional(),
    check_out_time: z.string().optional(),
    latitude: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
    longitude: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
});

export type Hotel = {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    stars: number;
    amenities: string[] | null;
    images: string[] | null;
    created_at: string;
    // New fields
    hotel_type: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    website: string | null;
    check_in_time: string | null;
    check_out_time: string | null;
    latitude: number | null;
    longitude: number | null;
    // Cached Distance
    cached_distance_km: number | null;
    cached_drive_time_text: string | null;
    cached_drive_time_value: number | null;
    cached_walk_time_text: string | null;
    cached_walk_time_value: number | null;
    // Google Reviews
    google_place_id: string | null;
    cached_rating: number | null;
    cached_review_count: number | null;
};

export async function getHotels() {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get User Role via Admin Client to bypass RLS
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile) return [];

    let query = adminClient
        .from("hotels")
        .select("*");

    // If NOT super_admin, only show own hotels
    if (profile.role !== "super_admin") {
        query = query.eq("owner_id", user.id);
    }

    const { data: hotels, error } = await query.order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching hotels (Admin Client):", error);
        return [];
    }

    console.log(`[getHotels] Found ${hotels?.length || 0} hotels for user ${user.id} (${profile.role})`);
    return hotels as Hotel[];
}

import { COP17_VENUE } from "@/lib/venue";

async function fetchGoogleDistance(lat: number, lng: number) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
        const origin = `${COP17_VENUE.latitude},${COP17_VENUE.longitude}`;
        const destination = `${lat},${lng}`;

        // Use Google Maps Distance Matrix API (REST)
        // Note: Server-side calls need the API key to be unrestricted or restricted to IP (not referrer)
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
            const result = data.rows[0].elements[0];
            return {
                distance_km: result.distance?.value ? result.distance.value / 1000 : null,
                drive_time_text: result.duration?.text || null,
                drive_time_value: result.duration?.value || null,
                // For walking, we could make another call, but let's just stick to driving for now or mock walking based on speed
            };
        }
    } catch (error) {
        console.error("Error fetching Google Distance:", error);
    }
    return null;
}

async function fetchGooglePlaceDetails(name: string, lat: number, lng: number) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    // Skip for test hotels
    if (name.toLowerCase().includes('test')) {
        return {
            google_place_id: null,
            cached_rating: null,
            cached_review_count: null
        };
    }

    try {
        // Find Place ID using Find Place API with location bias AND explicit city to restrict results
        const searchQuery = `${name}, Ulaanbaatar, Mongolia`;
        // Added 'name' field to verify matching
        const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,rating,user_ratings_total,name&locationbias=circle:2000@${lat},${lng}&key=${apiKey}`;

        const response = await fetch(findUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];

            // verify the name is somewhat similar (basic check)
            // If we searched for "Shangri-La" and got "Test Shop", skip it.
            const candidateName = candidate.name.toLowerCase();
            const inputName = name.toLowerCase();

            // Simple check: candidate name should contain part of our name or vice versa
            // This prevents "Test hotel" from matching unrelated nearby businesses
            if (!candidateName.includes(inputName) && !inputName.includes(candidateName)) {
                console.warn(`[GooglePlaces] Match rejected: expected "${name}", found "${candidate.name}"`);
                return null;
            }

            return {
                google_place_id: candidate.place_id,
                cached_rating: candidate.rating || null,
                cached_review_count: candidate.user_ratings_total || null
            };
        }
    } catch (error) {
        console.error("Error fetching Google Place Details:", error);
    }
    return null;
}

export async function createHotel(prevState: any, formData: FormData) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Unauthorized" };
    }

    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        address: formData.get("address"),
        stars: Number(formData.get("stars")),
        amenities: formData.get("amenities"),
        images: formData.get("images"),

        hotel_type: formData.get("hotel_type"),
        contact_phone: formData.get("contact_phone"),
        contact_email: formData.get("contact_email"),
        website: formData.get("website"),
        check_in_time: formData.get("check_in_time"),
        check_out_time: formData.get("check_out_time"),
        latitude: formData.get("latitude") ? Number(formData.get("latitude")) : undefined,
        longitude: formData.get("longitude") ? Number(formData.get("longitude")) : undefined,
    };

    const validatedFields = hotelSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            error: "Validation Error",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const data = validatedFields.data;

    // Process arrays (handle JSON string or comma-separated)
    const parseArray = (input: string | undefined): string[] => {
        if (!input) return [];
        try {
            // Try parsing as JSON array first (e.g. from hidden input set by JS)
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) return parsed;
        } catch { }
        // Fallback to comma separation
        return input.split(",").map((s) => s.trim()).filter(Boolean);
    };

    const amenitiesArray = parseArray(data.amenities);
    const imagesArray = parseArray(data.images);

    // Calculate Distance if location is provided
    let cachedData = {};
    if (data.latitude && data.longitude) {
        const googleData = await fetchGoogleDistance(data.latitude, data.longitude);
        if (googleData) {
            cachedData = {
                ...cachedData,
                cached_distance_km: googleData.distance_km,
                cached_drive_time_text: googleData.drive_time_text,
                cached_drive_time_value: googleData.drive_time_value,
            };
        }
    }

    // Fetch Google Reviews if location and name provided
    if (data.name && data.latitude && data.longitude) {
        const placeData = await fetchGooglePlaceDetails(data.name, data.latitude, data.longitude);
        if (placeData) {
            cachedData = {
                ...cachedData,
                google_place_id: placeData.google_place_id,
                cached_rating: placeData.cached_rating,
                cached_review_count: placeData.cached_review_count
            };
        }
    }

    const { error } = await supabase.from("hotels").insert({
        owner_id: user.id,
        name: data.name,
        description: data.description,
        address: data.address,
        stars: data.stars,
        amenities: amenitiesArray,
        images: imagesArray,

        hotel_type: data.hotel_type,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email || null, // transform empty string to null
        website: data.website || null,
        check_in_time: data.check_in_time,
        check_out_time: data.check_out_time,
        latitude: data.latitude,
        longitude: data.longitude,
        ...cachedData
    });

    if (error) {
        console.error("Error creating hotel:", error);
        return { error: error.message || "Failed to create hotel" };
    }

    revalidatePath("/admin/hotels", "page");
    (revalidateTag as any)("hotels");
    redirect("/admin/hotels");
}

export async function deleteHotel(id: string) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Get User Role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile) return { error: "Profile not found" };

    let query = supabase.from("hotels").delete().eq("id", id);

    // If NOT super_admin, enforce ownership
    if (profile.role !== "super_admin") {
        query = query.eq("owner_id", user.id);
    }

    const { error } = await query;

    if (error) {
        console.error("Error deleting hotel:", error);
        return { error: "Failed to delete hotel (or access denied)" };
    }

    revalidatePath("/admin/hotels", "page");
    (revalidateTag as any)("hotels");
}

export async function getHotel(id: string) {
    console.log("getHotel called with ID:", id);
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    // Check if user is super admin
    if (profile?.role === "super_admin") {
        const { data: hotel, error } = await adminClient.from("hotels").select("*").eq("id", id).single();
        if (error) {
            console.error(`Error fetching hotel (ID: ${id}) via Admin Client:`, error);
            return null;
        }
        return hotel as Hotel;
    }

    // Normal User (Tour Company): Enforce ownership
    const { data: hotel, error } = await adminClient
        .from("hotels")
        .select("*")
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

    if (error) {
        console.error(`Error fetching owned hotel (ID: ${id}) via Admin Client:`, error);
        return null;
    }

    return hotel as Hotel;
}

export async function updateHotel(id: string, prevState: any, formData: FormData) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        address: formData.get("address"),
        stars: Number(formData.get("stars")),
        amenities: formData.get("amenities"),
        images: formData.get("images"),

        hotel_type: formData.get("hotel_type"),
        contact_phone: formData.get("contact_phone"),
        contact_email: formData.get("contact_email"),
        website: formData.get("website"),
        check_in_time: formData.get("check_in_time"),
        check_out_time: formData.get("check_out_time"),
        latitude: formData.get("latitude") ? Number(formData.get("latitude")) : undefined,
        longitude: formData.get("longitude") ? Number(formData.get("longitude")) : undefined,
    };

    const validatedFields = hotelSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            error: "Validation Error",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const data = validatedFields.data;

    // Process arrays
    const parseArray = (input: string | undefined): string[] => {
        if (!input) return [];
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) return parsed;
        } catch { }
        return input.split(",").map((s) => s.trim()).filter(Boolean);
    };

    const amenitiesArray = parseArray(data.amenities);
    const imagesArray = parseArray(data.images);

    // Retrieve old hotel data to see if location changed
    // OR just always update if location is provided (simplest)
    let cachedData = {};
    if (data.latitude && data.longitude) {
        // Optimization: We could check if lat/rest didn't change, but for now recalculating on edit is safe enough
        // to ensure accuracy.
        const googleData = await fetchGoogleDistance(data.latitude, data.longitude);
        if (googleData) {
            cachedData = {
                ...cachedData,
                cached_distance_km: googleData.distance_km,
                cached_drive_time_text: googleData.drive_time_text,
                cached_drive_time_value: googleData.drive_time_value,
            };
        }

        // Fetch new Reviews Data on update
        if (data.name) {
            const placeData = await fetchGooglePlaceDetails(data.name, data.latitude, data.longitude);
            if (placeData) {
                cachedData = {
                    ...cachedData,
                    google_place_id: placeData.google_place_id,
                    cached_rating: placeData.cached_rating,
                    cached_review_count: placeData.cached_review_count
                };
            }
        }
    }

    // Check Role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

    let query = supabase.from("hotels").update({
        name: data.name,
        description: data.description,
        address: data.address,
        stars: data.stars,
        amenities: amenitiesArray,
        images: imagesArray,

        hotel_type: data.hotel_type,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email || null,
        website: data.website || null,
        check_in_time: data.check_in_time,
        check_out_time: data.check_out_time,
        latitude: data.latitude,
        longitude: data.longitude,
        ...cachedData
    }).eq("id", id);

    // Enforce ownership for non-super admins
    if (profile?.role !== "super_admin") {
        query = query.eq("owner_id", user.id);
    }

    const { error } = await query;

    if (error) {
        console.error("Error updating hotel:", error);
        return { error: `Failed to update hotel: ${error.message} (Code: ${error.code})` };
    }

    revalidatePath("/admin/hotels", "page");
    (revalidateTag as any)("hotels");
    redirect("/admin/hotels");
}

export type Room = {
    id: string;
    hotel_id: string;
    name: string;
    description: string | null;
    type: string;
    price_per_night: number;
    capacity: number;
    total_inventory: number;
    amenities: string[] | null;
    images: string[] | null;
    created_at: string;
};

const roomSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    type: z.string().min(1),
    price_per_night: z.number().min(0),
    capacity: z.number().min(1).default(2),
    total_inventory: z.number().min(0).default(0),
    amenities: z.string().optional(),
    images: z.string().optional(),
});

export async function getRooms(hotelId: string) {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();

    // Auth & Permission Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).single();

    if (profile?.role !== "super_admin") {
        // Verify user owns the hotel via Admin Client (bypass RLS if needed)
        const { count } = await adminClient
            .from("hotels")
            .select("id", { count: "exact", head: true })
            .eq("id", hotelId)
            .eq("owner_id", user.id);

        if (!count) {
            console.error(`Unauthorized access to rooms for hotel ${hotelId} by user ${user.id}`);
            return [];
        }
    }

    const { data: rooms, error } = await adminClient
        .from("rooms")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching rooms (Admin Client):", error);
        return [];
    }
    return rooms as Room[];
}

export async function createRoom(hotelId: string, prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        type: formData.get("type"),
        price_per_night: Number(formData.get("price_per_night")),
        capacity: Number(formData.get("capacity")),
        total_inventory: Number(formData.get("total_inventory")),
        amenities: formData.get("amenities"),
        images: formData.get("images"),
    };

    const validated = roomSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: "Validation Error", fieldErrors: validated.error.flatten().fieldErrors };
    }

    const { name, description, type, price_per_night, capacity, total_inventory, amenities, images } = validated.data;

    // Helper to parse JSON or comma-separated string
    const parseArray = (input: string | undefined): string[] => {
        if (!input) return [];
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) return parsed;
        } catch { }
        return input.split(",").map((s) => s.trim()).filter(Boolean);
    };

    const amenitiesArray = parseArray(amenities);
    const imagesArray = parseArray(images);

    const { error } = await supabase.from("rooms").insert({
        hotel_id: hotelId,
        name,
        description,
        type,
        price_per_night,
        capacity,
        total_inventory,
        amenities: amenitiesArray,
        images: imagesArray
    });

    if (error) {
        console.error("Error creating room:", error);
        return { error: "Failed to create room" };
    }

    revalidatePath(`/admin/hotels/${hotelId}`);
    redirect(`/admin/hotels/${hotelId}`); // Redirects to Hotel Details page (which lists rooms)
}

export async function deleteRoom(roomId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) {
        console.error("Error deleting room:", error);
        return { error: "Failed to delete room" };
    }
    revalidatePath("/admin/hotels");
}
export async function getRoom(roomId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();
    if (error) return null;
    return data;
}

export async function updateRoom(hotelId: string, roomId: string, prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        type: formData.get("type"),
        price_per_night: Number(formData.get("price_per_night")),
        capacity: Number(formData.get("capacity")),
        total_inventory: Number(formData.get("total_inventory")),
        amenities: formData.get("amenities"),
        images: formData.get("images"),
    };

    const validated = roomSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: "Validation Error", fieldErrors: validated.error.flatten().fieldErrors };
    }

    const { name, description, type, price_per_night, capacity, total_inventory, amenities, images } = validated.data;

    const parseArray = (input: string | undefined): string[] => {
        if (!input) return [];
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) return parsed;
        } catch { }
        return input.split(",").map((s) => s.trim()).filter(Boolean);
    };

    const amenitiesArray = parseArray(amenities);
    const imagesArray = parseArray(images);

    const { error } = await supabase
        .from("rooms")
        .update({
            name,
            description,
            type,
            price_per_night,
            capacity,
            total_inventory,
            amenities: amenitiesArray,
            images: imagesArray
        })
        .eq("id", roomId);

    if (error) {
        console.error("Error updating room:", error);
        return { error: "Failed to update room" };
    }

    revalidatePath(`/admin/hotels/${hotelId}`);
    redirect(`/admin/hotels/${hotelId}`);
}
