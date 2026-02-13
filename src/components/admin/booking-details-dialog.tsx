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
import { Loader2, User, Phone, ShieldCheck, Mail, MapPin, Calendar, CreditCard, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface BookingDetailsDialogProps {
    bookingId: string;
    trigger?: React.ReactNode;
}

export function BookingDetailsDialog({ bookingId, trigger }: BookingDetailsDialogProps) {
    const [booking, setBooking] = useState<any>(null);
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
                                    <span className="font-medium">{booking.room?.hotel?.name}</span>
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
                                    <span className="text-zinc-500 font-bold">Total Paid</span>
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
                                        "{booking.specialRequests}"
                                    </p>
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
