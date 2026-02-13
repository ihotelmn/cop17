import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export function BookingStatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();

    if (s === "confirmed" || s === "paid") {
        return (
            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="mr-1 h-3 w-3" /> Confirmed
            </Badge>
        );
    }

    if (s === "pending") {
        return (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="mr-1 h-3 w-3" /> Pending
            </Badge>
        );
    }

    if (s === "checked-in") {
        return (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                <CheckCircle className="mr-1 h-3 w-3" /> Checked In
            </Badge>
        );
    }

    if (s === "cancelled") {
        return (
            <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="mr-1 h-3 w-3" /> Cancelled
            </Badge>
        );
    }

    return (
        <Badge variant="outline">
            <AlertCircle className="mr-1 h-3 w-3" /> {status}
        </Badge>
    );
}
