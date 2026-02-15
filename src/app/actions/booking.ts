"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { sendBookingConfirmation } from "@/lib/email";
import { encrypt } from "@/lib/encryption";
import { GolomtService } from "@/lib/golomt";

// Validation Schema
const bookingSchema = z.object({
    roomId: z.string().min(1, "Room ID required"),
    hotelId: z.string().min(1, "Hotel ID required"),
    checkIn: z.string().date(),
    checkOut: z.string().date(),
    guestPassport: z.string().min(5, "Passport number required"),
    guestPhone: z.string().min(8, "Valid phone number required"),
    specialRequests: z.string().nullable().optional(),
});

export type BookingState = {
    error?: string;
    success?: boolean;
    message?: string;
    paymentRedirectUrl?: string;
    fieldErrors?: {
        [key: string]: string[] | undefined;
    };
};

export async function createBookingAction(prevState: BookingState, formData: FormData): Promise<BookingState> {
    const supabase = await createClient();

    // Validate Input
    const validatedFields = bookingSchema.safeParse({
        roomId: formData.get("roomId"),
        hotelId: formData.get("hotelId"),
        checkIn: formData.get("checkIn"),
        checkOut: formData.get("checkOut"),
        guestPassport: formData.get("guestPassport"),
        guestPhone: formData.get("guestPhone"),
        specialRequests: formData.get("specialRequests"),
    });

    if (!validatedFields.success) {
        return {
            error: "Invalid input fields. Please check your data.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { roomId, hotelId, checkIn, checkOut, guestPassport, guestPhone, specialRequests } = validatedFields.data;

    try {
        // 1. Check Inventory Availability
        // Get Room Details for Price and Total Inventory
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("price_per_night, total_inventory")
            .eq("id", roomId)
            .single();

        if (roomError || !room) {
            return { error: "Room not found." };
        }

        // Count existing bookings for this room type in the date range
        // Logic: (start1 < end2) AND (end1 > start2) for overlap
        const { count, error: countError } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("room_id", roomId)
            .neq("status", "cancelled")
            .lt("check_in_date", checkOut)
            .gt("check_out_date", checkIn);

        if (countError) {
            console.error("Availability Check Error:", countError);
            return { error: "System error checking availability." };
        }

        if ((count || 0) >= room.total_inventory) {
            return { error: "This room type is fully booked for the selected dates." };
        }

        // 2. Encrypt PII
        const encryptedPassport = await encrypt(guestPassport);
        const encryptedPhone = await encrypt(guestPhone);
        const encryptedRequests = specialRequests ? await encrypt(specialRequests) : null;

        // Calculate Total Price
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = room.price_per_night * nights;

        // 3. Create Booking Record (Pending Payment)
        const { data: { user } } = await supabase.auth.getUser();

        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .insert({
                room_id: roomId,
                user_id: user?.id, // Link to user if logged in
                check_in_date: checkIn,
                check_out_date: checkOut,
                status: "pending",
                total_price: totalPrice,
                guest_passport_encrypted: encryptedPassport,
                guest_phone_encrypted: encryptedPhone,
                special_requests_encrypted: encryptedRequests,
            })
            .select("id, room:rooms(hotel:hotels(owner_id, name))") // Select nested relation for owner_id
            .single();

        if (bookingError) {
            console.error("Booking Creation Error:", bookingError);
            return { error: "Failed to create booking record." };
        }

        // --- NOTIFICATION LOGIC ---
        // Notify Hotel Owner
        // @ts-ignore
        const ownerId = booking.room?.hotel?.owner_id;
        // @ts-ignore
        const hotelName = booking.room?.hotel?.name;

        if (ownerId) {
            const adminClient = await createClient(); // Use service role if available or standard client. 
            // Note: createClient() uses standard cookies. We need admin rights to insert for *another* user if RLS blocks it.
            // However, our policy is "Users can view own". Insert policy is missing for authenticated users to insert for others?
            // Actually, the server action runs as the logged-in user (customer).
            // Customer cannot insert into 'notifications' for 'ownerId' unless we have an RLS policy for it OR use service role.

            // WE NEED SERVICE ROLE HERE.
            const { getSupabaseAdmin } = await import("@/lib/supabase/admin"); // Dynamic import to avoid circular deps if any
            const adminSupabase = getSupabaseAdmin();

            await adminSupabase.from("notifications").insert({
                user_id: ownerId,
                title: "New Booking Received!",
                message: `New booking at ${hotelName} for ${nights} nights.`,
                type: "booking_new",
                link: `/admin/bookings/${booking.id}`
            });
        }
        // --------------------------

        // 4. Initiate Payment (Golomt Bank)
        try {
            const transactionId = booking.id;
            const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/booking/success?bookingId=${booking.id}`;

            const paymentResponse = await GolomtService.createInvoice({
                transactionId,
                amount: totalPrice,
                returnUrl
            });

            if (paymentResponse.success && paymentResponse.redirectUrl) {
                return {
                    success: true,
                    message: "Booking initiated. Redirecting to payment...",
                    paymentRedirectUrl: paymentResponse.redirectUrl
                };
            } else {
                console.error("Golomt Initiation Failed:", paymentResponse.error);
                return { error: "Payment gateway validation failed. Please try again." };
            }

        } catch (paymentError) {
            console.error("Payment Service Error:", paymentError);
            return { error: "Payment service unavailable." };
        }

    } catch (error) {
        console.error("Booking Logic Error:", error);
        return { error: "An unexpected error occurred. Please try again." };
    }
}

export async function confirmBookingAction(bookingId: string) {
    const supabase = await createClient();

    try {
        // 1. Update Booking Status
        const { data: booking, error: updateError } = await supabase
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId)
            .select(`
                id,
                check_in_date,
                check_out_date,
                room:rooms (
                    name,
                    hotel:hotels (
                        name,
                        contact_email
                    )
                ),
                user_id
            `)
            .single();

        if (updateError || !booking) {
            console.error("Confirm Booking Error:", updateError);
            return { success: false, error: "Failed to confirm booking." };
        }

        // 2. Fetch User Email (either from encrypted PII or Supabase Auth if logged in)
        // For simplicity in this phase, we'll try to get it from auth if available
        // In a real scenario, we'd decrypt the email from the booking record if we saved it
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email;

        if (userEmail) {
            const datesStr = `${format(new Date(booking.check_in_date), "MMM d")} - ${format(new Date(booking.check_out_date), "MMM d, yyyy")}`;

            // @ts-ignore
            const hotelName = booking.room?.hotel?.name || "COP17 Hotel";

            // 3. Send Confirmation Email
            await sendBookingConfirmation(
                userEmail,
                user?.user_metadata?.full_name || "Guest",
                booking.id,
                hotelName,
                datesStr
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Confirm Booking Logic Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function getBookingDetail(bookingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: booking, error } = await supabase
        .from("bookings")
        .select(`
            *,
            room:rooms (
                name,
                price_per_night,
                hotel:hotels (
                    name,
                    address,
                    images,
                    contact_phone,
                    contact_email
                )
            )
        `)
        .eq("id", bookingId)
        .eq("user_id", user.id)
        .single();

    if (error) {
        console.error("Error fetching booking detail:", error);
        return null;
    }

    return booking;
}

export async function getMyBookings() {
    // ... existing getMyBookings implementation
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
            id,
            check_in_date,
            check_out_date,
            status,
            total_price,
            room:rooms (
                name,
                hotel:hotels (
                    name,
                    images,
                    address,
                    latitude,
                    longitude
                )
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching my bookings (Detailed):", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            full: error
        });
        return [];
    }

    return bookings;
}

export async function cancelBookingAction(bookingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    try {
        // 1. Fetch booking to check ownership and status
        const { data: booking, error: fetchError } = await supabase
            .from("bookings")
            .select("status, check_in_date, user_id, room:rooms(hotel:hotels(owner_id, name))")
            .eq("id", bookingId)
            .eq("user_id", user.id)
            .single();

        if (fetchError || !booking) {
            return { success: false, error: "Booking not found or access denied." };
        }

        if (booking.status === "cancelled") {
            return { success: false, error: "Booking is already cancelled." };
        }

        // 2. Update status
        const { error: updateError } = await supabase
            .from("bookings")
            .update({ status: "cancelled" })
            .eq("id", bookingId);

        if (updateError) throw updateError;

        // 3. Notify Hotel Owner
        // @ts-ignore
        const ownerId = booking.room?.hotel?.owner_id;
        // @ts-ignore
        const hotelName = booking.room?.hotel?.name;

        if (ownerId) {
            const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
            const adminSupabase = getSupabaseAdmin();

            await adminSupabase.from("notifications").insert({
                user_id: ownerId,
                title: "Booking Cancelled",
                message: `A booking for ${hotelName} has been cancelled by the guest.`,
                type: "booking_cancelled",
                link: `/admin/bookings/${bookingId}`
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Cancel Booking Error:", error);
        return { success: false, error: "Failed to cancel booking." };
    }
}

export async function requestModificationAction(bookingId: string, message: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    try {
        // 1. Verify ownership
        const { data: booking, error: fetchError } = await supabase
            .from("bookings")
            .select("id, room:rooms(hotel:hotels(owner_id, name))")
            .eq("id", bookingId)
            .eq("user_id", user.id)
            .single();

        if (fetchError || !booking) {
            return { success: false, error: "Booking not found or access denied." };
        }

        // 2. Notify Hotel Owner about modification request
        // @ts-ignore
        const ownerId = booking.room?.hotel?.owner_id;
        // @ts-ignore
        const hotelName = booking.room?.hotel?.name;

        if (ownerId) {
            const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
            const adminSupabase = getSupabaseAdmin();

            await adminSupabase.from("notifications").insert({
                user_id: ownerId,
                title: "Modification Request",
                message: `Guest requested changes for booking at ${hotelName}: ${message}`,
                type: "booking_modification",
                link: `/admin/bookings/${bookingId}`
            });

            // Also maybe log this in a separate 'audit' or 'requests' table if needed, 
            // but for Prototype notifications are enough.
        }

        return { success: true };
    } catch (error) {
        console.error("Modification Request Error:", error);
        return { success: false, error: "Failed to send modification request." };
    }
}
