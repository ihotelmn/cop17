import { getMyBookings } from "@/app/actions/booking";
import { BookingStatusBadge } from "@/components/admin/booking-status-badge";
import { format } from "date-fns";
import { Building2, Calendar, CreditCard, TentTree } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
                <div className="mt-8 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your reservations and view history.
                    </p>
                </div>

                {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-lg border border-dashed">
                        <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="h-6 w-6 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-medium">No bookings yet</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                            You haven't made any reservations. Explore our hotels to find your perfect stay.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/hotels"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                Browse Hotels
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {bookings.map((booking: any) => {
                            const hotelImage = booking.room?.hotel?.images?.[0] || "/placeholder-hotel.jpg";
                            const checkIn = format(new Date(booking.check_in_date), "MMM d, yyyy");
                            const checkOut = format(new Date(booking.check_out_date), "MMM d, yyyy");
                            const hotelName = booking.room?.hotel?.name || "Unknown Hotel";
                            const roomName = booking.room?.name || "Unknown Room";

                            return (
                                <div key={booking.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col md:flex-row">
                                    <div className="relative w-full md:w-48 h-48 md:h-auto shrink-0 bg-zinc-100">
                                        {/* Simple Image placeholder logic if image is base64 or url */}
                                        {hotelImage && (
                                            <img
                                                src={hotelImage}
                                                alt={hotelName}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{hotelName}</h3>
                                                    <p className="text-zinc-500 text-sm flex items-center gap-1 mt-1">
                                                        <TentTree className="h-3.5 w-3.5" />
                                                        {roomName}
                                                    </p>
                                                </div>
                                                <BookingStatusBadge status={booking.status} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                                        <Calendar className="h-4 w-4 text-zinc-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dates</p>
                                                        <p className="text-sm font-medium">{checkIn} - {checkOut}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                                        <CreditCard className="h-4 w-4 text-zinc-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Price</p>
                                                        <p className="text-sm font-medium">
                                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(booking.total_price)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                            {/* Logic for action buttons can go here (Cancel, Pay, etc.) */}
                                            <button className="text-sm text-zinc-500 hover:text-zinc-900 underline">
                                                View Details
                                            </button>
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
