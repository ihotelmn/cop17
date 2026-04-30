"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { sendBookingConfirmation, sendPreBookingRequestReceived, sendBookingCancelledEmail } from "@/lib/email";
import { encrypt } from "@/lib/encryption";
import { GolomtService } from "@/lib/golomt";
import { getPostgresPool } from "@/lib/postgres";
import { getPreferredHotelName } from "@/lib/hotel-display";
import { buildGuestBookingPortalPath, verifyGuestBookingAccessToken } from "@/lib/guest-booking-access";
import { calculateBookingServiceFee, calculateBookingTotalWithFee, roundCurrencyAmount } from "@/lib/utils";
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
    buildActionRateLimitKey,
    enforceActionRateLimitSafely,
    getClientIpFromHeaders,
} from "@/lib/action-rate-limit";

// No re-exports here to avoid Turbopack build errors.
// Import types from @/types/booking instead.

// Validation Schema
const bookingSchema = z.object({
    roomsData: z.string().min(1, "Rooms data required"),
    hotelId: z.string().min(1, "Hotel ID required"),
    bookingMode: z.enum(["pay_now", "prebook"]).default("pay_now"),
    checkIn: z.string().date(),
    checkOut: z.string().date(),
    guestName: z.string().min(2, "Name required"),
    guestEmail: z.string().email("Valid email required"),
    guestPassport: z.string().min(5, "Passport number required"),
    guestPhone: z.string().min(8, "Valid phone number required"),
    specialRequests: z.string().nullable().optional(),
});

function getBookingActionErrorMessage(error: unknown): string {
    // Log full details to server console only
    console.error("FULL BOOKING ERROR:", error);
    if (error instanceof Error && error.stack) {
        console.error("STACK:", error.stack);
    }

    const msg = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));

    if (
        msg.includes("ENCRYPTION_KEY") ||
        msg.includes("Supabase Admin keys are missing") ||
        msg.includes("Missing required environment variable")
    ) {
        return "A server configuration issue prevented your booking. Our team has been notified.";
    }

    if (msg.includes("column") && msg.includes("does not exist")) {
        return "A database update is required. Please contact support.";
    }

    // Return safe, generic message to the user
    return "An unexpected error occurred while processing your booking. Please try again or contact support.";
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

function isBookingServiceUnavailableError(error: unknown) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code).toLowerCase() : "";

    return (
        ["08001", "08006", "53300", "57p01", "etimedout", "econnrefused", "econnreset"].includes(code) ||
        message.includes("connection terminated") ||
        message.includes("connection refused") ||
        message.includes("timeout exceeded when trying to connect") ||
        message.includes("timeout expired") ||
        message.includes("could not connect") ||
        message.includes("the database system is starting up")
    );
}

function isBookingStatusConstraintError(error: unknown) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code).toLowerCase() : "";
    const constraint = typeof error === "object" && error !== null && "constraint" in error
        ? String(error.constraint).toLowerCase()
        : "";

    return (
        code === "23514" &&
        (constraint === "bookings_status_check" || message.includes("bookings_status_check"))
    );
}

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
    initialStatus: "pending" | "prebook_requested";
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
                        OR b.status = 'prebook_requested'
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
            const lineSubtotal = roundCurrencyAmount(pricePerNight * roomSelection.quantity * input.nights);
            const lineTotal = calculateBookingTotalWithFee(lineSubtotal);
            totalCombinedPrice = roundCurrencyAmount(totalCombinedPrice + lineTotal);

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
                const bookingSubtotal = roundCurrencyAmount(roomSelection.price * input.nights);
                const bookingServiceFee = calculateBookingServiceFee(bookingSubtotal);
                const bookingTotal = calculateBookingTotalWithFee(bookingSubtotal);

                await client.query(
                    `
                        INSERT INTO public.bookings (
                            room_id,
                            user_id,
                            check_in_date,
                            check_out_date,
                            status,
                            total_price,
                            service_fee,
                            guest_name,
                            guest_email,
                            guest_passport_encrypted,
                            guest_phone_encrypted,
                            special_requests_encrypted,
                            group_id
                        ) VALUES (
                            $1, $2, $3::date, $4::date, $5, $6, $7, $8, $9, $10, $11, $12, $13
                        )
                    `,
                    [
                        roomSelection.id,
                        input.userId,
                        input.checkIn,
                        input.checkOut,
                        input.initialStatus,
                        bookingTotal,
                        bookingServiceFee,
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

async function createPendingBookingsFallback(
    adminSupabase: ReturnType<typeof getSupabaseAdmin>,
    input: {
        hotelId: string;
        initialStatus: "pending" | "prebook_requested";
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
    }
) {
    let totalCombinedPrice = 0;
    let ownerId: string | null = null;
    let hotelName: string | null = null;
    const bookingRows: Array<Record<string, unknown>> = [];

    for (const roomSelection of input.roomsSelected) {
        const { data: roomRecord, error: roomError } = await adminSupabase
            .from("rooms")
            .select(`
                id,
                name,
                price_per_night,
                hotel:hotels (
                    owner_id,
                    name,
                    name_en
                )
            `)
            .eq("id", roomSelection.id)
            .eq("hotel_id", input.hotelId)
            .maybeSingle();

        if (roomError || !roomRecord) {
            throw new Error(`ROOM_NOT_FOUND:${roomSelection.name || roomSelection.id}`);
        }

        const relatedHotel = Array.isArray(roomRecord.hotel) ? roomRecord.hotel[0] : roomRecord.hotel;
        const pricePerNight = Number(roomRecord.price_per_night || 0);
        roomSelection.price = pricePerNight;
        const lineSubtotal = roundCurrencyAmount(pricePerNight * roomSelection.quantity * input.nights);
        const lineTotal = calculateBookingTotalWithFee(lineSubtotal);
        totalCombinedPrice = roundCurrencyAmount(totalCombinedPrice + lineTotal);

        if (!ownerId) {
            ownerId = relatedHotel?.owner_id ?? null;
            hotelName = getBookingHotelDisplayName(relatedHotel);
        }

        for (let i = 0; i < roomSelection.quantity; i++) {
            const bookingSubtotal = roundCurrencyAmount(pricePerNight * input.nights);
            const bookingServiceFee = calculateBookingServiceFee(bookingSubtotal);
            bookingRows.push({
                room_id: roomSelection.id,
                user_id: input.userId,
                check_in_date: input.checkIn,
                check_out_date: input.checkOut,
                status: input.initialStatus,
                total_price: calculateBookingTotalWithFee(bookingSubtotal),
                service_fee: bookingServiceFee,
                guest_name: input.guestName,
                guest_email: input.guestEmail,
                guest_passport_encrypted: input.encryptedPassport,
                guest_phone_encrypted: input.encryptedPhone,
                special_requests_encrypted: input.encryptedRequests,
                group_id: input.groupId,
            });
        }
    }

    const { error: insertError } = await adminSupabase
        .from("bookings")
        .insert(bookingRows);

    if (insertError) {
        throw insertError;
    }

    return {
        totalCombinedPrice,
        ownerId,
        hotelName,
        normalizedRooms: input.roomsSelected,
    };
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

async function getAccessibleBookingRecord<T>(
    bookingId: string,
    select: string,
    accessToken?: string
): Promise<{ booking: T | null; accessMode: "user" | "guest" | null }> {
    const supabase = await createClient();
    const adminSupabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        const { data: ownedBooking, error: ownedError } = await supabase
            .from("bookings")
            .select(select)
            .eq("id", bookingId)
            .eq("user_id", user.id)
            .single();

        if (!ownedError && ownedBooking) {
            return { booking: ownedBooking as T, accessMode: "user" };
        }
    }

    if (!accessToken) {
        return { booking: null, accessMode: null };
    }

    const { data: guestBooking, error: guestError } = await adminSupabase
        .from("bookings")
        .select(select)
        .eq("id", bookingId)
        .single();

    if (guestError || !guestBooking) {
        return { booking: null, accessMode: null };
    }

    const guestBookingRecord = guestBooking as unknown as Record<string, unknown>;
    const guestEmail = typeof guestBookingRecord.guest_email === "string"
        ? guestBookingRecord.guest_email
        : "";

    if (!verifyGuestBookingAccessToken(bookingId, guestEmail, accessToken)) {
        return { booking: null, accessMode: null };
    }

    return { booking: guestBooking as T, accessMode: "guest" };
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
            bookingMode: formData.get("bookingMode") || "pay_now",
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

        const { hotelId, bookingMode, checkIn, checkOut, guestName, guestEmail, guestPassport, guestPhone, specialRequests, roomsData } = validatedFields.data;

        try {
            const clientIp = getClientIpFromHeaders(requestHeaders);
            const bookingIdentityKey = buildActionRateLimitKey(clientIp, guestEmail, hotelId);

            await enforceActionRateLimitSafely({
                scope: "booking:create:network:v2",
                key: clientIp,
                maxHits: 40,
                windowMs: 10 * 60 * 1000,
                message: "Too many booking attempts from this network.",
            }, "booking:create:network:v2");

            await enforceActionRateLimitSafely({
                scope: "booking:create:identity:v2",
                key: bookingIdentityKey,
                maxHits: 8,
                windowMs: 10 * 60 * 1000,
                message: "Too many recent booking attempts for this stay.",
            }, "booking:create:identity:v2");
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
                .in("status", ["confirmed", "pending", "paid", "prebook_requested"]);

            if (countError) {
                console.error("Availability Check Error:", countError);
                return { error: "System error checking availability." };
            }

            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            let bookedCount = 0;
            if (overlappingBookings) {
                for (const b of overlappingBookings) {
                    const isConfirmed = b.status === "confirmed" || b.status === "paid" || b.status === "prebook_requested";
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
            totalCombinedPrice = roundCurrencyAmount(totalCombinedPrice + (rs.price * rs.quantity * nights));
        }

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
                    initialStatus: bookingMode === "prebook" ? "prebook_requested" : "pending",
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

            try {
                const fallbackResult = await createPendingBookingsFallback(adminSupabase, {
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
                    initialStatus: bookingMode === "prebook" ? "prebook_requested" : "pending",
                    roomsSelected,
                });

                totalCombinedPrice = fallbackResult.totalCombinedPrice;
                ownerId = fallbackResult.ownerId;
                hotelName = fallbackResult.hotelName;
                roomsSelected = fallbackResult.normalizedRooms;
            } catch (fallbackError) {
                console.error("Supabase booking fallback failed:", fallbackError);

                if (isBookingStatusConstraintError(atomicError) || isBookingStatusConstraintError(fallbackError)) {
                    return {
                        error: "Booking configuration is being updated right now. Please try again in a moment.",
                    };
                }

                if (isBookingServiceUnavailableError(atomicError) || isBookingServiceUnavailableError(fallbackError)) {
                    return {
                        error: "Booking service is temporarily busy. Please try again in a moment.",
                    };
                }

                return { error: "We couldn't complete your reservation right now. Please try again in a moment." };
            }
        }

        const primaryBookingId = groupId ? `${groupId}` : null;
        const datesStr = `${format(new Date(checkIn), "MMM d")} - ${format(new Date(checkOut), "MMM d, yyyy")}`;

        if (bookingMode === "prebook") {
            const { data: firstBooking } = await adminSupabase
                .from("bookings")
                .select("id")
                .eq("group_id", groupId)
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();

            const manageBookingPath = firstBooking?.id
                ? buildGuestBookingPortalPath(firstBooking.id, guestEmail)
                : undefined;

            await createBookingNotifications(adminSupabase, ownerId, {
                title: "Pre-booking Request",
                message: `New pre-booking request at ${hotelName || "COP17 Hotel"} for ${nights} nights.`,
                type: "booking_prebook",
                link: `/admin/bookings`,
            });

            await sendPreBookingRequestReceived(
                guestEmail,
                guestName,
                firstBooking?.id || primaryBookingId || groupId,
                hotelName || "COP17 Hotel",
                datesStr,
                manageBookingPath
            );

            return {
                success: true,
                message: "Pre-booking request sent successfully.",
                paymentRedirectUrl: `/booking/success?groupId=${groupId}&payment=prebook-requested`,
            };
        }

        // 4. Initiate Payment (Golomt Bank)
        // Server-side guard: refuse online payments unless Golomt is in live mode
        // with real credentials. This blocks the mock-payment path even if the
        // client-side button were re-enabled by a tampered request.
        try {
            if (GolomtService.getMode() !== "live") {
                return {
                    error: "Online card payments are temporarily unavailable. Please use Pre-book and our team will contact you to arrange payment.",
                };
            }
        } catch {
            return {
                error: "Online card payments are temporarily unavailable. Please use Pre-book and our team will contact you to arrange payment.",
            };
        }

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
            const manageBookingPath = buildGuestBookingPortalPath(booking.id, finalEmail);

            // Send Confirmation Email using the first booking ID
            await sendBookingConfirmation(
                finalEmail,
                finalName,
                booking.id,
                hotelName,
                datesStr,
                manageBookingPath
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

export async function getBookingDetail(bookingId: string, accessToken?: string) {
    const { booking } = await getAccessibleBookingRecord(
        bookingId,
        `
            *,
            room:rooms (
                name,
                price_per_night,
                hotel:hotels (*)
            )
        `,
        accessToken
    );

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

export async function cancelBookingAction(bookingId: string, reason?: string, accessToken?: string) {
    const supabase = await createClient();
    const adminSupabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    try {
        try {
            const requestHeaders = await headers();
            const clientIp = getClientIpFromHeaders(requestHeaders);

            await enforceActionRateLimitSafely({
                scope: "booking:cancel:ip",
                key: clientIp,
                maxHits: 12,
                windowMs: 10 * 60 * 1000,
                message: "Too many cancellation attempts from this network.",
            }, "booking:cancel:ip");

            await enforceActionRateLimitSafely({
                scope: "booking:cancel:user",
                key: user?.id || `guest:${bookingId}`,
                maxHits: 6,
                windowMs: 10 * 60 * 1000,
                message: "You have submitted too many cancellation attempts.",
            }, "booking:cancel:user");

            await enforceActionRateLimitSafely({
                scope: "booking:cancel:booking",
                key: bookingId,
                maxHits: 3,
                windowMs: 10 * 60 * 1000,
                message: "This booking has too many recent cancellation attempts.",
            }, "booking:cancel:booking");
        } catch (error) {
            return { success: false, error: getBookingRateLimitErrorMessage(error, "Too many cancellation attempts. Please try again later.") };
        }

        const { booking } = await getAccessibleBookingRecord<{
            id: string;
            status: string;
            check_in_date: string;
            total_price: number | string | null;
            user_id: string | null;
            guest_email: string | null;
            room: unknown;
        }>(
            bookingId,
            "id, status, check_in_date, total_price, user_id, guest_email, room:rooms(hotel:hotels(*))",
            accessToken
        );

        if (!booking) {
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

        // 4. Send Email Notification to Guest
        if (booking.guest_email) {
            const guestName = (booking as { guest_name?: string | null }).guest_name || "Guest";
            const datesStr = `${format(new Date(booking.check_in_date), "MMM d, yyyy")}`;
            const refundInfo = cancellationState.penaltyPercent === 0 
                ? "Eligible for a full refund." 
                : `${cancellationState.penaltyPercent}% cancellation penalty applies (${cancellationState.penaltyAmount}).`;

            await sendBookingCancelledEmail(
                booking.guest_email,
                guestName,
                bookingId,
                hotelName,
                datesStr,
                refundInfo
            ).catch(e => console.error("Failed to send cancellation email:", e));
        }

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

export async function requestModificationAction(bookingId: string, message: string, accessToken?: string) {
    const supabase = await createClient();
    const adminSupabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    try {
        try {
            const requestHeaders = await headers();
            const clientIp = getClientIpFromHeaders(requestHeaders);

            await enforceActionRateLimitSafely({
                scope: "booking:modify:ip",
                key: clientIp,
                maxHits: 12,
                windowMs: 10 * 60 * 1000,
                message: "Too many modification attempts from this network.",
            }, "booking:modify:ip");

            await enforceActionRateLimitSafely({
                scope: "booking:modify:user",
                key: user?.id || `guest:${bookingId}`,
                maxHits: 6,
                windowMs: 10 * 60 * 1000,
                message: "You have submitted too many modification requests.",
            }, "booking:modify:user");

            await enforceActionRateLimitSafely({
                scope: "booking:modify:booking",
                key: bookingId,
                maxHits: 4,
                windowMs: 10 * 60 * 1000,
                message: "This booking has too many recent modification requests.",
            }, "booking:modify:booking");
        } catch (error) {
            return { success: false, error: getBookingRateLimitErrorMessage(error, "Too many modification requests. Please try again later.") };
        }

        const { booking } = await getAccessibleBookingRecord<{
            id: string;
            check_in_date: string;
            total_price: number | string | null;
            guest_email: string | null;
            room: unknown;
        }>(
            bookingId,
            "id, check_in_date, total_price, guest_email, room:rooms(hotel:hotels(*))",
            accessToken
        );

        if (!booking) {
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
