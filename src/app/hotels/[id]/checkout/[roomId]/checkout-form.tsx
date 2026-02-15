"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, ArrowRight, CreditCard, User, Mail, Phone, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBookingAction } from "@/app/actions/booking";
import { cn } from "@/lib/utils";

interface CheckoutFormProps {
    hotelId: string;
    roomId: string;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
}

export function CheckoutForm({
    hotelId,
    roomId,
    checkIn,
    checkOut,
    totalPrice,
}: CheckoutFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        formData.append("hotelId", hotelId);
        formData.append("roomId", roomId);
        formData.append("checkIn", format(checkIn, "yyyy-MM-dd"));
        formData.append("checkOut", format(checkOut, "yyyy-MM-dd"));

        try {
            const result = await createBookingAction({}, formData);
            if (result.success) {
                if (result.paymentRedirectUrl) {
                    window.location.href = result.paymentRedirectUrl;
                }
            } else {
                setError(result.error || "Failed to create booking");
            }
        } catch (e) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="guestName" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <User className="h-3.5 w-3.5" />
                        Full Name (as in Passport)
                    </Label>
                    <Input
                        id="guestName"
                        name="guestName"
                        required
                        placeholder="John Doe"
                        className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="guestEmail" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <Mail className="h-3.5 w-3.5" />
                        Email Address
                    </Label>
                    <Input
                        id="guestEmail"
                        name="guestEmail"
                        type="email"
                        required
                        placeholder="john@example.com"
                        className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="guestPassport" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <Fingerprint className="h-3.5 w-3.5" />
                        Passport Number
                    </Label>
                    <Input
                        id="guestPassport"
                        name="guestPassport"
                        required
                        placeholder="E12345678"
                        className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="guestPhone" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <Phone className="h-3.5 w-3.5" />
                        Phone Number
                    </Label>
                    <Input
                        id="guestPhone"
                        name="guestPhone"
                        required
                        placeholder="+976 9911 2233"
                        className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="specialRequests" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Special Requests (Optional)
                </Label>
                <textarea
                    id="specialRequests"
                    name="specialRequests"
                    className="w-full min-h-[100px] rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="E.g. High floor, dietary requirements, early check-in, etc."
                />
            </div>

            {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                    {error}
                </div>
            )}

            <div className="pt-6">
                <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 rounded-xl"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Securing Your Room...
                        </>
                    ) : (
                        <span className="flex items-center gap-2">
                            Proceed to Payment (${totalPrice})
                            <ArrowRight className="h-5 w-5" />
                        </span>
                    )}
                </Button>
                <div className="mt-4 flex items-center justify-center gap-4 grayscale opacity-50">
                    {/* Mock payment logos */}
                    <div className="text-[10px] font-bold border px-2 py-1 rounded">VISA</div>
                    <div className="text-[10px] font-bold border px-2 py-1 rounded">MASTERCARD</div>
                    <div className="text-[10px] font-bold border px-2 py-1 rounded">GOLOMT BANK</div>
                </div>
            </div>
        </form>
    );
}
