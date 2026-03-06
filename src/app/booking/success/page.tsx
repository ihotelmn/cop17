import { confirmBookingAction } from "@/app/actions/booking";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { format, isValid } from "date-fns";
import Link from "next/link";
import { CheckCircle2, ArrowRight, MapPin, Calendar, Building2, User, Mail, ShieldCheck, Printer, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/booking/print-button";
import { cn, getHotelImageUrl } from "@/lib/utils";

interface SuccessPageProps {
    searchParams: Promise<{ groupId?: string }>;
}

export default async function BookingSuccessPage({ searchParams }: SuccessPageProps) {
    const resolvedParams = await searchParams;
    const groupId = resolvedParams.groupId;

    if (!groupId) {
        notFound();
    }

    // CRITICAL: Trigger confirmation if it hasn't been confirmed yet
    // This will also trigger the email sending
    await confirmBookingAction(groupId, true); // true = silent (skip revalidateTag during render)


    try {
        const adminSupabase = getSupabaseAdmin();

        // Fetch all bookings in this group
        const { data: bookings, error } = await adminSupabase
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
            console.error("Booking fetch error or empty:", error);
            throw new Error("Booking records not found in our system.");
        }

        const firstBooking = bookings[0];
        // @ts-ignore
        const hotel = firstBooking.room?.hotel;
        const hotelName = hotel?.name || "The Hotel";

        const checkInDate = new Date(firstBooking.check_in_date);
        const checkOutDate = new Date(firstBooking.check_out_date);

        const safeFormat = (date: Date, fmt: string) => {
            return isValid(date) ? format(date, fmt) : "N/A";
        };

        // Group rooms summary
        const roomSummary = bookings.reduce((acc: any, curr: any) => {
            const name = curr.room?.name || "Room";
            if (!acc[name]) acc[name] = { count: 0, price: curr.total_price };
            acc[name].count += 1;
            return acc;
        }, {});

        const totalPrice = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);

        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 md:py-20 text-zinc-900 dark:text-zinc-100">
                <div className="max-w-4xl mx-auto">
                    {/* SUCCESS HEADER */}
                    <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="mx-auto h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/10">
                            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-3">Your stay is confirmed!</h1>
                        <p className="text-zinc-500 text-lg max-w-lg mx-auto font-medium">
                            Booking ID: <span className="text-zinc-900 dark:text-zinc-100 font-bold">#{groupId.slice(0, 8).toUpperCase()}</span>
                        </p>
                        <p className="text-zinc-500 text-sm mt-2">
                            A confirmation email has been sent to <span className="text-blue-600 font-bold">{firstBooking.guest_email}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                        <div className="lg:col-span-2 space-y-6">
                            {/* HOTEL CARD */}
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck className="h-4 w-4 text-blue-600" />
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Official Reservation</span>
                                        </div>
                                        <h2 className="text-2xl font-black leading-tight mb-2">{hotelName}</h2>
                                        <div className="flex items-center text-sm text-zinc-500 italic">
                                            <MapPin className="h-4 w-4 mr-1.5 shrink-0" />
                                            {hotel?.address || "Address not available"}
                                        </div>
                                    </div>
                                    {hotel?.images?.[0] && (
                                        <div className="w-full md:w-32 h-24 rounded-2xl overflow-hidden shadow-lg shrink-0">
                                            <img src={getHotelImageUrl(hotel.images[0])} alt={hotelName} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Check-In</p>
                                        <p className="text-lg font-bold">{safeFormat(checkInDate, "EEE, MMM d, yyyy")}</p>
                                        <p className="text-sm text-zinc-500">{hotel?.check_in_time || "14:00"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Check-Out</p>
                                        <p className="text-lg font-bold">{safeFormat(checkOutDate, "EEE, MMM d, yyyy")}</p>
                                        <p className="text-sm text-zinc-500">{hotel?.check_out_time || "11:00"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ROOMS CARD */}
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-zinc-400" /> Room Details
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(roomSummary).map(([name, data]: [string, any]) => (
                                        <div key={name} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center font-bold">
                                                    {data.count}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{name}</p>
                                                    <p className="text-xs text-zinc-500">Main Guest: {firstBooking.guest_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-lg">${Number(data.price || 0) * data.count}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SIDEBAR */}
                        <div className="space-y-6">
                            <div className="bg-zinc-900 text-white rounded-3xl p-8">
                                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Total Paid</p>
                                <h3 className="text-4xl font-black mb-6">${totalPrice}</h3>
                                <div className="space-y-4 mb-8 text-sm">
                                    <div className="flex items-center gap-3"><Mail className="h-4 w-4 opacity-60" /> {firstBooking.guest_email}</div>
                                    <div className="flex items-center gap-3"><Calendar className="h-4 w-4 opacity-60" /> {safeFormat(checkInDate, "MMM d")} - {safeFormat(checkOutDate, "MMM d")}</div>
                                </div>
                                <PrintButton />
                            </div>
                            <Button asChild variant="link" className="w-full text-zinc-400 hover:text-blue-600 font-bold uppercase tracking-widest text-[10px]">
                                <Link href="/">Back to iHotel <ArrowRight className="h-3 w-3 ml-2" /></Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (err) {
        console.error("Critical Success Page Error:", err);
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-950 text-white text-center">
                <div className="mb-6 h-16 w-16 bg-red-900/20 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-black mb-2">Registration system error</h1>
                <p className="text-zinc-500 mb-8 max-w-sm">
                    We confirmed your booking via email, but we had trouble displaying the details here.
                    Error: {err instanceof Error ? err.message : "Internal system failure"}
                </p>
                <Link href="/" className="px-8 py-3 bg-zinc-100 text-black rounded-xl font-bold hover:bg-white transition-colors">
                    Return to Marketplace
                </Link>
            </div>
        );
    }
}
