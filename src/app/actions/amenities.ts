"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAmenity(name: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Check Role (optional but recommended)
    // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    // if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return { error: "Forbidden" };

    const { data, error } = await supabase
        .from("amenities")
        .insert({ name })
        .select()
        .single();

    if (error) {
        console.error("Error creating amenity:", error);
        return { error: "Failed to create amenity" };
    }

    revalidatePath("/admin/hotels/new");
    revalidatePath("/admin/hotels/[id]/edit");
    return { data };
}
