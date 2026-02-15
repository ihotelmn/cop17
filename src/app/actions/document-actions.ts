"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function registerDocumentAction(data: {
    bookingId: string;
    type: string;
    filePath: string;
    guestId?: string;
}) {
    const adminSupabase = getSupabaseAdmin();

    try {
        const { error } = await adminSupabase
            .from("documents")
            .insert({
                booking_id: data.bookingId,
                type: data.type,
                file_path: data.filePath,
                guest_id: data.guestId,
                status: 'pending'
            });

        if (error) throw error;

        revalidatePath(`/my-bookings/${data.bookingId}/accreditation`);
        return { success: true };
    } catch (error) {
        console.error("Register Document Error:", error);
        return { error: "Failed to register document" };
    }
}

export async function verifyDocumentAction(documentId: string, status: 'verified' | 'rejected', notes?: string) {
    const adminSupabase = getSupabaseAdmin();
    const { data: { user } } = await (await createClient()).auth.getUser();

    if (!user) throw new Error("Unauthorized");

    try {
        const { error } = await adminSupabase
            .from("documents")
            .update({
                status,
                notes,
                verified_at: new Date().toISOString(),
                verified_by: user.id
            })
            .eq("id", documentId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error("Verify Document Error:", error);
        return { error: "Failed to verify document" };
    }
}

export async function getDocumentsByBookingAction(bookingId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("booking_id", bookingId);

    if (error) {
        console.error("Get Documents Error:", error);
        return [];
    }

    return data;
}
