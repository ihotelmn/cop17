"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getBookingDetails } from "@/app/actions/booking-admin";
import { AlertTriangle, Calendar, Loader2, MessageSquare, ShieldCheck, User, XCircle } from "lucide-react";
import { format } from "date-fns";
import { getPreferredHotelName } from "@/lib/hotel-display";

interface BookingDetailsDialogProps {
    bookingId: string;
    trigger?: React.ReactNode;
}

type BookingDialogData = {
    guestPassport: string;
    guestPhone: string;
    specialRequests?: string;
    modification_request_status?: string | null;
    modification_request_message?: string | null;
    modification_requested_at?: string | null;
    status: string;
    cancelled_at?: string | null;
    cancellation_reason?: string | null;
    cancellation_penalty_percent?: number | null;
    cancellation_penalty_amount?: number | null;
    check_in_date: string;
    check_out_date: string;
    total_price: number;
    room?: {
        name?: string | null;
        hotel?: {
            name?: string | null;
            name_en?: string | null;
        } | null;
    } | null;
};

export function BookingDetailsDialog({ bookingId, trigger }: BookingDetailsDialogProps) {
    const [booking, setBooking] = useState<BookingDialogData | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const loadDetails = async () => {
        if (booking) return; // Already loaded
        setLoading(true);
        try {
            const result = await getBookingDetails(bookingId);
            if (result.success) {
                setBooking(result.data);
            } else {
                console.error("Failed to load details:", result.error);
            }
        } catch (error) {
            console.error("Error loading booking details:", error);
        } finally {
            setLoading(false);
        }
    };

    const hotelName = booking?.room?.hotel
        ? getPreferredHotelName({
            name: booking.room.hotel.name || "",
            name_en: booking.room.hotel.name_en || null,
            address: null,
            address_en: null,
            description: null,
            description_en: null,
            stars: 0,
        })
        : "Unknown Hotel";

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) loadDetails();
        }}>
            <DialogTrigger asChild>
                {trigger || <Button variant="ghost" size="sm">View Details</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Booking Details</DialogTitle>
                    <DialogDescription>
                        Decrypted guest information for administrative verification.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex h-48 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : booking ? (
                    <div className="space-y-6 pt-4">
                        {/* Guest Section */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <User className="h-3 w-3" /> Guest Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[10px] text-zinc-500 font-medium uppercase">Passport / ID</p>
                                    <p className="text-sm font-mono mt-0.5">{booking.guestPassport}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[10px] text-zinc-500 font-medium uppercase">Phone Number</p>
                                    <p className="text-sm font-mono mt-0.5">{booking.guestPhone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stay Section */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Stay Information
                            </h4>
                            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Hotel</span>
                                    <span className="font-medium">{hotelName}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Room</span>
                                    <span className="font-medium">{booking.room?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Date Range</span>
                                    <span className="font-medium">
                                        {format(new Date(booking.check_in_date), "MMM d")} - {format(new Date(booking.check_out_date), "MMM d, yyyy")}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500 font-bold">
                                        {booking.status === "prebook_requested" ? "Estimated Total" : "Total Paid"}
                                    </span>
                                    <span className="font-bold text-emerald-600">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(booking.total_price)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Special Requests */}
                        {booking.specialRequests && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                    <MessageSquare className="h-3 w-3" /> Special Requests
                                </h4>
                                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20">
                                        <p className="text-sm italic text-zinc-700 dark:text-zinc-300">
                                            &quot;{booking.specialRequests}&quot;
                                        </p>
                                </div>
                            </div>
                        )}

                        {(booking.modification_request_status || booking.modification_request_message) && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3" /> Change Request
                                </h4>
                                <div className="p-4 rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500">Status</span>
                                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                                            {booking.modification_request_status || "pending"}
                                        </span>
                                    </div>
                                    {booking.modification_requested_at && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-500">Requested</span>
                                            <span className="font-medium">
                                                {format(new Date(booking.modification_requested_at), "MMM d, yyyy HH:mm")}
                                            </span>
                                        </div>
                                    )}
                                    {booking.modification_request_message && (
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">
                                            &quot;{booking.modification_request_message}&quot;
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {(booking.status === "cancelled" || booking.cancellation_reason) && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                    <XCircle className="h-3 w-3" /> Cancellation
                                </h4>
                                <div className="p-4 rounded-lg bg-rose-50/60 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 space-y-2">
                                    {booking.cancelled_at && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-500">Cancelled</span>
                                            <span className="font-medium">
                                                {format(new Date(booking.cancelled_at), "MMM d, yyyy HH:mm")}
                                            </span>
                                        </div>
                                    )}
                                    {booking.cancellation_reason && (
                                        <div className="flex items-start justify-between gap-4 text-sm">
                                            <span className="text-zinc-500">Reason</span>
                                            <span className="font-medium text-right">{booking.cancellation_reason}</span>
                                        </div>
                                    )}
                                    {typeof booking.cancellation_penalty_percent === "number" && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-500">Penalty</span>
                                            <span className="font-medium">
                                                {booking.cancellation_penalty_percent}%{typeof booking.cancellation_penalty_amount === "number" ? ` ($${booking.cancellation_penalty_amount})` : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex justify-end gap-2 text-[10px] text-zinc-500">
                            <ShieldCheck className="h-3 w-3" />
                            System encrypted PII (AES-256-GCM)
                        </div>
                    </div>
                ) : (
                    <div className="flex h-48 items-center justify-center text-muted-foreground">
                        Failed to load booking details.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
