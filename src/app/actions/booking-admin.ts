"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { decrypt } from "@/lib/encryption";
import { z } from "zod";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type BookingAdmin = {
    id: string;
    guestName: string;
    hotelName: string;
    roomName: string;
    dates: string;
    status: string;
    amount: number;
    checkIn: string;
    checkOut: string;
    rawStatus: string;
};

// Helper: Get room IDs belonging to hotels owned by the user (Admin Client recommended)
async function getOwnerRoomIds(adminClient: any, userId: string): Promise<string[]> {
    // 1. Get Hotels owned by user
    const { data: hotels } = await adminClient
        .from("hotels")
        .select("id")
        .eq("owner_id", userId);

    if (!hotels || hotels.length === 0) return [];

    const hotelIds = hotels.map((h: any) => h.id);

    // 2. Get Rooms in those hotels
    const { data: rooms } = await adminClient
        .from("rooms")
        .select("id")
        .in("hotel_id", hotelIds);

    if (!rooms || rooms.length === 0) return [];

    return rooms.map((r: any) => r.id);
}

export type BookingFilters = {
    status?: string;
    hotelId?: string;
    search?: string;
};

export async function getAllBookings(filters?: BookingFilters): Promise<{ success: boolean; data?: BookingAdmin[]; error?: string }> {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const { data: profile } = await adminClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        console.log("getAllBookings debug:", { userId: user.id, role: profile?.role });

        let query = adminClient
            .from("bookings")
            .select(`
                id,
                check_in_date,
                check_out_date,
                status,
                total_price,
                user_id,
                guest_passport_encrypted,
                room:rooms (
                    name,
                    hotel:hotels (
                        name
                    )
                )
            `)
            .order("created_at", { ascending: false });

        // RBAC: If not super_admin, filter by owned rooms
        if (profile?.role !== "super_admin") {
            const allowedRoomIds = await getOwnerRoomIds(adminClient, user.id);
            if (allowedRoomIds.length === 0) {
                return { success: true, data: [] }; // No rooms = no bookings
            }
            query = query.in("room_id", allowedRoomIds);
        }

        // --- FILTERS ---
        if (filters?.status && filters.status !== "all") {
            query = query.eq("status", filters.status);
        }

        if (filters?.hotelId && filters.hotelId !== "all") {
            // Find rooms for this hotel first
            const { data: hotelRooms } = await adminClient.from("rooms").select("id").eq("hotel_id", filters.hotelId);
            if (hotelRooms && hotelRooms.length > 0) {
                const ids = hotelRooms.map((r: any) => r.id);
                query = query.in("room_id", ids);
            } else {
                return { success: true, data: [] }; // Hotel has no rooms, or invalid hotel ID
            }
        }

        // Exact ID search optimization (if search looks like UUID)
        if (filters?.search && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.search)) {
            query = query.eq("id", filters.search);
        }
        // ---------------

        const { data: bookings, error } = await query;

        if (error) {
            console.error("Error fetching bookings:", JSON.stringify(error, null, 2));
            return { success: false, error: "Failed to fetch bookings" };
        }

        // Fetch user profiles manually
        const userIds = Array.from(new Set(bookings.map((b: any) => b.user_id).filter(Boolean)));
        let profilesMap: Record<string, any> = {};

        if (userIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("id, email, full_name, role")
                .in("id", userIds);

            if (profiles) {
                profilesMap = profiles.reduce((acc: any, profile: any) => {
                    acc[profile.id] = profile;
                    return acc;
                }, {});
            }
        }

        // Transform data
        let formattedBookings: BookingAdmin[] = bookings.map((b: any) => {
            let guestName = "Guest";

            // Try to get name from profile
            if (b.user_id && profilesMap[b.user_id]) {
                const p = profilesMap[b.user_id];
                guestName = p.full_name || p.email || "Guest";
            }

            // Format dates
            const checkIn = new Date(b.check_in_date).toLocaleDateString();
            const checkOut = new Date(b.check_out_date).toLocaleDateString();

            return {
                id: b.id,
                guestName,
                hotelName: b.room?.hotel?.name || "Unknown Hotel",
                roomName: b.room?.name || "Unknown Room",
                dates: `${checkIn} - ${checkOut}`,
                checkIn: b.check_in_date,
                checkOut: b.check_out_date,
                status: b.status,
                rawStatus: b.status,
                amount: b.total_price,
            };
        });

        // In-memory Filter for Search (Name, Hotel, etc.) if not UUID
        if (filters?.search && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.search)) {
            const lowerSearch = filters.search.toLowerCase();
            formattedBookings = formattedBookings.filter(b =>
                b.guestName.toLowerCase().includes(lowerSearch) ||
                b.hotelName.toLowerCase().includes(lowerSearch) ||
                b.roomName.toLowerCase().includes(lowerSearch) ||
                b.id.toLowerCase().includes(lowerSearch)
            );
        }

        return { success: true, data: formattedBookings };

    } catch (error) {
        console.error("Unexpected error:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function updateBookingStatus(bookingId: string, status: string) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

        let query = supabase
            .from("bookings")
            .update({ status })
            .eq("id", bookingId);

        // RBAC: If not super_admin, verify ownership
        if (profile?.role !== "super_admin") {
            const allowedRoomIds = await getOwnerRoomIds(supabase, user.id);
            // This is a simplified check. A tighter check would be to existing booking's room_id
            // But 'in' clause on update works fine as a filter
            query = query.in("room_id", allowedRoomIds);
        }

        const { error } = await query;

        if (error) {
            console.error("Error updating booking:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/admin/bookings");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update status" };
    }
}

export async function getDashboardStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            error: "Unauthorized",
            data: { totalBookings: 0, revenue: 0, activeGuests: 0, pendingBookings: 0, occupancyRate: 0, revenueTrends: [], statusDistribution: [], topHotels: [] }
        };
    }

    const adminClient = getSupabaseAdmin();

    try {
        const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).single();

        let roomFilter: string[] | null = null;
        let hotelFilter: string[] | null = null;

        if (profile?.role !== "super_admin") {
            const { data: hotels } = await adminClient.from("hotels").select("id").eq("owner_id", user.id);
            const hFilter = hotels?.map((h: any) => h.id) || [];
            hotelFilter = hFilter;

            if (hFilter.length === 0) {
                return {
                    success: true,
                    data: { totalBookings: 0, revenue: 0, activeGuests: 0, pendingBookings: 0, occupancyRate: 0, revenueTrends: [], statusDistribution: [], topHotels: [] }
                };
            }

            const { data: rooms } = await adminClient.from("rooms").select("id").in("hotel_id", hFilter);
            const rFilter = rooms?.map((r: any) => r.id) || [];
            roomFilter = rFilter;

            if (rFilter.length === 0) {
                return {
                    success: true,
                    data: { totalBookings: 0, revenue: 0, activeGuests: 0, pendingBookings: 0, occupancyRate: 0, revenueTrends: [], statusDistribution: [], topHotels: [] }
                };
            }
        }

        const applyFilter = (query: any) => {
            if (roomFilter && roomFilter.length > 0) return query.in("room_id", roomFilter);
            return query;
        };

        // 1. Basic Stats
        let bookingsQuery = adminClient.from("bookings").select("*", { count: "exact", head: true });
        bookingsQuery = applyFilter(bookingsQuery);
        const { count: totalBookings } = await bookingsQuery;

        let revenueQuery = adminClient.from("bookings").select("total_price, status, created_at, room:rooms(hotel:hotels(name))").neq("status", "cancelled");
        revenueQuery = applyFilter(revenueQuery);
        const { data: allBookingsData } = await revenueQuery;

        const totalRevenue = allBookingsData?.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0) || 0;

        let activeGuestsQuery = adminClient.from("bookings").select("*", { count: "exact", head: true }).eq("status", "checked-in");
        activeGuestsQuery = applyFilter(activeGuestsQuery);
        const { count: activeGuests } = await activeGuestsQuery;

        let pendingBookingsQuery = adminClient.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending");
        pendingBookingsQuery = applyFilter(pendingBookingsQuery);
        const { count: pendingBookings } = await pendingBookingsQuery;

        // 2. Occupancy Rate
        let roomsQuery = adminClient.from("rooms").select("total_inventory");
        if (hotelFilter) roomsQuery = roomsQuery.in("hotel_id", hotelFilter);
        const { data: roomsInventory } = await roomsQuery;
        const totalInventory = roomsInventory?.reduce((sum: number, r: any) => sum + (r.total_inventory || 0), 0) || 0;

        const today = new Date().toISOString().split('T')[0];
        let occupancyQuery = adminClient
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .neq("status", "cancelled")
            .lte("check_in_date", today)
            .gte("check_out_date", today);
        occupancyQuery = applyFilter(occupancyQuery);
        const { count: occupiedRooms } = await occupancyQuery;
        const occupancyRate = totalInventory > 0 ? Math.round(((occupiedRooms || 0) / totalInventory) * 100) : 0;

        // 3. Revenue Trends (Last 7 days)
        const last7Days = eachDayOfInterval({
            start: subDays(new Date(), 6),
            end: new Date()
        });

        const revenueTrends = last7Days.map(date => {
            const dateStr = format(date, "MMM dd");
            const dayStart = startOfDay(date);
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

            const dayRevenue = allBookingsData?.filter((b: any) => {
                const createdAt = new Date(b.created_at);
                return createdAt >= dayStart && createdAt <= dayEnd;
            }).reduce((sum: number, b: any) => sum + (b.total_price || 0), 0) || 0;

            return { date: dateStr, amount: dayRevenue };
        });

        // 4. Status Distribution
        const statusCounts: Record<string, number> = {};
        allBookingsData?.forEach((b: any) => {
            statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
        });
        const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

        // 5. Top Hotels (Only for Super Admin or multiple hotels)
        const hotelStats: Record<string, number> = {};
        allBookingsData?.forEach((b: any) => {
            const hName = b.room?.hotel?.name || "Unknown";
            hotelStats[hName] = (hotelStats[hName] || 0) + 1;
        });
        const topHotels = Object.entries(hotelStats)
            .map(([name, bookings]) => ({ name, bookings }))
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 5);

        return {
            success: true,
            data: {
                totalBookings: totalBookings || 0,
                revenue: totalRevenue,
                activeGuests: activeGuests || 0,
                pendingBookings: pendingBookings || 0,
                occupancyRate,
                revenueTrends,
                statusDistribution,
                topHotels
            }
        };

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
            success: false,
            error: "Failed to fetch stats",
            data: { totalBookings: 0, revenue: 0, activeGuests: 0, pendingBookings: 0, occupancyRate: 0, revenueTrends: [], statusDistribution: [], topHotels: [] }
        };
    }
}

export async function getBookingDetails(bookingId: string) {
    const supabase = await createClient();

    try {
        // 1. Check if admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return { success: false, error: "Unauthorized" };
        }

        // 2. Fetch booking
        const { data: booking, error } = await supabase
            .from("bookings")
            .select(`
                *,
                room:rooms (
                    id,
                    name,
                    hotel:hotels (
                        id,
                        name,
                        owner_id
                    )
                )
            `)
            .eq("id", bookingId)
            .single();

        if (error || !booking) {
            console.error("Booking Details Fetch Error:", error);
            return { success: false, error: "Booking not found" };
        }

        // RBAC CHECK
        if (profile.role !== "super_admin") {
            // @ts-ignore - Supabase types inference can be tricky with nested relations
            const bookingOwnerId = booking.room?.hotel?.owner_id;
            if (bookingOwnerId !== user.id) {
                return { success: false, error: "Unauthorized access to this booking" };
            }
        }

        // 3. Decrypt Sensitive Data
        let guestPassport = "N/A";
        let guestPhone = "N/A";
        let specialRequests = "";

        try {
            if (booking.guest_passport_encrypted) {
                guestPassport = await decrypt(booking.guest_passport_encrypted);
            }
            if (booking.guest_phone_encrypted) {
                guestPhone = await decrypt(booking.guest_phone_encrypted);
            }
            if (booking.special_requests_encrypted) {
                specialRequests = await decrypt(booking.special_requests_encrypted);
            }
        } catch (decryptError) {
            console.error("Decryption Error:", decryptError);
            guestPassport = "[Decryption Failed]";
            guestPhone = "[Decryption Failed]";
        }

        // @ts-ignore
        const guestName = profile?.full_name || "Guest";

        return {
            success: true,
            data: {
                ...booking,
                guestPassport,
                guestPhone,
                specialRequests,
                guestName
            }
        };

    } catch (error) {
        console.error("Unexpected error in getBookingDetails:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}
