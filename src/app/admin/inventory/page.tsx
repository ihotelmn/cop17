import { getInventoryStats } from "@/app/actions/inventory-admin";
import { InventoryCalendar } from "@/components/admin/inventory-calendar";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/skeletons";

export default async function InventoryPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <InventoryContent />
        </Suspense>
    );
}

async function InventoryContent() {
    const res = await getInventoryStats();

    if (!res.success) {
        return (
            <div className="p-8 text-center text-red-500">
                Error loading inventory: {res.error}
            </div>
        );
    }

    return (
        <InventoryCalendar initialData={res.data} />
    );
}
