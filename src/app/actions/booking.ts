"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { sendBookingConfirmation } from "@/lib/email";
import { encrypt } from "@/lib/encryption";
import { GolomtService } from "@/lib/golomt";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

// Validation Schema
const bookingSchema = z.object({
    roomsData: z.string().min(1, "Rooms data required"),
    hotelId: z.string().min(1, "Hotel ID required"),
    checkIn: z.string().date(),
    checkOut: z.string().date(),
    guestName: z.string().min(2, "Name required"),
    guestEmail: z.string().email("Valid email required"),
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
    try {
        const supabase = await createClient();
        const adminSupabase = getSupabaseAdmin();

        // Validate Input
        const validatedFields = bookingSchema.safeParse({
            roomsData: formData.get("roomsData"),
            hotelId: formData.get("hotelId"),
            checkIn: formData.get("checkIn"),
            checkOut: formData.get("checkOut"),
            guestName: formData.get("guestName"),
            guestEmail: formData.get("guestEmail"),
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

        const { hotelId, checkIn, checkOut, guestName, guestEmail, guestPassport, guestPhone, specialRequests, roomsData } = validatedFields.data;

        let roomsSelected: { id: string; name: string; quantity: number; price: number }[] = [];
        try {
            roomsSelected = JSON.parse(roomsData);
        } catch {
            return { error: "Invalid rooms data format." };
        }

        if (!roomsSelected || roomsSelected.length === 0) {
            return { error: "No rooms selected for booking." };
        }

        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        let totalCombinedPrice = 0;

        // 1. Check Inventory Availability for all
        for (const rs of roomsSelected) {
            const { data: room, error: roomError } = await adminSupabase
                .from("rooms")
                .select("name, price_per_night, total_inventory")
                .eq("id", rs.id)
                .single();

            if (roomError || !room) {
                return { error: `Room type ${rs.name || rs.id} not found.` };
            }

            const { data: overlappingBookings, error: countError } = await adminSupabase
                .from("bookings")
                .select("id, status, created_at")
                .eq("room_id", rs.id)
                .lt("check_in_date", checkOut)
                .gt("check_out_date", checkIn)
                .in("status", ["confirmed", "pending"]);

            if (countError) {
                console.error("Availability Check Error:", countError);
                return { error: "System error checking availability." };
            }

            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            let bookedCount = 0;
            if (overlappingBookings) {
                for (const b of overlappingBookings) {
                    const isConfirmed = b.status === "confirmed";
                    const isRecentPending = b.status === "pending" && new Date(b.created_at) >= fifteenMinutesAgo;
                    if (isConfirmed || isRecentPending) {
                        bookedCount++;
                    }
                }
            }

            if ((bookedCount + rs.quantity) > room.total_inventory) {
                return { error: `Not enough availability for: ${room.name}. (Available: ${Math.max(0, room.total_inventory - bookedCount)})` };
            }

            // Ensure we use the official DB price
            rs.price = room.price_per_night;
            totalCombinedPrice += rs.price * rs.quantity * nights;
        }
        console.log(`[PriceTotal] Combined Total: ${totalCombinedPrice}`);

        // 2. Encrypt PII
        const encryptedPassport = await encrypt(guestPassport);
        const encryptedPhone = await encrypt(guestPhone);
        const encryptedRequests = specialRequests ? await encrypt(specialRequests) : null;

        // 3. Create Booking Records (Pending Payment)
        const { data: { user } } = await supabase.auth.getUser();
        const groupId = crypto.randomUUID();

        let ownerId = null;
        let hotelName = null;

        for (const rs of roomsSelected) {
            for (let i = 0; i < rs.quantity; i++) {
                const { data: booking, error: bookingError } = await adminSupabase
                    .from("bookings")
                    .insert({
                        room_id: rs.id,
                        user_id: user?.id,
                        check_in_date: checkIn,
                        check_out_date: checkOut,
                        status: "pending",
                        total_price: rs.price * nights,
                        guest_name: guestName,
                        guest_email: guestEmail,
                        guest_passport_encrypted: encryptedPassport,
                        guest_phone_encrypted: encryptedPhone,
                        special_requests_encrypted: encryptedRequests,
                        group_id: groupId
                    })
                    .select("room:rooms(hotel:hotels(owner_id, name))")
                    .single();

                if (bookingError) {
                    console.error("Booking Creation Error:", bookingError);
                    return { error: "Failed to create booking records." };
                }

                if (!ownerId && booking) {
                    // @ts-ignore
                    ownerId = booking.room?.hotel?.owner_id;
                    // @ts-ignore
                    hotelName = booking.room?.hotel?.name;
                }
            }
        }

        // --- NOTIFICATION LOGIC ---
        if (ownerId && hotelName) {
            await adminSupabase.from("notifications").insert({
                user_id: ownerId,
                title: "New Booking Received!",
                message: `New multi-room booking at ${hotelName} for ${nights} nights.`,
                type: "booking_new",
                link: `/admin/bookings` // Grouped booking link
            });
        }

        // 4. Initiate Payment (Golomt Bank)
        try {
            const returnUrl = `/booking/success?groupId=${groupId}`;

            const paymentResponse = await GolomtService.createInvoice({
                transactionId: groupId,
                amount: totalCombinedPrice,
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

export async function confirmBookingAction(groupId: string) {
    try {
        const supabase = await createClient();
        const adminSupabase = getSupabaseAdmin();
        // 1. Update Booking Status for all rooms in the group
        const { error: updateError } = await adminSupabase
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("group_id", groupId);

        if (updateError) {
            console.error("Confirm Booking Error:", updateError);
            return { success: false, error: "Failed to confirm bookings." };
        }

        // 1.5. Invalidate caches
        revalidateTag("hotels");

        // 2. Fetch the primary (first) booking to get data for email
        const { data: booking, error: fetchError } = await adminSupabase
            .from("bookings")
            .select(`
                id,
                check_in_date,
                check_out_date,
                room_id,
                room:rooms (
                    name,
                    hotel:hotels (
                        name,
                        contact_email
                    )
                ),
                user_id,
                guest_name,
                guest_email
            `)
            .eq("group_id", groupId)
            .limit(1)
            .single();

        if (fetchError || !booking) {
            console.error("Fetch Booking Error:", fetchError);
            return { success: false, error: "Failed to fetch booking details for email." };
        }

        // 3. Determine Email/Name from Booking (already has guest info)
        const finalEmail = booking.guest_email;
        const finalName = booking.guest_name || "Guest";

        if (finalEmail) {
            const datesStr = `${format(new Date(booking.check_in_date), "MMM d")} - ${format(new Date(booking.check_out_date), "MMM d, yyyy")}`;

            // @ts-ignore
            const hotelName = booking.room?.hotel?.name || "COP17 Hotel";

            // Send Confirmation Email using the first booking ID
            await sendBookingConfirmation(
                finalEmail,
                finalName,
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
