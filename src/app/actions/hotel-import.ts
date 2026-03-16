"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { buildHotelImportDraft, hotelImportDraftSchema, importImageAssetSchema } from "@/lib/hotel-import-assistant";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type HotelImportGenerateState = {
    error?: string;
    draft?: unknown;
};

type HotelImportApplyState = {
    error?: string;
};

export async function generateHotelImportDraftAction(
    _prevState: HotelImportGenerateState,
    formData: FormData
): Promise<HotelImportGenerateState> {
    const access = await requireHotelImportAccess();
    if (!access.ok) {
        return { error: access.error };
    }

    const rawSource = String(formData.get("raw_source") || "").trim();
    const website = String(formData.get("website") || "").trim();
    const rawImages = String(formData.get("images") || "[]");

    if (!rawSource && rawImages === "[]") {
        return { error: "Paste hotel data or upload images first." };
    }

    try {
        const parsedImages = parseImportImages(rawImages);
        const draft = await buildHotelImportDraft({
            rawSource,
            websiteUrl: website,
            images: parsedImages,
        });

        return { draft };
    } catch (error) {
        console.error("Error generating hotel import draft:", error);
        return { error: "The import assistant could not read that package. Check the pasted data format and try again." };
    }
}

export async function applyHotelImportDraftAction(
    _prevState: HotelImportApplyState,
    formData: FormData
): Promise<HotelImportApplyState> {
    const access = await requireHotelImportAccess();
    if (!access.ok) {
        return { error: access.error };
    }

    const rawDraft = String(formData.get("draft") || "");
    if (!rawDraft) {
        return { error: "No import draft was provided." };
    }

    let draft;
    try {
        draft = hotelImportDraftSchema.parse(JSON.parse(rawDraft));
    } catch {
        return { error: "The import draft is invalid or expired. Generate it again and retry." };
    }

    const adminClient = getSupabaseAdmin();
    const hotelPayload = {
        owner_id: access.userId,
        name: draft.name,
        name_en: normalizeOptionalString(draft.name_en),
        description: normalizeOptionalString(draft.description),
        description_en: normalizeOptionalString(draft.description_en),
        address: normalizeOptionalString(draft.address),
        address_en: normalizeOptionalString(draft.address_en),
        stars: draft.stars,
        amenities: draft.amenities,
        images: draft.images.map((image) => image.url),
        hotel_type: normalizeOptionalString(draft.hotel_type) || "Hotel",
        contact_phone: normalizeOptionalString(draft.contact_phone),
        contact_email: normalizeEmail(draft.contact_email),
        website: normalizeUrl(draft.website),
        check_in_time: normalizeOptionalString(draft.check_in_time),
        check_out_time: normalizeOptionalString(draft.check_out_time),
        is_official_partner: draft.is_official_partner,
        is_recommended: draft.is_recommended,
        has_shuttle_service: draft.has_shuttle_service,
        is_published: false,
    };

    const { data: createdHotel, error: hotelError } = await adminClient
        .from("hotels")
        .insert(hotelPayload)
        .select("id")
        .single();

    if (hotelError || !createdHotel) {
        console.error("Error creating imported hotel draft:", hotelError);
        return { error: "The hotel draft could not be created. Please try again." };
    }

    const roomPayload = draft.rooms
        .filter((room) => normalizeOptionalString(room.name))
        .map((room) => ({
            hotel_id: createdHotel.id,
            name: room.name,
            description: normalizeOptionalString(room.description),
            type: normalizeOptionalString(room.type) || "Room",
            price_per_night: room.price_per_night,
            capacity: room.capacity,
            total_inventory: room.total_inventory,
            amenities: room.amenities,
            images: room.images.map((image) => image.url),
        }));

    if (roomPayload.length) {
        const { error: roomError } = await adminClient.from("rooms").insert(roomPayload);
        if (roomError) {
            console.error("Error creating imported room drafts:", roomError);
            await adminClient.from("hotels").delete().eq("id", createdHotel.id);
            return { error: "The hotel was parsed, but its room drafts could not be created. No changes were saved." };
        }
    }

    revalidatePath("/admin/hotels", "page");
    revalidatePath(`/admin/hotels/${createdHotel.id}`, "page");
    revalidatePath(`/admin/hotels/${createdHotel.id}/edit`, "page");
    revalidatePath("/", "page");
    revalidatePath("/hotels", "page");
    revalidatePath(`/hotels/${createdHotel.id}`, "page");
    revalidateTag("hotels", "max");

    redirect(`/admin/hotels/${createdHotel.id}/edit`);
}

async function requireHotelImportAccess(): Promise<
    | { ok: true; userId: string }
    | { ok: false; error: string }
> {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { ok: false, error: "Unauthorized" };
    }

    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
        return { ok: false, error: "Only admins can use the hotel import assistant." };
    }

    return { ok: true, userId: user.id };
}

function parseImportImages(rawImages: string) {
    const parsed = JSON.parse(rawImages);
    return importImageAssetSchema.array().parse(parsed);
}

function normalizeOptionalString(value: string | null | undefined) {
    const normalized = String(value || "").trim();
    return normalized || null;
}

function normalizeEmail(value: string | null | undefined) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function normalizeUrl(value: string | null | undefined) {
    const normalized = String(value || "").trim();
    if (!normalized) return null;

    try {
        return new URL(normalized).toString();
    } catch {
        return null;
    }
}
