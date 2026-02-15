import { getMyBookings } from "@/app/actions/booking";
import { BookingStatusBadge } from "@/components/admin/booking-status-badge";
import { format } from "date-fns";
import { Building2, Calendar, CreditCard, TentTree, MapPin, Navigation, Download, Info, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function MyBookingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?next=/my-bookings");
    }

    const bookings = await getMyBookings();

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 pt-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mt-8 mb-12">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">My Bookings</h1>
                    <p className="text-zinc-500 mt-2 text-lg">
                        Manage your COP17 reservations and stay documents.
                    </p>
                </div>

                {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="mx-auto w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                            <Calendar className="h-8 w-8 text-zinc-300" />
                        </div>
                        <h3 className="text-xl font-bold">No bookings found</h3>
                        <p className="text-zinc-500 mt-2 max-w-sm mx-auto">
                            It looks like you haven't made any reservations yet.
                        </p>
                        <div className="mt-8">
                            <Button asChild size="lg" className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700">
                                <Link href="/hotels">
                                    Explore Hotels
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {bookings.map((booking: any) => {
                            const hotel = booking.room?.hotel;
                            const hotelImage = hotel?.images?.[0] || "/placeholder-hotel.jpg";
                            const checkIn = format(new Date(booking.check_in_date), "MMM d, yyyy");
                            const checkOut = format(new Date(booking.check_out_date), "MMM d, yyyy");
                            const hotelName = hotel?.name || "Unknown Hotel";
                            const roomName = booking.room?.name || "Unknown Room";
                            const address = hotel?.address || "Ulaanbaatar, Mongolia";

                            const directionsUrl = hotel?.latitude && hotel?.longitude
                                ? `https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelName + " " + address)}`;

                            return (
                                <div key={booking.id} className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col md:flex-row">
                                    <div className="relative w-full md:w-64 h-56 md:h-auto shrink-0 bg-zinc-100 overflow-hidden">
                                        <img
                                            src={hotelImage}
                                            alt={hotelName}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <BookingStatusBadge status={booking.status} />
                                        </div>
                                    </div>

                                    <div className="flex-1 p-8 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="font-black text-2xl text-zinc-900 dark:text-white tracking-tight">{hotelName}</h3>
                                                    <div className="flex items-center gap-2 mt-1 text-zinc-500">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-medium">{address}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Total</p>
                                                    <p className="text-xl font-black text-blue-600">
                                                        ${booking.total_price}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700">
                                                        <Calendar className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Stay Period</p>
                                                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{checkIn} - {checkOut}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700">
                                                        <TentTree className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Room Type</p>
                                                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{roomName}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-10 flex flex-wrap items-center gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                            <Button asChild variant="default" className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 px-6 font-bold shadow-lg shadow-zinc-900/10">
                                                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                    <Navigation className="h-4 w-4" />
                                                    Get Directions
                                                </a>
                                            </Button>

                                            <Button asChild variant="outline" className="rounded-xl h-11 px-6 border-zinc-200 dark:border-zinc-700 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                                <Link href={`/booking/receipt/${booking.id}`} target="_blank" className="flex items-center gap-2">
                                                    <Download className="h-4 w-4" />
                                                    Download Receipt
                                                </Link>
                                            </Button>

                                            <Button asChild variant="ghost" className="rounded-xl h-11 px-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold ml-auto">
                                                <Link href={`/my-bookings/${booking.id}/portal`} className="flex items-center gap-2">
                                                    Manage Booking
                                                    <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
