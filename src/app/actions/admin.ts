"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Hotel, Room } from "@/types/hotel";
import { DEFAULT_HOTEL_BOOKING_POLICY } from "@/lib/cancellation-policy";
import { parseStringArray } from "@/lib/parse-utils";
import { sanitizeRichTextToPlainText } from "@/lib/safe-rich-text";

// No re-exports here to avoid Turbopack build errors.
// Import types from @/types/hotel instead.

const hotelSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    name_en: z.string().optional(),
    description: z.string().optional(),
    description_en: z.string().optional(),
    address: z.string().optional(),
    address_en: z.string().optional(),
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
    is_official_partner: z.boolean().default(false),
    is_recommended: z.boolean().default(false),
    has_shuttle_service: z.boolean().default(false),
    check_in_time: z.string().optional(),
    check_out_time: z.string().optional(),
    latitude: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
    longitude: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
    free_cancellation_window_hours: z.preprocess(
        (val) => (val === "" || val == null ? DEFAULT_HOTEL_BOOKING_POLICY.freeCancellationWindowHours : Number(val)),
        z.number().int().min(0)
    ),
    partial_cancellation_window_hours: z.preprocess(
        (val) => (val === "" || val == null ? DEFAULT_HOTEL_BOOKING_POLICY.partialCancellationWindowHours : Number(val)),
        z.number().int().min(0)
    ),
    partial_cancellation_penalty_percent: z.preprocess(
        (val) => (val === "" || val == null ? DEFAULT_HOTEL_BOOKING_POLICY.partialCancellationPenaltyPercent : Number(val)),
        z.number().int().min(0).max(100)
    ),
    late_cancellation_penalty_percent: z.preprocess(
        (val) => (val === "" || val == null ? DEFAULT_HOTEL_BOOKING_POLICY.lateCancellationPenaltyPercent : Number(val)),
        z.number().int().min(0).max(100)
    ),
    modification_cutoff_hours: z.preprocess(
        (val) => (val === "" || val == null ? DEFAULT_HOTEL_BOOKING_POLICY.modificationCutoffHours : Number(val)),
        z.number().int().min(0)
    ),
    cancellation_policy_notes: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().max(2000).optional()
    ),
}).refine(
    (value) => value.free_cancellation_window_hours >= value.partial_cancellation_window_hours,
    {
        message: "Free cancellation window must be greater than or equal to the standard penalty window.",
        path: ["partial_cancellation_window_hours"],
    }
);

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
        name_en: formData.get("name_en"),
        description: formData.get("description"),
        description_en: formData.get("description_en"),
        address: formData.get("address"),
        address_en: formData.get("address_en"),
        stars: Number(formData.get("stars")),
        amenities: formData.get("amenities"),
        images: formData.get("images"),

        hotel_type: formData.get("hotel_type"),
        contact_phone: formData.get("contact_phone"),
        contact_email: formData.get("contact_email"),
        website: formData.get("website"),
        is_official_partner: formData.get("is_official_partner") === "on",
        is_recommended: formData.get("is_recommended") === "on",
        has_shuttle_service: formData.get("has_shuttle_service") === "on",
        check_in_time: formData.get("check_in_time"),
        check_out_time: formData.get("check_out_time"),
        latitude: formData.get("latitude") ? Number(formData.get("latitude")) : undefined,
        longitude: formData.get("longitude") ? Number(formData.get("longitude")) : undefined,
        free_cancellation_window_hours: formData.get("free_cancellation_window_hours"),
        partial_cancellation_window_hours: formData.get("partial_cancellation_window_hours"),
        partial_cancellation_penalty_percent: formData.get("partial_cancellation_penalty_percent"),
        late_cancellation_penalty_percent: formData.get("late_cancellation_penalty_percent"),
        modification_cutoff_hours: formData.get("modification_cutoff_hours"),
        cancellation_policy_notes: formData.get("cancellation_policy_notes"),
    };

    const validatedFields = hotelSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            error: "Validation Error",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const data = validatedFields.data;

    const amenitiesArray = parseStringArray(data.amenities);
    const imagesArray = parseStringArray(data.images);
    const cleanedDescription = sanitizeRichTextToPlainText(data.description);
    const cleanedDescriptionEn = sanitizeRichTextToPlainText(data.description_en);

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

    const { data: createdHotel, error } = await supabase.from("hotels").insert({
        owner_id: user.id,
        name: data.name,
        name_en: data.name_en || null,
        description: cleanedDescription || null,
        description_en: cleanedDescriptionEn || null,
        address: data.address,
        address_en: data.address_en || null,
        stars: data.stars,
        amenities: amenitiesArray,
        images: imagesArray,

        hotel_type: data.hotel_type,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email || null, // transform empty string to null
        website: data.website || null,
        is_official_partner: data.is_official_partner,
        is_recommended: data.is_recommended,
        has_shuttle_service: data.has_shuttle_service,
        check_in_time: data.check_in_time,
        check_out_time: data.check_out_time,
        latitude: data.latitude,
        longitude: data.longitude,
        free_cancellation_window_hours: data.free_cancellation_window_hours,
        partial_cancellation_window_hours: data.partial_cancellation_window_hours,
        partial_cancellation_penalty_percent: data.partial_cancellation_penalty_percent,
        late_cancellation_penalty_percent: data.late_cancellation_penalty_percent,
        modification_cutoff_hours: data.modification_cutoff_hours,
        cancellation_policy_notes: data.cancellation_policy_notes || null,
        ...cachedData
    }).select("id").maybeSingle();

    if (error) {
        console.error("Error creating hotel:", error);
        return { error: error.message || "Failed to create hotel" };
    }

    revalidatePath("/admin/hotels", "page");
    revalidatePath("/", "page");
    revalidatePath("/hotels", "page");
    if (createdHotel?.id) {
        revalidatePath(`/hotels/${createdHotel.id}`, "page");
        revalidatePath(`/hotels/${createdHotel.id}/checkout`, "page");
    }
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

export async function submitDeleteHotel(id: string): Promise<void> {
    await deleteHotel(id);
}

export async function updateHotelPublishedStatus(id: string, isPublished: boolean) {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile) return { error: "Profile not found" };

    let query = supabase
        .from("hotels")
        .update({ is_published: isPublished })
        .eq("id", id);

    if (profile.role !== "super_admin") {
        query = query.eq("owner_id", user.id);
    }

    const { error } = await query;

    if (error) {
        console.error("Error updating hotel published status:", error);
        return { error: "Failed to update hotel status" };
    }

    revalidatePath("/admin/hotels", "page");
    revalidatePath("/", "page");
    revalidatePath("/hotels", "page");
    (revalidateTag as any)("hotels");

    return { success: true };
}

export async function bulkUpdateHotelPublishedStatus(ids: string[], isPublished: boolean) {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    if (!Array.isArray(ids) || ids.length === 0) {
        return { error: "No hotels selected" };
    }

    const normalizedIds = Array.from(new Set(ids.filter(Boolean)));

    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile) return { error: "Profile not found" };

    let allowedIds = normalizedIds;

    if (profile.role !== "super_admin") {
        const { data: ownedHotels } = await adminClient
            .from("hotels")
            .select("id")
            .in("id", normalizedIds)
            .eq("owner_id", user.id);

        allowedIds = (ownedHotels || []).map((hotel) => hotel.id);
    }

    if (allowedIds.length === 0) {
        return { error: "No authorized hotels selected" };
    }

    const { error } = await adminClient
        .from("hotels")
        .update({ is_published: isPublished })
        .in("id", allowedIds);

    if (error) {
        console.error("Error bulk updating hotel published status:", error);
        return { error: "Failed to update selected hotels" };
    }

    revalidatePath("/admin/hotels", "page");
    revalidatePath("/", "page");
    revalidatePath("/hotels", "page");
    revalidateTag("hotels", "max");

    return { success: true, updatedCount: allowedIds.length };
}

export async function getHotel(id: string) {
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
        name_en: formData.get("name_en"),
        description: formData.get("description"),
        description_en: formData.get("description_en"),
        address: formData.get("address"),
        address_en: formData.get("address_en"),
        stars: Number(formData.get("stars")),
        amenities: formData.get("amenities"),
        images: formData.get("images"),

        hotel_type: formData.get("hotel_type"),
        contact_phone: formData.get("contact_phone"),
        contact_email: formData.get("contact_email"),
        website: formData.get("website"),
        is_official_partner: formData.get("is_official_partner") === "on",
        is_recommended: formData.get("is_recommended") === "on",
        has_shuttle_service: formData.get("has_shuttle_service") === "on",
        check_in_time: formData.get("check_in_time"),
        check_out_time: formData.get("check_out_time"),
        latitude: formData.get("latitude") ? Number(formData.get("latitude")) : undefined,
        longitude: formData.get("longitude") ? Number(formData.get("longitude")) : undefined,
        free_cancellation_window_hours: formData.get("free_cancellation_window_hours"),
        partial_cancellation_window_hours: formData.get("partial_cancellation_window_hours"),
        partial_cancellation_penalty_percent: formData.get("partial_cancellation_penalty_percent"),
        late_cancellation_penalty_percent: formData.get("late_cancellation_penalty_percent"),
        modification_cutoff_hours: formData.get("modification_cutoff_hours"),
        cancellation_policy_notes: formData.get("cancellation_policy_notes"),
    };

    const validatedFields = hotelSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            error: "Validation Error",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const data = validatedFields.data;

    const amenitiesArray = parseStringArray(data.amenities);
    const imagesArray = parseStringArray(data.images);
    const cleanedDescription = sanitizeRichTextToPlainText(data.description);
    const cleanedDescriptionEn = sanitizeRichTextToPlainText(data.description_en);

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
        name_en: data.name_en || null,
        description: cleanedDescription || null,
        description_en: cleanedDescriptionEn || null,
        address: data.address,
        address_en: data.address_en || null,
        stars: data.stars,
        amenities: amenitiesArray,
        images: imagesArray,

        hotel_type: data.hotel_type,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email || null,
        website: data.website || null,
        is_official_partner: data.is_official_partner,
        is_recommended: data.is_recommended,
        has_shuttle_service: data.has_shuttle_service,
        check_in_time: data.check_in_time,
        check_out_time: data.check_out_time,
        latitude: data.latitude,
        longitude: data.longitude,
        free_cancellation_window_hours: data.free_cancellation_window_hours,
        partial_cancellation_window_hours: data.partial_cancellation_window_hours,
        partial_cancellation_penalty_percent: data.partial_cancellation_penalty_percent,
        late_cancellation_penalty_percent: data.late_cancellation_penalty_percent,
        modification_cutoff_hours: data.modification_cutoff_hours,
        cancellation_policy_notes: data.cancellation_policy_notes || null,
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
    revalidatePath(`/admin/hotels/${id}`, "page");
    revalidatePath("/", "page");
    revalidatePath("/hotels", "page");
    revalidatePath(`/hotels/${id}`, "page");
    revalidatePath(`/hotels/${id}/checkout`, "page");
    (revalidateTag as any)("hotels");
    redirect("/admin/hotels");
}



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

const roomQuickUpdateSchema = z.object({
    price_per_night: z.preprocess((value) => Number(value), z.number().min(0)),
    capacity: z.preprocess((value) => Number(value), z.number().min(1)),
    total_inventory: z.preprocess((value) => Number(value), z.number().min(0)),
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

    const amenitiesArray = parseStringArray(amenities);
    const imagesArray = parseStringArray(images);
    const cleanedDescription = sanitizeRichTextToPlainText(description);

    const { error } = await supabase.from("rooms").insert({
        hotel_id: hotelId,
        name,
        description: cleanedDescription || null,
        type,
        price_per_night,
        capacity,
        total_inventory,
        amenities: amenitiesArray,
        images: imagesArray,
        is_active: true
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
    const adminClient = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Check role
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
        return { error: "Unauthorized: insufficient permissions" };
    }

    // If not super_admin, verify room belongs to a hotel the user owns
    if (profile.role !== "super_admin") {
        const { data: room } = await adminClient
            .from("rooms")
            .select("hotel_id, hotel:hotels(owner_id)")
            .eq("id", roomId)
            .single();

        const hotel = Array.isArray(room?.hotel) ? room.hotel[0] : room?.hotel;
        if (!hotel || hotel.owner_id !== user.id) {
            return { error: "Unauthorized: you do not own this hotel" };
        }
    }

    const { error } = await adminClient.from("rooms").delete().eq("id", roomId);
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

    const amenitiesArray = parseStringArray(amenities);
    const imagesArray = parseStringArray(images);
    const cleanedDescription = sanitizeRichTextToPlainText(description);

    const { error } = await supabase
        .from("rooms")
        .update({
            name,
            description: cleanedDescription || null,
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

export async function quickUpdateRoom(roomId: string, hotelId: string, formData: FormData) {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const validated = roomQuickUpdateSchema.safeParse({
        price_per_night: formData.get("price_per_night"),
        capacity: formData.get("capacity"),
        total_inventory: formData.get("total_inventory"),
    });

    if (!validated.success) {
        return { error: "Invalid room values" };
    }

    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
        return { error: "Unauthorized: insufficient permissions" };
    }

    if (profile.role !== "super_admin") {
        const { data: room } = await adminClient
            .from("rooms")
            .select("hotel_id, hotel:hotels(owner_id)")
            .eq("id", roomId)
            .single();

        const hotel = Array.isArray(room?.hotel) ? room.hotel[0] : room?.hotel;
        if (!hotel || hotel.owner_id !== user.id) {
            return { error: "Unauthorized: you do not own this hotel" };
        }
    }

    const { error } = await adminClient
        .from("rooms")
        .update(validated.data)
        .eq("id", roomId)
        .eq("hotel_id", hotelId);

    if (error) {
        console.error("Error quick updating room:", error);
        return { error: "Failed to update room" };
    }

    revalidatePath(`/admin/hotels/${hotelId}`);
    revalidatePath(`/hotels/${hotelId}`);
    revalidatePath(`/hotels/${hotelId}/checkout`);
    return { success: true };
}

export async function updateRoomActiveStatus(roomId: string, hotelId: string, isActive: boolean) {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
        return { error: "Unauthorized: insufficient permissions" };
    }

    if (profile.role !== "super_admin") {
        const { data: room } = await adminClient
            .from("rooms")
            .select("hotel_id, hotel:hotels(owner_id)")
            .eq("id", roomId)
            .single();

        const hotel = Array.isArray(room?.hotel) ? room.hotel[0] : room?.hotel;
        if (!hotel || hotel.owner_id !== user.id) {
            return { error: "Unauthorized: you do not own this hotel" };
        }
    }

    const { error } = await adminClient
        .from("rooms")
        .update({ is_active: isActive })
        .eq("id", roomId)
        .eq("hotel_id", hotelId);

    if (error) {
        console.error("Error updating room active status:", error);
        return { error: "Failed to update room status" };
    }

    revalidatePath(`/admin/hotels/${hotelId}`);
    revalidatePath(`/hotels/${hotelId}`);
    revalidatePath(`/hotels/${hotelId}/checkout`);
    (revalidateTag as any)("hotels");
    return { success: true };
}
