"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const groupRequestSchema = z.object({
    organizationName: z.string().min(2, "Organization name is required"),
    contactName: z.string().min(2, "Contact name is required"),
    contactEmail: z.string().email("Invalid email address"),
    contactPhone: z.string().min(8, "Valid phone number required"),
    guestCount: z.number().min(5, "Group bookings are for 5+ guests"),
    checkIn: z.string().date(),
    checkOut: z.string().date(),
    preferredHotel: z.string().optional(),
    budgetRange: z.string().optional(), // e.g., "$100-$200 per night"
    specialRequirements: z.string().optional(),
});

export type GroupRequestState = {
    error?: string;
    success?: boolean;
    message?: string;
    fieldErrors?: {
        [key: string]: string[] | undefined;
    };
};

export async function submitGroupRequestAction(prevState: GroupRequestState, formData: FormData): Promise<GroupRequestState> {
    const validatedFields = groupRequestSchema.safeParse({
        organizationName: formData.get("organizationName"),
        contactName: formData.get("contactName"),
        contactEmail: formData.get("contactEmail"),
        contactPhone: formData.get("contactPhone"),
        guestCount: Number(formData.get("guestCount")),
        checkIn: formData.get("checkIn"),
        checkOut: formData.get("checkOut"),
        preferredHotel: formData.get("preferredHotel"),
        budgetRange: formData.get("budgetRange"),
        specialRequirements: formData.get("specialRequirements"),
    });

    if (!validatedFields.success) {
        return {
            error: "Invalid input fields. Please check your data.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const data = validatedFields.data;

    try {
        const supabase = await createClient();
        const adminSupabase = getSupabaseAdmin();

        // 1. Insert into group_requests table
        const { data: request, error: insertError } = await adminSupabase
            .from("group_requests")
            .insert({
                organization_name: data.organizationName,
                contact_name: data.contactName,
                contact_email: data.contactEmail,
                contact_phone: data.contactPhone,
                guest_count: data.guestCount,
                check_in_date: data.checkIn,
                check_out_date: data.checkOut,
                preferred_hotel: data.preferredHotel,
                budget_range: data.budgetRange,
                special_requirements: data.specialRequirements,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error("Database Insert Error:", insertError);
            throw new Error("Failed to save request to database");
        }

        // 2. Notify Admins
        // Fetch super admins or liaisons to notify
        const { data: admins } = await adminSupabase
            .from("profiles")
            .select("id")
            .in("role", ["admin", "super_admin", "liaison"])
            .limit(5);

        if (admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
                user_id: admin.id,
                title: "New Group Request",
                message: `${data.organizationName} (${data.guestCount} guests) requested dates ${data.checkIn} to ${data.checkOut}.`,
                type: "group_request",
                link: `/admin/group-requests` // We will build this page next
            }));

            await adminSupabase.from("notifications").insert(notifications);
        }

        return {
            success: true,
            message: "Group request submitted successfully. Our team will contact you shortly."
        };

    } catch (error) {
        console.error("Group Request Action Error:", error);
        return { error: "Failed to submit request. Please try again or contact support." };
    }
}
