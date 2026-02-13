"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBookingAction } from "@/app/actions/booking";
import { cn } from "@/lib/utils";

interface BookingFormProps {
    hotelId: string;
    roomId: string; // This corresponds to room_type_id in DB schema likely, or room_id
    roomName: string;
    price: number;
    checkIn: Date;
    checkOut: Date;
    onSuccess?: () => void;
}

export function BookingForm({
    hotelId,
    roomId,
    roomName,
    price,
    checkIn,
    checkOut,
    onSuccess,
}: BookingFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        // Append technical details that might not be in inputs if they are hidden
        // actually they should be hidden inputs or passed directly if using bind, but simple formData append here
        formData.append("hotelId", hotelId);
        formData.append("roomId", roomId);
        formData.append("checkIn", format(checkIn, "yyyy-MM-dd"));
        formData.append("checkOut", format(checkOut, "yyyy-MM-dd"));
        // total price calculation could happen on server, but we can pass it if needed, or server calculates based on room price * nights

        try {
            const result = await createBookingAction({}, formData);
            if (result.success) {
                if (result.paymentRedirectUrl) {
                    window.location.href = result.paymentRedirectUrl;
                } else if (onSuccess) {
                    onSuccess();
                }
            } else {
                setError(result.error || "Failed to create booking");
            }
        } catch (e) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    // Calculate nights
    const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    const total = price * (nights > 0 ? nights : 1);

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg space-y-2 text-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between font-medium">
                    <span>Room:</span>
                    <span>{roomName}</span>
                </div>
                <div className="flex justify-between">
                    <span>Dates:</span>
                    <span>
                        {format(checkIn, "MMM d")} - {format(checkOut, "MMM d, yyyy")}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Nights:</span>
                    <span>{nights > 0 ? nights : 1}</span>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 my-2 pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${total}</span>
                </div>
            </div>

            {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                    <Label htmlFor="guestName">Full Name</Label>
                    <Input id="guestName" name="guestName" required placeholder="John Doe" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="guestEmail">Email Address</Label>
                    <Input id="guestEmail" name="guestEmail" type="email" required placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="guestPassport">Passport Number</Label>
                        <Input id="guestPassport" name="guestPassport" required placeholder="E12345678" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="guestPhone">Phone Number</Label>
                        <Input id="guestPhone" name="guestPhone" required placeholder="+976 9911..." />
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Processing..." : "Confirm Booking"}
            </Button>
        </form>
    );
}
