"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function bulkBlockRooms(
    roomIds: string[],
    startDate: string,
    endDate: string,
    reason: string = "Administrative Block"
) {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    try {
        const { data: profile } = await adminClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile) return { success: false, error: "Profile not found" };

        // 1. Permission Check
        if (profile.role !== "super_admin") {
            // Verify all roomIds belong to hotels owned by the user
            const { data: ownRooms } = await adminClient
                .from("rooms")
                .select("id, hotels!inner(owner_id)")
                .in("id", roomIds)
                .eq("hotels.owner_id", user.id);

            const ownRoomIds = ownRooms?.map(r => r.id) || [];
            if (ownRoomIds.length !== roomIds.length) {
                return { success: false, error: "Unauthorized access to some rooms" };
            }
        }

        // 2. Create Block Entries
        // We create one 'booking' entry per room for the entire duration
        const blockEntries = roomIds.map(roomId => ({
            room_id: roomId,
            user_id: user.id, // The admin who blocked it
            check_in_date: startDate,
            check_out_date: endDate,
            status: "blocked",
            total_price: 0,
            special_requests: reason
        }));

        const { error } = await adminClient
            .from("bookings")
            .insert(blockEntries);

        if (error) {
            console.error("Error creating bulk blocks:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/admin/inventory");
        return { success: true };

    } catch (error) {
        console.error("Bulk block error:", error);
        return { success: false, error: "Internal server error" };
    }
}
