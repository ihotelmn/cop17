"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getAllBookings } from "@/app/actions/booking-admin";
import { toast } from "sonner";

export function ExportButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        setIsLoading(true);
        try {
            const result = await getAllBookings();

            if (!result.success || !result.data) {
                toast.error("Failed to fetch data for export");
                return;
            }

            const bookings = result.data;
            if (bookings.length === 0) {
                toast.info("No bookings to export");
                return;
            }

            // Convert to CSV
            const headers = ["ID", "Guest Name", "Hotel", "Room", "Check In", "Check Out", "Status", "Amount", "Dates"];
            const rows = bookings.map(b => [
                b.id,
                `"${b.guestName.replace(/"/g, '""')}"`, // Escape quotes
                `"${b.hotelName.replace(/"/g, '""')}"`,
                `"${b.roomName.replace(/"/g, '""')}"`,
                b.checkIn,
                b.checkOut,
                b.status,
                b.amount,
                `"${b.dates}"`
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(r => r.join(","))
            ].join("\n");

            // Trigger Download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `bookings-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Export successful");

        } catch (error) {
            console.error("Export error:", error);
            toast.error("An unexpected error occurred during export");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isLoading}
            className="gap-2"
        >
            <Download className="h-4 w-4" />
            {isLoading ? "Exporting..." : "Export CSV"}
        </Button>
    );
}
