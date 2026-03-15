"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardStatsGrid } from "./dashboard-stats-grid";
import type { DashboardStats } from "./dashboard-stats-grid";
import { getDashboardStats } from "@/app/actions/booking-admin";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DashboardRealtimeProps {
    initialStats: DashboardStats;
}

export function DashboardRealtime({ initialStats }: DashboardRealtimeProps) {
    const [stats, setStats] = useState(initialStats);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel('dashboard-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings'
                },
                async (payload) => {
                    // Show toast notification based on event type
                    if (payload.eventType === 'INSERT') {
                        toast.success("New booking received!", {
                            description: "Dashboard stats updated."
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        toast.info("Booking updated", {
                            description: "Dashboard stats refreshed."
                        });
                    }

                    // Refresh stats using Server Action
                    startTransition(async () => {
                        const result = await getDashboardStats();
                        if (result.success && result.data) {
                            setStats(result.data);
                            router.refresh(); // Also refresh server components if needed
                        }
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    return (
        <div className={isPending ? "opacity-70 transition-opacity" : ""}>
            <DashboardStatsGrid stats={stats} />
        </div>
    );
}
