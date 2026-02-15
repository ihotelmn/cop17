"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
    data: any[];
    filename: string;
}

export function ExportButton({ data, filename }: ExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) return;

        // 1. Define CSV headers
        const headers = [
            "ID",
            "Created At",
            "Hotel",
            "Room",
            "Total Price",
            "Status",
            "Check In",
            "Check Out",
            "Currency"
        ];

        // 2. Map data to rows
        const rows = data.map(b => [
            b.id,
            b.created_at,
            b.rooms?.hotels?.name || "Unknown Hotel",
            b.rooms?.name || "Unknown Room",
            b.total_price,
            b.status,
            b.check_in_date,
            b.check_out_date,
            "USD"
        ]);

        // 3. Create CSV string
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        // 4. Trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button
            onClick={handleExport}
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
        >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
    );
}
