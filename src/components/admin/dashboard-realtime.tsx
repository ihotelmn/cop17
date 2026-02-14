"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardStatsGrid } from "./dashboard-stats-grid";
import { getDashboardStats } from "@/app/actions/booking-admin";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DashboardRealtimeProps {
    initialStats: any; // Using any for simplicity in matching return type of server action
}

export function DashboardRealtime({ initialStats }: DashboardRealtimeProps) {
    const [stats, setStats] = useState(initialStats);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const supabase = createClient();

        console.log("Subscribing to realtime updates for bookings...");

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
                    console.log('Change received!', payload);

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
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("Successfully subscribed to bookings changes");
                }
            });

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
