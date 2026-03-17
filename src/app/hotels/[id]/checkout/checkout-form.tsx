"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, ArrowRight, User, Mail, Phone, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBookingAction } from "@/app/actions/booking";
import { formatUsd } from "@/lib/utils";

interface CheckoutFormProps {
    hotelId: string;
    selectedRooms: { id: string; name: string; quantity: number; price: number }[];
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
}

export function CheckoutForm({
    hotelId,
    selectedRooms,
    checkIn,
    checkOut,
    totalPrice,
}: CheckoutFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeAction, setActiveAction] = useState<"pay_now" | "prebook" | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const bookingMode = submitter?.value === "prebook" ? "prebook" : "pay_now";

        setLoading(true);
        setActiveAction(bookingMode);
        setError(null);

        const formData = new FormData(event.currentTarget);
        formData.append("hotelId", hotelId);
        formData.append("bookingMode", bookingMode);
        formData.append("roomsData", JSON.stringify(selectedRooms));
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
        } catch (caughtError: any) {
            console.error("Checkout submission error:", caughtError);
            const detail = caughtError?.message || JSON.stringify(caughtError);
            setError(`Connection or Server Error: ${detail}`);
        } finally {
            setLoading(false);
            setActiveAction(null);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8" id="checkout-form">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
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
                        className="h-14 bg-zinc-50 text-base dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-blue-500 sm:h-12 sm:text-sm"
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
                        className="h-14 bg-zinc-50 text-base dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-blue-500 sm:h-12 sm:text-sm"
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
                        className="h-14 bg-zinc-50 text-base dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-blue-500 sm:h-12 sm:text-sm"
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
                        className="h-14 bg-zinc-50 text-base dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-blue-500 sm:h-12 sm:text-sm"
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
                ></textarea>
            </div>

            {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                    {error}
                </div>
            )}

            <div className="pt-6 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                    <Button
                        type="submit"
                        name="bookingMode"
                        value="pay_now"
                        className="h-14 rounded-2xl bg-blue-600 text-base font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 sm:h-[3.75rem] sm:text-lg"
                        disabled={loading}
                    >
                        {loading && activeAction === "pay_now" ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Redirecting to Payment...
                            </>
                        ) : (
                            <span className="flex items-center gap-2 text-center">
                                Pay Now ({formatUsd(totalPrice)})
                                <ArrowRight className="h-5 w-5" />
                            </span>
                        )}
                    </Button>

                    <Button
                        type="submit"
                        name="bookingMode"
                        value="prebook"
                        variant="outline"
                        className="h-14 rounded-2xl border-zinc-300 bg-white text-base font-bold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 sm:h-[3.75rem] sm:text-lg"
                        disabled={loading}
                    >
                        {loading && activeAction === "prebook" ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Sending Request...
                            </>
                        ) : (
                            <span className="flex items-center gap-2 text-center">
                                Pre-book
                                <ArrowRight className="h-5 w-5" />
                            </span>
                        )}
                    </Button>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
                    <p className="font-semibold text-zinc-900 dark:text-white">Pre-book</p>
                    <p>
                        Send a reservation request without immediate payment. Our team will review it, contact you directly, and confirm the booking after offline payment is received.
                    </p>
                </div>
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
