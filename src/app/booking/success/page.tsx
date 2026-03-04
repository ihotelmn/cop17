import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { CheckCircle2, ArrowRight, MapPin, Calendar, Building2, User, Mail, ShieldCheck, Printer, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

interface SuccessPageProps {
    searchParams: Promise<{ groupId?: string }>;
}

export default async function BookingSuccessPage({ searchParams }: SuccessPageProps) {
    const { groupId } = await searchParams;

    if (!groupId) {
        notFound();
    }

    const supabase = await createClient();

    // Fetch all bookings in this group
    const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
      id,
      check_in_date,
      check_out_date,
      total_price,
      guest_name,
      guest_email,
      room:rooms (
        name,
        hotel:hotels (
          name,
          address,
          latitude,
          longitude,
          check_in_time,
          check_out_time,
          contact_phone,
          images
        )
      )
    `)
        .eq("group_id", groupId);

    if (error || !bookings || bookings.length === 0) {
        console.error("Error fetching bookings:", error);
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
                <h1 className="text-xl font-bold">Booking not found</h1>
                <p className="text-zinc-500 mt-2">We couldn't find the details for this transaction.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Return Home</Link>
                </Button>
            </div>
        );
    }

    const firstBooking = bookings[0];
    // @ts-ignore
    const hotel = firstBooking.room?.hotel;
    const hotelName = hotel?.name || "The Hotel";
    const checkIn = new Date(firstBooking.check_in_date);
    const checkOut = new Date(firstBooking.check_out_date);

    // Group rooms by name and quantity
    const roomSummary = bookings.reduce((acc: any, curr: any) => {
        const name = curr.room?.name || "Room";
        if (!acc[name]) acc[name] = { count: 0, price: curr.total_price };
        acc[name].count += 1;
        return acc;
    }, {});

    const totalPrice = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 md:py-20">
            <div className="max-w-4xl mx-auto">

                {/* SUCCESS HEADER */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="mx-auto h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/10">
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
                        Your stay is confirmed!
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-lg mx-auto font-medium">
                        Booking ID: <span className="text-zinc-900 dark:text-white font-bold">#{groupId.slice(0, 8).toUpperCase()}</span>
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
                        A confirmation email has been sent to <span className="text-blue-600 font-bold">{firstBooking.guest_email}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* MAIN DETAILS */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* HOTEL & DATES CARD */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                            <div className="p-6 md:p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck className="h-4 w-4 text-blue-600" />
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Official Reservation</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight mb-2">
                                            {hotelName}
                                        </h2>
                                        <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400 font-medium italic">
                                            <MapPin className="h-4 w-4 mr-1.5 shrink-0" />
                                            {hotel?.address}
                                        </div>
                                    </div>
                                    {hotel?.images?.[0] && (
                                        <div className="w-full md:w-32 h-24 rounded-2xl overflow-hidden shadow-lg shadow-zinc-900/10 shrink-0">
                                            <img src={hotel.images[0]} alt={hotelName} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Check-In</p>
                                        <p className="text-lg font-bold text-zinc-900 dark:text-white">{format(checkIn, "EEE, MMM d, yyyy")}</p>
                                        <p className="text-sm text-zinc-500">{hotel?.check_in_time || "After 2:00 PM"}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Check-Out</p>
                                        <p className="text-lg font-bold text-zinc-900 dark:text-white">{format(checkOut, "EEE, MMM d, yyyy")}</p>
                                        <p className="text-sm text-zinc-500">{hotel?.check_out_time || "Before 12:00 PM"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GUEST & ROOMS CARD */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                            <div className="p-8">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-zinc-400" />
                                    Room Details
                                </h3>

                                <div className="space-y-4">
                                    {Object.entries(roomSummary).map(([name, data]: [string, any]) => (
                                        <div key={name} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-900 dark:text-white">
                                                    {data.count}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{name}</p>
                                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-tight">Main Guest: {firstBooking.guest_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-zinc-900 dark:text-white">${data.price * data.count}</p>
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase">Total for stay</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* LOCATION CARD */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
                            <div className="p-8">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-3">
                                    <Navigation className="h-5 w-5 text-zinc-400" />
                                    Getting There
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 font-medium">
                                    The hotel is located in the central district. Shuttle services are available for delegates.
                                </p>

                                <div className="flex gap-4">
                                    <Button asChild variant="outline" className="flex-1 h-12 rounded-xl text-blue-600 border-blue-100 hover:bg-blue-50 font-bold">
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${hotel?.latitude},${hotel?.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Navigation className="h-4 w-4 mr-2" /> Get Directions
                                        </a>
                                    </Button>
                                    <Button asChild variant="outline" className="flex-1 h-12 rounded-xl font-bold">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${hotel?.latitude},${hotel?.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <MapPin className="h-4 w-4 mr-2" /> View on Map
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR: ACTIONS & SUMMARY */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900 dark:bg-blue-600 text-white rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Total Paid</p>
                            <h3 className="text-4xl font-black mb-6">${totalPrice}</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                    <Mail className="h-4 w-4 text-white/60" />
                                    {firstBooking.guest_email}
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                    <Calendar className="h-4 w-4 text-white/60" />
                                    {format(checkIn, "MMM d")} - {format(checkOut, "MMM d")}
                                </div>
                            </div>

                            <Button className="w-full h-14 bg-white text-zinc-900 hover:bg-zinc-100 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/20" onClick={() => window.print()}>
                                <Printer className="h-4 w-4 mr-2" /> Print Confirmation
                            </Button>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-4 animate-in fade-in slide-in-from-right-4 duration-700 delay-250">
                            <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-tighter text-xs">Important Information</h4>
                            <ul className="text-xs text-zinc-500 space-y-3 font-medium">
                                <li className="flex gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                                    Bring your passport for check-in identification.
                                </li>
                                <li className="flex gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                                    Official shuttle runs every 30 minutes from the airport.
                                </li>
                                <li className="flex gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                                    Free Wi-Fi is included in all delegate rooms.
                                </li>
                            </ul>
                        </div>

                        <Button asChild variant="link" className="w-full text-zinc-400 hover:text-blue-600 font-bold uppercase tracking-widest text-[10px]">
                            <Link href="/">Back to iHotel Marketplace <ArrowRight className="h-3 w-3 ml-2" /></Link>
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
