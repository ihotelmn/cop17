import { getPublicHotel, getPublicRooms } from "@/app/actions/public";
import { notFound } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { CheckoutForm } from "./checkout-form";
import { ShieldCheck, Users, MapPin, Building2 } from "lucide-react";
import { FallbackImage } from "@/components/ui/fallback-image";

interface CheckoutPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
    const { id: hotelId } = await params;
    const resolvedParams = await searchParams;
    const { from, to } = resolvedParams;
    const returnHotelParams = new URLSearchParams(
        Object.entries(resolvedParams).filter(([, value]) => Boolean(value)) as [string, string][]
    ).toString();
    const returnHotelHref = `/hotels/${hotelId}${returnHotelParams ? `?${returnHotelParams}` : ""}`;
    // Dates are REQUIRED for checkout
    if (!from || !to) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Stay dates not selected</h1>
                <p className="text-zinc-500 mb-8">Please go back to the hotel page and select your check-in and check-out dates before booking.</p>
                <a href={returnHotelHref} className="px-6 py-3 bg-blue-600 outline-none text-white rounded-xl font-bold">
                    Return to Hotel
                </a>
            </div>
        );
    }

    const hotel = await getPublicHotel(hotelId);
    if (!hotel) {
        notFound();
    }

    const allRooms = await getPublicRooms(hotelId, undefined, from, to);

    // Parse dates with T12:00:00 to prevent timezone shift
    const checkIn = new Date(`${from}T12:00:00`);
    const checkOut = new Date(`${to}T12:00:00`);
    const nights = Math.max(1, differenceInDays(checkOut, checkIn));

    // Calculate selected rooms
    const selectedRooms = [];
    let totalPrice = 0;
    let totalQuantity = 0;

    for (const [key, value] of Object.entries(resolvedParams)) {
        if (key.startsWith("r_") && value) {
            const roomId = key.replace("r_", "");
            const quantity = parseInt(value);
            if (quantity > 0) {
                // @ts-ignore
                const room = allRooms.find((r: any) => r.id === roomId);
                if (room) {
                    selectedRooms.push({
                        id: room.id,
                        name: room.name,
                        price: room.price_per_night,
                        quantity
                    });
                    totalPrice += room.price_per_night * quantity * nights;
                    totalQuantity += quantity;
                }
            }
        }
    }

    if (selectedRooms.length === 0) {
        // No rooms selected? Return to hotel page
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">No rooms selected</h1>
                <p className="text-zinc-500 mb-8">Please go back to the hotel page and select at least one room.</p>
                <a href={returnHotelHref} className="px-6 py-3 bg-blue-600 outline-none text-white rounded-xl font-bold">
                    Return to Hotel
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 pb-20 pt-6 dark:bg-zinc-950 sm:pt-10">
            <div className="container mx-auto max-w-5xl px-4">
                <div className="mb-8 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Checkout</p>
                            <h1 className="mt-2 text-3xl font-bold tracking-tight">Complete Your Booking</h1>
                            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                                Review your stay details and enter guest information to secure your rooms.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
                            <div className="rounded-2xl bg-zinc-50 px-3 py-3 dark:bg-zinc-800/70">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Stay</p>
                                <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">{nights} night{nights > 1 ? "s" : ""}</p>
                            </div>
                            <div className="rounded-2xl bg-blue-50 px-3 py-3 dark:bg-blue-950/20">
                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Rooms</p>
                                <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">{totalQuantity} selected</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
                    <div className="flex items-start gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                            {/* @ts-ignore */}
                            {hotel.images?.[0] ? (
                                <FallbackImage
                                    // @ts-ignore
                                    src={hotel.images[0]}
                                    alt={hotel.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Building2 className="h-8 w-8 text-zinc-300" />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="line-clamp-2 text-base font-black tracking-tight text-zinc-950 dark:text-white">
                                {hotel.name}
                            </h2>
                            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="line-clamp-1">{hotel.address || "Ulaanbaatar"}</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                        <div className="rounded-2xl bg-zinc-50 px-3 py-3 dark:bg-zinc-800/60">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Dates</p>
                            <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                                {format(checkIn, "MMM d")} - {format(checkOut, "MMM d")}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-blue-50 px-3 py-3 dark:bg-blue-950/20">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Total</p>
                            <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">${totalPrice}</p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {selectedRooms.map((room) => (
                            <div key={room.id} className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-3 text-sm dark:bg-zinc-800/60">
                                <span className="min-w-0 pr-3 font-bold capitalize text-zinc-900 dark:text-zinc-100">
                                    {room.quantity}x {room.name.replace(/standart/ig, "Standard")}
                                </span>
                                <span className="shrink-0 font-black text-zinc-500">${room.price * room.quantity * nights}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="border-b border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-800/50 sm:p-6">
                                <h2 className="flex items-center gap-2 text-xl font-bold">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    Guest Information
                                </h2>
                            </div>
                            <div className="p-5 sm:p-6">
                                <CheckoutForm
                                    hotelId={hotelId}
                                    selectedRooms={selectedRooms}
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    totalPrice={totalPrice}
                                />
                            </div>
                        </section>

                        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
                            <ShieldCheck className="h-6 w-6 shrink-0 text-blue-600" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Secure Checkout:</strong> Your information is protected by 256-bit SSL encryption. We take your privacy seriously.
                            </p>
                        </div>
                    </div>

                    <div className="hidden lg:col-span-1 lg:block">
                        <div className="sticky top-24 space-y-6">
                            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="border-b border-zinc-100 p-6 dark:border-zinc-800">
                                    <h2 className="text-lg font-bold">Reservation Summary</h2>
                                </div>

                                <div className="space-y-6 p-6">
                                    <div className="flex gap-4">
                                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                                            {/* @ts-ignore */}
                                            {hotel.images?.[0] ? (
                                                <FallbackImage
                                                    // @ts-ignore
                                                    src={hotel.images[0]}
                                                    alt={hotel.name}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Building2 className="h-8 w-8 text-zinc-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold leading-snug">{hotel.name}</h3>
                                            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                                                <MapPin className="h-3 w-3" />
                                                {hotel.address || "Ulaanbaatar"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Rooms Selected ({totalQuantity})</p>
                                        {selectedRooms.map((room) => (
                                            <div key={room.id} className="flex items-center justify-between text-sm">
                                                <span className="font-medium capitalize text-blue-700 dark:text-blue-300">
                                                    {room.quantity}x {room.name.replace(/standart/ig, "Standard")}
                                                </span>
                                                <span className="text-zinc-500">${room.price * room.quantity * nights}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-y border-zinc-100 py-4 dark:border-zinc-800">
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Check-in</p>
                                            <p className="text-sm font-bold">{format(checkIn, "EEE, MMM d")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Check-out</p>
                                            <p className="text-sm font-bold">{format(checkOut, "EEE, MMM d")}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Service Fee</span>
                                            <span className="font-medium text-green-600">FREE</span>
                                        </div>
                                        <div className="mt-4 flex items-end justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                            <span className="font-bold text-zinc-900 dark:text-white">Total Amount</span>
                                            <span className="text-2xl font-black text-blue-600">${totalPrice}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-zinc-900 p-6 text-white shadow-xl">
                                <h3 className="mb-4 flex items-center gap-2 font-bold">
                                    <ShieldCheck className="h-5 w-5 text-green-400" />
                                    Book with Confidence
                                </h3>
                                <ul className="space-y-3 text-xs text-zinc-400">
                                    <li className="flex gap-2">
                                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        Official COP17 accommodation partner.
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        Instant confirmation after payment.
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
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
