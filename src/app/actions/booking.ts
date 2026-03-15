"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { sendBookingConfirmation } from "@/lib/email";
import { encrypt } from "@/lib/encryption";
import { GolomtService } from "@/lib/golomt";
import { getPostgresPool } from "@/lib/postgres";
import { getPreferredHotelName } from "@/lib/hotel-display";
import {
    createPaymentAttempt,
    getPaymentAttemptByGroupId,
    markPaymentAttemptFailed,
    markPaymentAttemptPaid,
} from "@/lib/payment-attempts";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import type { BookingState } from "@/types/booking";
import { calculateBookingPolicyState } from "@/lib/cancellation-policy";
import {
    ActionRateLimitError,
    enforceActionRateLimit,
    getClientIpFromHeaders,
} from "@/lib/action-rate-limit";

// No re-exports here to avoid Turbopack build errors.
// Import types from @/types/booking instead.

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

function getBookingActionErrorMessage(error: unknown): string {
    const errorString = error instanceof Error ? error.stack || error.message : JSON.stringify(error, Object.getOwnPropertyNames(error));

    // Log to server console
    console.error("FULL BOOKING ERROR:", error);

    const msg = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));

    if (
        msg.includes("ENCRYPTION_KEY") ||
        msg.includes("Supabase Admin keys are missing") ||
        msg.includes("Missing required environment variable")
    ) {
        return `Configuration Error: ${msg}. Check Vercel Env Vars.`;
    }

    if (msg.includes("column") && msg.includes("does not exist")) {
        return `Database Schema Error: ${msg}. Migration required.`;
    }

    // Return the full detail to the user for debugging
    return `Server Error [VER-307]: ${msg} | Detailed: ${errorString.substring(0, 300)}`;
}

function getBookingRateLimitErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof ActionRateLimitError) {
        const retryAfterMinutes = Math.max(1, Math.ceil(error.retryAfterSeconds / 60));
        return `${error.message} Retry in about ${retryAfterMinutes} minute${retryAfterMinutes > 1 ? "s" : ""}.`;
    }

    return fallbackMessage;
}

function getRequestBaseUrl(requestHeaders: Headers) {
    const origin = requestHeaders.get("origin");
    if (origin) {
        return origin;
    }

    const protocol = requestHeaders.get("x-forwarded-proto") || "https";
    const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");

    if (host) {
        return `${protocol}://${host}`;
    }

    return undefined;
}

type BookingNotificationPayload = {
    title: string;
    message: string;
    type: string;
    link: string;
};

type BookingHotelRelation = {
    room?: {
        hotel?: {
            owner_id?: string | null;
            name?: string | null;
        } | null;
    } | null;
};

type BookingPolicyHotel = {
    owner_id?: string | null;
    name?: string | null;
    name_en?: string | null;
    check_in_time?: string | null;
    free_cancellation_window_hours?: number | null;
    partial_cancellation_window_hours?: number | null;
    partial_cancellation_penalty_percent?: number | null;
    late_cancellation_penalty_percent?: number | null;
    modification_cutoff_hours?: number | null;
    cancellation_policy_notes?: string | null;
};

type SelectedRoomInput = {
    id: string;
    name: string;
    quantity: number;
    price: number;
};

type LockedRoomRow = {
    id: string;
    room_name: string;
    price_per_night: string | number;
    total_inventory: number;
    owner_id: string | null;
    hotel_name: string | null;
    hotel_name_en: string | null;
};

function getBookingHotelDisplayName(hotel: BookingPolicyHotel | null | undefined) {
    if (!hotel) {
        return "COP17 Hotel";
    }

    return getPreferredHotelName({
        name: hotel.name ?? "",
        name_en: hotel.name_en ?? null,
        address: null,
        address_en: null,
        description: null,
        description_en: null,
        stars: 0,
    }) || hotel.name || "COP17 Hotel";
}

function normalizeSelectedRooms(roomsSelected: SelectedRoomInput[]) {
    const merged = new Map<string, SelectedRoomInput>();

    for (const room of roomsSelected) {
        const quantity = Number(room.quantity || 0);

        if (!room.id || quantity <= 0) {
            continue;
        }

        const existing = merged.get(room.id);
        if (existing) {
            existing.quantity += quantity;
            continue;
        }

        merged.set(room.id, {
            id: room.id,
            name: room.name,
            quantity,
            price: Number(room.price || 0),
        });
    }

    return Array.from(merged.values()).sort((left, right) => left.id.localeCompare(right.id));
}

function isPendingBookingStillActive(createdAt: string | null | undefined) {
    if (!createdAt) {
        return false;
    }

    const createdAtDate = new Date(createdAt);

    if (Number.isNaN(createdAtDate.getTime())) {
        return false;
    }

    return createdAtDate.getTime() >= Date.now() - (15 * 60 * 1000);
}

async function createPendingBookingsAtomically(input: {
    hotelId: string;
    checkIn: string;
    checkOut: string;
    guestName: string;
    guestEmail: string;
    encryptedPassport: string;
    encryptedPhone: string;
    encryptedRequests: string | null;
    userId: string | null;
    groupId: string;
    nights: number;
    roomsSelected: SelectedRoomInput[];
}) {
    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        await client.query("SET LOCAL lock_timeout = '5s'");
        await client.query("SET LOCAL idle_in_transaction_session_timeout = '15s'");

        let totalCombinedPrice = 0;
        let ownerId: string | null = null;
        let hotelName: string | null = null;

        for (const roomSelection of input.roomsSelected) {
            const roomResult = await client.query<LockedRoomRow>(
                `
                    SELECT
                        r.id,
                        r.name AS room_name,
                        r.price_per_night,
                        r.total_inventory,
                        h.owner_id,
                        h.name AS hotel_name,
                        h.name_en AS hotel_name_en
                    FROM public.rooms r
                    JOIN public.hotels h ON h.id = r.hotel_id
                    WHERE r.id = $1
                      AND r.hotel_id = $2
                    FOR UPDATE
                `,
                [roomSelection.id, input.hotelId]
            );

            if (roomResult.rowCount !== 1) {
                throw new Error(`ROOM_NOT_FOUND:${roomSelection.name || roomSelection.id}`);
            }

            const room = roomResult.rows[0];
            const pricePerNight = Number(room.price_per_night || 0);
            const totalInventory = Number(room.total_inventory || 0);

            const overlapResult = await client.query<{ booked_count: string }>(
                `
                    SELECT COUNT(*)::text AS booked_count
                    FROM public.bookings b
                    WHERE b.room_id = $1
                      AND b.check_in_date < $2::date
                      AND b.check_out_date > $3::date
                      AND (
                        b.status = 'confirmed'
                        OR b.status = 'paid'
                        OR (b.status = 'pending' AND b.created_at >= NOW() - INTERVAL '15 minutes')
                      )
                `,
                [roomSelection.id, input.checkOut, input.checkIn]
            );

            const bookedCount = Number(overlapResult.rows[0]?.booked_count || 0);
            const availableCount = Math.max(0, totalInventory - bookedCount);

            if (bookedCount + roomSelection.quantity > totalInventory) {
                throw new Error(`ROOM_UNAVAILABLE:${room.room_name}:${availableCount}`);
            }

            roomSelection.price = pricePerNight;
            totalCombinedPrice += pricePerNight * roomSelection.quantity * input.nights;

            if (!ownerId) {
                ownerId = room.owner_id;
                hotelName = getBookingHotelDisplayName({
                    name: room.hotel_name,
                    name_en: room.hotel_name_en,
                });
            }
        }

        for (const roomSelection of input.roomsSelected) {
            for (let i = 0; i < roomSelection.quantity; i++) {
                await client.query(
                    `
                        INSERT INTO public.bookings (
                            room_id,
                            user_id,
                            check_in_date,
                            check_out_date,
                            status,
                            total_price,
                            guest_name,
                            guest_email,
                            guest_passport_encrypted,
                            guest_phone_encrypted,
                            special_requests_encrypted,
                            group_id
                        ) VALUES (
                            $1, $2, $3::date, $4::date, 'pending', $5, $6, $7, $8, $9, $10, $11
                        )
                    `,
                    [
                        roomSelection.id,
                        input.userId,
                        input.checkIn,
                        input.checkOut,
                        roomSelection.price * input.nights,
                        input.guestName,
                        input.guestEmail,
                        input.encryptedPassport,
                        input.encryptedPhone,
                        input.encryptedRequests,
                        input.groupId,
                    ]
                );
            }
        }

        await client.query("COMMIT");

        return {
            totalCombinedPrice,
            ownerId,
            hotelName,
            normalizedRooms: input.roomsSelected,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function getBookingNotificationRecipientIds(
    adminSupabase: ReturnType<typeof getSupabaseAdmin>,
    ownerId?: string | null
) {
    const recipientIds = new Set<string>();

    if (ownerId) {
        recipientIds.add(ownerId);
    }

    const { data: admins, error } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("role", "super_admin");

    if (error) {
        console.error("Notification recipient lookup failed:", error);
    }

    for (const admin of admins || []) {
        if (admin.id) {
            recipientIds.add(admin.id);
        }
    }

    return Array.from(recipientIds);
}

async function createBookingNotifications(
    adminSupabase: ReturnType<typeof getSupabaseAdmin>,
    ownerId: string | null | undefined,
    payload: BookingNotificationPayload
) {
    const recipientIds = await getBookingNotificationRecipientIds(adminSupabase, ownerId);

    if (recipientIds.length === 0) {
        return;
    }

    const { error } = await adminSupabase.from("notifications").insert(
        recipientIds.map((userId) => ({
            user_id: userId,
            ...payload,
        }))
    );

    if (error) {
        console.error("Notification insert failed:", error);
    }
}

async function cleanupPendingBookingGroup(
    adminSupabase: ReturnType<typeof getSupabaseAdmin>,
    groupId: string
) {
    const { error } = await adminSupabase
        .from("bookings")
        .delete()
        .eq("group_id", groupId)
        .eq("status", "pending");

    if (error) {
        console.error("Failed to clean up pending booking group after payment initiation failure:", error);
    }
}

function getBookingPolicyHotel(value: unknown): BookingPolicyHotel | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    return value as BookingPolicyHotel;
}

function getHotelFromBookingRoomRelation(value: unknown): BookingPolicyHotel | null {
    if (!value) {
        return null;
    }

    const roomRelation = Array.isArray(value) ? value[0] : value;
    const hotelRelation = roomRelation && typeof roomRelation === "object" && "hotel" in roomRelation
        ? (roomRelation as { hotel?: unknown }).hotel
        : null;
    const hotel = Array.isArray(hotelRelation) ? hotelRelation[0] : hotelRelation;

    return getBookingPolicyHotel(hotel);
}

export async function createBookingAction(prevState: BookingState, formData: FormData): Promise<BookingState> {
    try {
        const supabase = await createClient();
        const adminSupabase = getSupabaseAdmin();
        const requestHeaders = await headers();

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

        try {
            const clientIp = getClientIpFromHeaders(requestHeaders);

            await enforceActionRateLimit({
                scope: "booking:create:ip",
                key: clientIp,
                maxHits: 8,
                windowMs: 10 * 60 * 1000,
                message: "Too many booking attempts from this network.",
            });

            await enforceActionRateLimit({
                scope: "booking:create:email",
                key: guestEmail.toLowerCase(),
                maxHits: 4,
                windowMs: 10 * 60 * 1000,
                message: "This email has too many recent booking attempts.",
            });
        } catch (error) {
            return { error: getBookingRateLimitErrorMessage(error, "Too many booking attempts. Please try again later.") };
        }

        let roomsSelected: SelectedRoomInput[] = [];
        try {
            roomsSelected = normalizeSelectedRooms(JSON.parse(roomsData) as SelectedRoomInput[]);
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
        let ownerId: string | null = null;
        let hotelName: string | null = null;

        try {
            const atomicResult = await createPendingBookingsAtomically({
                hotelId,
                checkIn,
                checkOut,
                guestName,
                guestEmail,
                encryptedPassport,
                encryptedPhone,
                encryptedRequests,
                userId: user?.id || null,
                groupId,
                nights,
                roomsSelected,
            });

            totalCombinedPrice = atomicResult.totalCombinedPrice;
            ownerId = atomicResult.ownerId;
            hotelName = atomicResult.hotelName;
            roomsSelected = atomicResult.normalizedRooms;
        } catch (atomicError) {
            console.error("Atomic booking transaction failed:", atomicError);

            const message = atomicError instanceof Error ? atomicError.message : "Unknown booking transaction failure";

            if (message.startsWith("ROOM_UNAVAILABLE:")) {
                const [, roomName, available] = message.split(":");
                return {
                    error: `Not enough availability for: ${roomName}. (Available: ${available ?? 0})`,
                };
            }

            if (message.startsWith("ROOM_NOT_FOUND:")) {
                const [, roomName] = message.split(":");
                return {
                    error: `Room type ${roomName || "selected room"} not found.`,
                };
            }

            if (
                (typeof atomicError === "object" && atomicError !== null && "code" in atomicError && atomicError.code === "55P03") ||
                message.toLowerCase().includes("lock timeout")
            ) {
                return {
                    error: "Another guest is completing this room selection right now. Please retry in a moment.",
                };
            }

            return { error: "Booking inventory changed while you were checking out. Please review availability and try again." };
        }

        // 4. Initiate Payment (Golomt Bank)
        try {
            const returnUrl = `/booking/success?groupId=${groupId}`;
            const appBaseUrl = getRequestBaseUrl(requestHeaders);
            const absoluteReturnUrl = appBaseUrl
                ? new URL(returnUrl, appBaseUrl).toString()
                : returnUrl;

            const paymentResponse = await GolomtService.createInvoice({
                transactionId: groupId,
                amount: totalCombinedPrice,
                returnUrl,
                appBaseUrl,
            });

            if (paymentResponse.success && paymentResponse.redirectUrl) {
                let callbackSignature: string | null = null;

                if (paymentResponse.callbackUrl) {
                    try {
                        callbackSignature = new URL(paymentResponse.callbackUrl).searchParams.get("signature");
                    } catch (callbackUrlError) {
                        console.warn("Failed to parse callback signature from payment URL:", callbackUrlError);
                    }
                }

                await createPaymentAttempt({
                    groupId,
                    transactionId: groupId,
                    invoiceId: paymentResponse.invoiceId || groupId,
                    amount: totalCombinedPrice,
                    redirectUrl: paymentResponse.redirectUrl,
                    callbackSignature,
                    rawRequest: {
                        mode: paymentResponse.mode || "mock",
                        checksum: paymentResponse.checksum || null,
                        callbackUrl: paymentResponse.callbackUrl || null,
                        returnUrl: absoluteReturnUrl,
                    },
                });

                await createBookingNotifications(adminSupabase, ownerId, {
                    title: "New Booking Received!",
                    message: `New multi-room booking at ${hotelName || "COP17 Hotel"} for ${nights} nights.`,
                    type: "booking_new",
                    link: `/admin/bookings`,
                });

                return {
                    success: true,
                    message: "Booking initiated. Redirecting to payment...",
                    paymentRedirectUrl: paymentResponse.redirectUrl
                };
            } else {
                await cleanupPendingBookingGroup(adminSupabase, groupId);

                console.error("Golomt Initiation Failed:", paymentResponse.error);
                return { error: "Payment gateway validation failed. Please try again." };
            }

        } catch (paymentError) {
            await cleanupPendingBookingGroup(adminSupabase, groupId);

            console.error("Payment Service Error:", paymentError);
            return { error: "Payment service unavailable." };
        }

    } catch (error) {
        console.error("Booking Logic Error:", error);
        return { error: getBookingActionErrorMessage(error) };
    }
}

export async function confirmBookingAction(groupId: string, silent: boolean = false) {
    try {
        const adminSupabase = getSupabaseAdmin();
        const { data: bookings, error: fetchError } = await adminSupabase
            .from("bookings")
            .select(`
                id,
                check_in_date,
                check_out_date,
                status,
                room_id,
                room:rooms (
                    name,
                        hotel:hotels (
                            name,
                            name_en,
                            contact_email,
                            owner_id
                        )
                ),
                user_id,
                guest_name,
                guest_email
            `)
            .eq("group_id", groupId);

        if (fetchError || !bookings || bookings.length === 0) {
            console.error("Fetch Booking Error:", fetchError);
            return { success: false, error: "Failed to fetch booking details for email." };
        }

        const alreadyConfirmed = bookings.every(
            (booking) => booking.status === "confirmed" || booking.status === "completed"
        );

        if (!alreadyConfirmed) {
            const { error: updateError } = await adminSupabase
                .from("bookings")
                .update({ status: "confirmed" })
                .eq("group_id", groupId)
                .in("status", ["pending", "paid"]);

            if (updateError) {
                console.error("Confirm Booking Error:", updateError);
                return { success: false, error: "Failed to confirm bookings." };
            }

            if (!silent) {
                try {
                    (revalidateTag as (tag: string) => void)("hotels");
                } catch {
                    // Ignore cache invalidation failures during render/runtime edge cases.
                }
            }
        } else {
            return { success: true, alreadyConfirmed: true };
        }

        const booking = bookings[0];
        const finalEmail = booking.guest_email;
        const finalName = booking.guest_name || "Guest";
        const relatedHotel = (booking as BookingHotelRelation).room?.hotel;

        const ownerId = relatedHotel?.owner_id ?? null;
        const hotelNameForNotif = getBookingHotelDisplayName(relatedHotel);

        await createBookingNotifications(adminSupabase, ownerId, {
            title: "Booking Confirmed & Paid",
            message: `Payment confirmed for booking at ${hotelNameForNotif}. Guest: ${finalName}`,
            type: "booking_confirmed",
            link: `/admin/bookings`,
        });

        if (finalEmail) {
            const datesStr = `${format(new Date(booking.check_in_date), "MMM d")} - ${format(new Date(booking.check_out_date), "MMM d, yyyy")}`;
            const hotelName = getBookingHotelDisplayName(relatedHotel);

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

export async function reconcileBookingPaymentAction(groupId: string) {
    try {
        const paymentAttempt = await getPaymentAttemptByGroupId(groupId);

        if (!paymentAttempt) {
            return { success: false, status: "NOT_FOUND", error: "No payment attempt found for this booking." };
        }

        if (paymentAttempt.status === "paid") {
            const confirmed = await confirmBookingAction(groupId, true);
            return {
                success: confirmed.success,
                status: "PAID",
                error: confirmed.success ? undefined : confirmed.error,
            };
        }

        if (!paymentAttempt.invoice_id) {
            return { success: false, status: "FAILED", error: "Payment invoice is missing for this booking." };
        }

        const verification = await GolomtService.checkPaymentStatus(
            paymentAttempt.transaction_id,
            paymentAttempt.invoice_id,
            paymentAttempt.amount
        );

        if (verification.status === "PAID") {
            await markPaymentAttemptPaid({
                transactionId: paymentAttempt.transaction_id,
                providerReference: paymentAttempt.provider_reference,
                rawCallback: {
                    reconciliation: true,
                    amount: verification.amount ?? paymentAttempt.amount,
                },
            });

            const confirmed = await confirmBookingAction(groupId, true);
            return {
                success: confirmed.success,
                status: verification.status,
                error: confirmed.success ? undefined : confirmed.error,
            };
        }

        if (verification.status === "FAILED" || verification.status === "NOT_FOUND") {
            await markPaymentAttemptFailed({
                transactionId: paymentAttempt.transaction_id,
                error: verification.error || `Provider returned ${verification.status}`,
                rawCallback: {
                    reconciliation: true,
                    status: verification.status,
                },
            });
        }

        return {
            success: false,
            status: verification.status,
            error: verification.error || "Payment is still pending verification.",
        };
    } catch (error) {
        console.error("Reconcile Booking Payment Error:", error);
        return { success: false, status: "FAILED", error: "Payment reconciliation failed." };
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
                hotel:hotels (*)
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
            created_at,
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

    return (bookings || []).filter((booking) => {
        if (booking.status !== "pending") {
            return true;
        }

        return isPendingBookingStillActive(booking.created_at);
    });
}

export async function cancelBookingAction(bookingId: string, reason?: string) {
    const supabase = await createClient();
    const adminSupabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    try {
        try {
            const requestHeaders = await headers();
            const clientIp = getClientIpFromHeaders(requestHeaders);

            await enforceActionRateLimit({
                scope: "booking:cancel:ip",
                key: clientIp,
                maxHits: 12,
                windowMs: 10 * 60 * 1000,
                message: "Too many cancellation attempts from this network.",
            });

            await enforceActionRateLimit({
                scope: "booking:cancel:user",
                key: user.id,
                maxHits: 6,
                windowMs: 10 * 60 * 1000,
                message: "You have submitted too many cancellation attempts.",
            });

            await enforceActionRateLimit({
                scope: "booking:cancel:booking",
                key: bookingId,
                maxHits: 3,
                windowMs: 10 * 60 * 1000,
                message: "This booking has too many recent cancellation attempts.",
            });
        } catch (error) {
            return { success: false, error: getBookingRateLimitErrorMessage(error, "Too many cancellation attempts. Please try again later.") };
        }

        // 1. Fetch booking to check ownership and status
        const { data: booking, error: fetchError } = await supabase
            .from("bookings")
            .select("id, status, check_in_date, total_price, user_id, room:rooms(hotel:hotels(*))")
            .eq("id", bookingId)
            .eq("user_id", user.id)
            .single();

        if (fetchError || !booking) {
            return { success: false, error: "Booking not found or access denied." };
        }

        if (booking.status === "cancelled") {
            return { success: false, error: "Booking is already cancelled." };
        }

        const hotel = getHotelFromBookingRoomRelation(booking.room);
        const cancellationState = calculateBookingPolicyState(
            hotel,
            booking.check_in_date,
            Number(booking.total_price || 0),
            new Date(),
            hotel?.check_in_time
        );

        if (!cancellationState.canCancelOnline) {
            return {
                success: false,
                error: "Online cancellation is no longer available after check-in. Please contact support.",
            };
        }

        const cancellationUpdate = {
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reason?.trim() || null,
            cancellation_penalty_percent: cancellationState.penaltyPercent,
            cancellation_penalty_amount: cancellationState.penaltyAmount,
        };

        // 2. Update status using admin client after ownership has already been verified.
        let { error: updateError } = await adminSupabase
            .from("bookings")
            .update(cancellationUpdate)
            .eq("id", bookingId);

        // Backward-compatibility for environments where the tracking columns are not migrated yet.
        if (updateError?.message?.includes("column") && updateError.message.includes("does not exist")) {
            ({ error: updateError } = await adminSupabase
                .from("bookings")
                .update({ status: "cancelled" })
                .eq("id", bookingId));
        }

        if (updateError) throw updateError;

        // 3. Notify Hotel Owner
        const ownerId = hotel?.owner_id ?? null;
        const hotelName = getBookingHotelDisplayName(hotel);

        await createBookingNotifications(adminSupabase, ownerId, {
            title: "Booking Cancelled",
            message: `A booking for ${hotelName} has been cancelled by the guest. Penalty: ${cancellationState.penaltyPercent}% (${cancellationState.penaltyAmount}).`,
            type: "booking_cancelled",
            link: `/admin/bookings?search=${bookingId}`,
        });

        revalidatePath("/admin");
        revalidatePath("/admin/bookings");
        revalidatePath("/my-bookings");
        revalidatePath(`/my-bookings/${bookingId}/portal`);

        return {
            success: true,
            message: cancellationState.penaltyPercent === 0
                ? "Booking cancelled with full refund eligibility."
                : `Booking cancelled. ${cancellationState.penaltyPercent}% cancellation penalty applies.`,
        };
    } catch (error) {
        console.error("Cancel Booking Error:", error);
        return { success: false, error: "Failed to cancel booking." };
    }
}

export async function requestModificationAction(bookingId: string, message: string) {
    const supabase = await createClient();
    const adminSupabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    try {
        try {
            const requestHeaders = await headers();
            const clientIp = getClientIpFromHeaders(requestHeaders);

            await enforceActionRateLimit({
                scope: "booking:modify:ip",
                key: clientIp,
                maxHits: 12,
                windowMs: 10 * 60 * 1000,
                message: "Too many modification attempts from this network.",
            });

            await enforceActionRateLimit({
                scope: "booking:modify:user",
                key: user.id,
                maxHits: 6,
                windowMs: 10 * 60 * 1000,
                message: "You have submitted too many modification requests.",
            });

            await enforceActionRateLimit({
                scope: "booking:modify:booking",
                key: bookingId,
                maxHits: 4,
                windowMs: 10 * 60 * 1000,
                message: "This booking has too many recent modification requests.",
            });
        } catch (error) {
            return { success: false, error: getBookingRateLimitErrorMessage(error, "Too many modification requests. Please try again later.") };
        }

        // 1. Verify ownership
        const { data: booking, error: fetchError } = await supabase
            .from("bookings")
            .select("id, check_in_date, total_price, room:rooms(hotel:hotels(*))")
            .eq("id", bookingId)
            .eq("user_id", user.id)
            .single();

        if (fetchError || !booking) {
            return { success: false, error: "Booking not found or access denied." };
        }

        const hotel = getHotelFromBookingRoomRelation(booking.room);
        const policyState = calculateBookingPolicyState(
            hotel,
            booking.check_in_date,
            Number(booking.total_price || 0),
            new Date(),
            hotel?.check_in_time
        );

        if (!policyState.canRequestModification) {
            return {
                success: false,
                error: `Online changes closed on ${format(policyState.modificationDeadline, "MMM d, yyyy 'at' HH:mm")}. Please contact support.`,
            };
        }

        // 2. Notify Hotel Owner about modification request
        const sanitizedMessage = message.trim();

        let { error: updateError } = await adminSupabase
            .from("bookings")
            .update({
                modification_requested_at: new Date().toISOString(),
                modification_request_message: sanitizedMessage,
                modification_request_status: "pending",
                modification_reviewed_at: null,
            })
            .eq("id", bookingId);

        if (updateError?.message?.includes("column") && updateError.message.includes("does not exist")) {
            updateError = null;
        }

        if (updateError) {
            throw updateError;
        }

        const ownerId = hotel?.owner_id ?? null;
        const hotelName = getBookingHotelDisplayName(hotel);

        await createBookingNotifications(adminSupabase, ownerId, {
            title: "Modification Request",
            message: `Guest requested changes for booking at ${hotelName}: ${sanitizedMessage}`,
            type: "booking_modification",
            link: `/admin/bookings?search=${bookingId}`,
        });

        revalidatePath("/admin");
        revalidatePath("/admin/bookings");
        revalidatePath(`/my-bookings/${bookingId}/portal`);

        return { success: true };
    } catch (error) {
        console.error("Modification Request Error:", error);
        return { success: false, error: "Failed to send modification request." };
    }
}
