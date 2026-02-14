
import { getDashboardStats } from "@/app/actions/booking-admin"; // Fetch real stats
import { DashboardSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { DashboardRealtime } from "@/components/admin/dashboard-realtime";

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            {/* @ts-expect-error Async Server Component */}
            <DashboardContent />
        </Suspense>
    );
}

async function DashboardContent() {
    const { data: stats } = await getDashboardStats();

    // Default values if fetch fails
    const defaultStats = {
        totalBookings: 0,
        revenue: 0,
        activeGuests: 0,
        pendingBookings: 0,
        occupancyRate: 0
    };

    const finalStats = stats || defaultStats;

    return (
        <DashboardRealtime initialStats={finalStats} />
    );
}

