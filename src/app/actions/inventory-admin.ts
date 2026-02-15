"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
    addDays,
    format,
    startOfDay,
    parseISO,
    isWithinInterval,
    eachDayOfInterval
} from "date-fns";

export async function getInventoryStats(startDateStr?: string, days: number = 21) {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, error: "Profile not found" };

    const start = startDateStr ? parseISO(startDateStr) : startOfDay(new Date());
    const end = addDays(start, days - 1);

    const dateRange = eachDayOfInterval({ start, end });
    const formattedDateRange = dateRange.map(d => format(d, "yyyy-MM-dd"));

    try {
        // 1. Fetch Hotels and Rooms
        let hotelsQuery = adminClient.from("hotels").select("id, name");
        if (profile.role !== "super_admin") {
            hotelsQuery = hotelsQuery.eq("owner_id", user.id);
        }
        const { data: hotels } = await hotelsQuery;
        const hotelIds = hotels?.map(h => h.id) || [];

        if (hotelIds.length === 0) {
            return { success: true, data: { dates: formattedDateRange, rooms: [] } };
        }

        const { data: rooms } = await adminClient
            .from("rooms")
            .select("id, name, hotel_id, total_inventory")
            .in("hotel_id", hotelIds);

        const roomIds = rooms?.map(r => r.id) || [];

        // 2. Fetch Bookings for this period
        // We fetch bookings that overlap with our range
        const { data: bookings } = await adminClient
            .from("bookings")
            .select("room_id, check_in_date, check_out_date, status")
            .in("room_id", roomIds)
            .in("status", ["confirmed", "pending", "blocked", "paid"])
            .lte("check_in_date", format(end, "yyyy-MM-dd"))
            .gte("check_out_date", format(start, "yyyy-MM-dd"));

        // 3. Process Data for Grid
        const gridData = rooms?.map(room => {
            const hotel = hotels?.find(h => h.id === room.hotel_id);

            const dailyStats = formattedDateRange.map(dateStr => {
                const currentDate = parseISO(dateStr);

                // Count bookings for this room on this specific date
                const bookedCount = bookings?.filter(b => {
                    if (b.room_id !== room.id) return false;
                    const bStart = parseISO(b.check_in_date);
                    const bEnd = parseISO(b.check_out_date);

                    // A guest occupies the room from Check-in until the morning of Check-out
                    return currentDate >= bStart && currentDate < bEnd;
                }).length || 0;

                return {
                    date: dateStr,
                    booked: bookedCount,
                    available: Math.max(0, room.total_inventory - bookedCount)
                };
            });

            return {
                roomId: room.id,
                roomName: room.name,
                hotelName: hotel?.name || "Unknown",
                totalInventory: room.total_inventory,
                days: dailyStats
            };
        }) || [];

        return {
            success: true,
            data: {
                dates: formattedDateRange,
                rooms: gridData
            }
        };

    } catch (error) {
        console.error("Error in getInventoryStats:", error);
        return { success: false, error: "Failed to fetch inventory stats" };
    }
}
