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

interface BookingActionsProps {
    bookingId: string;
    currentStatus: string;
}

export function BookingActions({ bookingId, currentStatus }: BookingActionsProps) {
    const [loading, setLoading] = useState(false);

    const handleStatusUpdate = async (newStatus: string) => {
        if (loading) return;
        setLoading(true);
        try {
            const result = await updateBookingStatus(bookingId, newStatus);
            if (result.success) {
                // Toast success
            } else {
                alert("Failed to update status: " + result.error);
            }
        } catch (e) {
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

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
                        <DropdownMenuItem onSelect={(e: any) => e.preventDefault()}>
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
                <DropdownMenuItem onClick={() => handleStatusUpdate("confirmed")}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Mark Confirmed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate("pending")}>
                    <Clock className="mr-2 h-4 w-4 text-amber-500" />
                    Mark Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate("checked-in")}>
                    <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                    Mark Checked In
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusUpdate("cancelled")} className="text-red-600">
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Booking
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
