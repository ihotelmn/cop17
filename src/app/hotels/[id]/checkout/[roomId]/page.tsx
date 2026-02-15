import { getPublicRoom } from "@/app/actions/public";
import { notFound } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { CheckoutForm } from "./checkout-form";
import { ShieldCheck, Calendar, Users, MapPin, Building2 } from "lucide-react";
import Image from "next/image";

interface CheckoutPageProps {
    params: Promise<{ id: string; roomId: string }>;
    searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
    const { id: hotelId, roomId } = await params;
    const { from, to } = await searchParams;

    const room = await getPublicRoom(roomId);

    if (!room) {
        notFound();
    }

    const hotel = room.hotel;

    // Default dates if missing
    const checkIn = from ? new Date(from) : new Date();
    const checkOut = to ? new Date(to) : new Date(new Date().setDate(new Date().getDate() + 1));

    const nights = Math.max(1, differenceInDays(checkOut, checkIn));
    const totalPrice = room.price_per_night * nights;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 pt-10">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Complete Your Booking</h1>
                    <p className="text-muted-foreground mt-2">
                        Review your stay details and enter guest information to secure your room.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Checkout Form */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    Guest Information
                                </h2>
                            </div>
                            <div className="p-6">
                                <CheckoutForm
                                    hotelId={hotelId}
                                    roomId={roomId}
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    totalPrice={totalPrice}
                                />
                            </div>
                        </section>

                        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                            <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Secure Checkout:</strong> Your information is protected by 256-bit SSL encryption. We take your privacy seriously.
                            </p>
                        </div>
                    </div>

                    {/* Right: Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                    <h2 className="text-lg font-bold">Reservation Summary</h2>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Hotel & Room Mini-Card */}
                                    <div className="flex gap-4">
                                        <div className="h-20 w-20 rounded-lg overflow-hidden bg-zinc-100 shrink-0 relative">
                                            {hotel.images?.[0] ? (
                                                <img
                                                    src={hotel.images[0]}
                                                    alt={hotel.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Building2 className="h-8 w-8 text-zinc-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm leading-snug">{hotel.name}</h3>
                                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {hotel.address || "Ulaanbaatar"}
                                            </p>
                                            <p className="text-xs font-medium text-blue-600 mt-2 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded w-fit">
                                                {room.name}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Dates Detail */}
                                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-100 dark:border-zinc-800">
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Check-in</p>
                                            <p className="text-sm font-bold">{format(checkIn, "EEE, MMM d")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Check-out</p>
                                            <p className="text-sm font-bold">{format(checkOut, "EEE, MMM d")}</p>
                                        </div>
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">${room.price_per_night} x {nights} nights</span>
                                            <span className="font-medium">${totalPrice}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Service Fee</span>
                                            <span className="font-medium text-green-600">FREE</span>
                                        </div>
                                        <div className="border-t border-zinc-100 dark:border-zinc-800 mt-4 pt-4 flex justify-between items-end">
                                            <span className="font-bold text-zinc-900 dark:text-white">Total Amount</span>
                                            <span className="text-2xl font-black text-blue-600">${totalPrice}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-xl">
                                <h3 className="font-bold flex items-center gap-2 mb-4">
                                    <ShieldCheck className="h-5 w-5 text-green-400" />
                                    Book with Confidence
                                </h3>
                                <ul className="text-xs space-y-3 text-zinc-400">
                                    <li className="flex gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                                        Official COP17 accommodation partner.
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                                        Instant confirmation after payment.
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                                        Secure transaction powered by Golomt Bank.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
