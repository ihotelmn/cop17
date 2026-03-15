"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, XCircle, Clock, Loader2, Eye } from "lucide-react";
import { updateBookingStatus } from "@/app/actions/booking-admin";
import { toast } from "sonner";
import { BookingDetailsDialog } from "./booking-details-dialog";
import { getAllowedBookingStatusTransitions } from "@/lib/booking-status";

interface BookingActionsProps {
    bookingId: string;
    currentStatus: string;
}

export function BookingActions({ bookingId, currentStatus }: BookingActionsProps) {
    const [loading, setLoading] = useState(false);
    const allowedTransitions = getAllowedBookingStatusTransitions(currentStatus);

    const handleStatusUpdate = async (newStatus: string) => {
        if (loading) return;
        setLoading(true);
        try {
            const result = await updateBookingStatus(bookingId, newStatus);
            if (result.success) {
                toast.success("Booking status updated");
            } else {
                toast.error(result.error || "Failed to update status");
            }
        } catch {
            toast.error("An error occurred while updating this booking");
        } finally {
            setLoading(false);
        }
    };

    const statusActions = [
        {
            value: "confirmed",
            label: "Mark Confirmed",
            icon: <CheckCircle className="mr-2 h-4 w-4 text-green-500" />,
        },
        {
            value: "checked-in",
            label: "Mark Checked In",
            icon: <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />,
        },
        {
            value: "completed",
            label: "Mark Completed",
            icon: <CheckCircle className="mr-2 h-4 w-4 text-violet-500" />,
        },
        {
            value: "cancelled",
            label: "Cancel Booking",
            icon: <XCircle className="mr-2 h-4 w-4" />,
            className: "text-red-600",
        },
    ].filter((action) => allowedTransitions.includes(action.value as typeof allowedTransitions[number]));

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <BookingDetailsDialog
                    bookingId={bookingId}
                    trigger={
                        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                    }
                />
                <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(bookingId)}
                >
                    Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                {statusActions.length === 0 ? (
                    <DropdownMenuItem disabled>
                        <Clock className="mr-2 h-4 w-4 text-zinc-400" />
                        No valid transitions
                    </DropdownMenuItem>
                ) : (
                    statusActions.map((action) => (
                        <DropdownMenuItem
                            key={action.value}
                            onClick={() => handleStatusUpdate(action.value)}
                            className={action.className}
                        >
                            {action.icon}
                            {action.label}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
