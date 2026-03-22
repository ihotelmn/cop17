import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { format, isValid } from "date-fns";
import Link from "next/link";
import { CheckCircle2, ArrowRight, MapPin, Calendar, Building2, Mail, ShieldCheck, AlertTriangle, Clock3, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/booking/print-button";
import { cn, formatUsd, roundCurrencyAmount } from "@/lib/utils";
import { getPreferredHotelAddress, getPreferredHotelName } from "@/lib/hotel-display";
import { getPaymentAttemptByGroupId } from "@/lib/payment-attempts";
import { FallbackImage } from "@/components/ui/fallback-image";
import { buildGuestBookingPortalPath } from "@/lib/guest-booking-access";

export const dynamic = "force-dynamic";

type RoomSummaryItem = {
    count: number;
    subtotal: number;
};

function getSuccessRoomName(value: unknown): string {
    if (!value) {
        return "Room";
    }

    const roomRelation = Array.isArray(value) ? value[0] : value;

    if (!roomRelation || typeof roomRelation !== "object") {
        return "Room";
    }

    const roomRecord = roomRelation as Record<string, unknown>;

    return typeof roomRecord.name === "string" && roomRecord.name.trim()
        ? roomRecord.name
        : "Room";
}

type SuccessHotelDisplay = {
    name: string;
    name_en: string | null;
    address: string | null;
    address_en: string | null;
    description: string | null;
    description_en: string | null;
    stars: number;
    latitude: number | null;
    longitude: number | null;
    check_in_time: string | null;
    check_out_time: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    website: string | null;
    images: string[] | null;
};

function getSuccessHotelRelation(value: unknown): SuccessHotelDisplay | null {
    if (!value) {
        return null;
    }

    const roomRelation = Array.isArray(value) ? value[0] : value;
    const hotelRelation = roomRelation && typeof roomRelation === "object" && "hotel" in roomRelation
        ? (roomRelation as { hotel?: unknown }).hotel
        : null;
    const hotel = Array.isArray(hotelRelation) ? hotelRelation[0] : hotelRelation;

    if (!hotel || typeof hotel !== "object") {
        return null;
    }

    const hotelRecord = hotel as Record<string, unknown>;

    return {
        name: typeof hotelRecord.name === "string" && hotelRecord.name.trim() ? hotelRecord.name : "COP17 Hotel",
        name_en: typeof hotelRecord.name_en === "string" ? hotelRecord.name_en : null,
        address: typeof hotelRecord.address === "string" ? hotelRecord.address : null,
        address_en: typeof hotelRecord.address_en === "string" ? hotelRecord.address_en : null,
        description: typeof hotelRecord.description === "string" ? hotelRecord.description : null,
        description_en: typeof hotelRecord.description_en === "string" ? hotelRecord.description_en : null,
        stars: typeof hotelRecord.stars === "number" ? hotelRecord.stars : 0,
        latitude: typeof hotelRecord.latitude === "number" ? hotelRecord.latitude : null,
        longitude: typeof hotelRecord.longitude === "number" ? hotelRecord.longitude : null,
        check_in_time: typeof hotelRecord.check_in_time === "string" ? hotelRecord.check_in_time : null,
        check_out_time: typeof hotelRecord.check_out_time === "string" ? hotelRecord.check_out_time : null,
        contact_phone: typeof hotelRecord.contact_phone === "string" ? hotelRecord.contact_phone : null,
        contact_email: typeof hotelRecord.contact_email === "string" ? hotelRecord.contact_email : null,
        website: typeof hotelRecord.website === "string" ? hotelRecord.website : null,
        images: Array.isArray(hotelRecord.images)
            ? hotelRecord.images.filter((value): value is string => typeof value === "string")
            : null,
    };
}

interface SuccessPageProps {
    searchParams: Promise<{ groupId?: string; payment?: string }>;
}

export default async function BookingSuccessPage({ searchParams }: SuccessPageProps) {
    const resolvedParams = await searchParams;
    const groupId = resolvedParams.groupId;

    if (!groupId) {
        notFound();
    }

    try {
        const adminSupabase = getSupabaseAdmin();
        const paymentAttempt = await getPaymentAttemptByGroupId(groupId);

        const { data: bookings, error } = await adminSupabase
            .from("bookings")
            .select(`
                id,
                check_in_date,
                check_out_date,
                status,
                total_price,
                service_fee,
                guest_name,
                guest_email,
                room:rooms (
                    name,
                    hotel:hotels (
                        name,
                        name_en,
                        address,
                        address_en,
                        description,
                        description_en,
                        stars,
                        latitude,
                        longitude,
                        check_in_time,
                        check_out_time,
                        contact_phone,
                        contact_email,
                        website,
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
        const hotel = getSuccessHotelRelation(firstBooking.room);
        const hotelName = hotel ? getPreferredHotelName(hotel) : "The Hotel";
        const hotelAddress = hotel ? (getPreferredHotelAddress(hotel) || "Address not available") : "Address not available";
        const hasPrebookStatus = bookings.every((booking) => booking.status === "prebook_requested");
        const isConfirmed = bookings.every(
            (booking) => booking.status === "confirmed" || booking.status === "completed"
        );
        const paymentState = resolvedParams.payment || paymentAttempt?.status || (isConfirmed ? "confirmed" : "pending");
        const isPrebookRequested = paymentState === "prebook-requested" || hasPrebookStatus;
        const isFailed = paymentState === "failed";
        const isPending = !isConfirmed && !isPrebookRequested && !isFailed;
        const hasDirectHotelContact = Boolean(
            hotel?.contact_phone || hotel?.contact_email || hotel?.website
        );
        const guestManagePath = firstBooking.guest_email
            ? buildGuestBookingPortalPath(firstBooking.id, firstBooking.guest_email)
            : null;

        const checkInDate = new Date(firstBooking.check_in_date);
        const checkOutDate = new Date(firstBooking.check_out_date);

        const safeFormat = (date: Date, fmt: string) => {
            return isValid(date) ? format(date, fmt) : "N/A";
        };

        // Group rooms summary
        const roomSummary = bookings.reduce<Record<string, RoomSummaryItem>>((acc, curr) => {
            const name = getSuccessRoomName(curr.room);
            if (!acc[name]) acc[name] = { count: 0, subtotal: 0 };
            acc[name].count += 1;
            acc[name].subtotal = roundCurrencyAmount(
                acc[name].subtotal + (Number(curr.total_price || 0) - Number(curr.service_fee || 0))
            );
            return acc;
        }, {});

        const totalPrice = roundCurrencyAmount(bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0));
        const serviceFeeTotal = roundCurrencyAmount(bookings.reduce((sum, b) => sum + Number(b.service_fee || 0), 0));
        const subtotal = roundCurrencyAmount(totalPrice - serviceFeeTotal);

        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 md:py-20 text-zinc-900 dark:text-zinc-100">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div
                            className={cn(
                                "mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6 shadow-xl",
                                isConfirmed && "bg-green-100 dark:bg-green-900/30 shadow-green-500/10",
                                isPending && "bg-amber-100 dark:bg-amber-900/30 shadow-amber-500/10",
                                isFailed && "bg-red-100 dark:bg-red-900/30 shadow-red-500/10"
                            )}
                        >
                            {isConfirmed ? (
                                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
                            ) : isPrebookRequested ? (
                                <Clock3 className="h-10 w-10 text-sky-600 dark:text-sky-400" />
                            ) : isPending ? (
                                <Clock3 className="h-10 w-10 text-amber-600 dark:text-amber-500" />
                            ) : (
                                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
                            )}
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-3">
                            {isConfirmed
                                ? "Your stay is confirmed!"
                                : isPrebookRequested
                                    ? "Pre-booking request sent"
                                : isPending
                                    ? "Payment verification in progress"
                                    : "We could not verify the payment"}
                        </h1>
                        <p className="text-zinc-500 text-lg max-w-lg mx-auto font-medium">
                            Booking ID: <span className="text-zinc-900 dark:text-zinc-100 font-bold">#{groupId.slice(0, 8).toUpperCase()}</span>
                        </p>
                        <p className="text-zinc-500 text-sm mt-2">
                            {isConfirmed ? (
                                <>
                                    A confirmation email has been sent to <span className="text-blue-600 font-bold">{firstBooking.guest_email}</span>
                                </>
                            ) : isPrebookRequested ? (
                                <>
                                    Your request has been sent to our accommodation team. We will contact <span className="text-blue-600 font-bold">{firstBooking.guest_email}</span> with the next payment steps.
                                </>
                            ) : isPending ? (
                                <>
                                    We are waiting for the payment callback before sending the confirmation email to <span className="text-blue-600 font-bold">{firstBooking.guest_email}</span>
                                </>
                            ) : (
                                <>
                                    Please retry the payment or contact support if this booking was already charged.
                                </>
                            )}
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
                                            {hotelAddress}
                                        </div>
                                    </div>
                                    {hotel?.images?.[0] && (
                                        <div className="w-full md:w-32 h-24 rounded-2xl overflow-hidden shadow-lg shrink-0">
                                            <FallbackImage
                                                src={hotel.images[0]}
                                                alt={hotelName}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                decoding="async"
                                            />
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
                                    {Object.entries(roomSummary).map(([name, data]) => (
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
                                                <p className="font-black text-lg">{formatUsd(data.subtotal)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SIDEBAR */}
                        <div className="space-y-6">
                            <div className="bg-zinc-900 text-white rounded-3xl p-8">
                                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">
                                    {isConfirmed ? "Total Paid" : isPrebookRequested ? "Estimated Total" : "Total Reserved"}
                                </p>
                                <h3 className="text-4xl font-black mb-6">{formatUsd(totalPrice)}</h3>
                                <div className="mb-6 space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/60">Accommodation subtotal</span>
                                        <span className="font-semibold">{formatUsd(subtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/60">Service fee (3%)</span>
                                        <span className="font-semibold text-blue-300">{formatUsd(serviceFeeTotal)}</span>
                                    </div>
                                </div>
                                <div className="space-y-4 mb-8 text-sm">
                                    <div className="flex items-center gap-3"><Mail className="h-4 w-4 opacity-60" /> {firstBooking.guest_email}</div>
                                    <div className="flex items-center gap-3"><Calendar className="h-4 w-4 opacity-60" /> {safeFormat(checkInDate, "MMM d")} - {safeFormat(checkOutDate, "MMM d")}</div>
                                </div>
                                {isConfirmed ? (
                                    <PrintButton />
                                ) : isPrebookRequested ? (
                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                                        Pre-booking received. Our team will review your request and contact you directly to arrange payment.
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                                        {isPending
                                            ? "Payment is being verified on the server. Refresh this page after the bank returns you here."
                                            : "This booking has not been confirmed yet because payment verification failed."}
                                    </div>
                                )}
                            </div>
                            {isConfirmed && hasDirectHotelContact && hotel && (
                                <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
                                    <p className="mb-5 text-[10px] font-black uppercase tracking-widest text-blue-600">
                                        Direct Hotel Contact
                                    </p>
                                    <div className="space-y-4 text-sm">
                                        {hotel.contact_phone && (
                                            <div className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                                                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                                                <span className="font-medium">{hotel.contact_phone}</span>
                                            </div>
                                        )}
                                        {hotel.contact_email && (
                                            <div className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                                                <span className="font-medium">{hotel.contact_email}</span>
                                            </div>
                                        )}
                                        {hotel.website && (
                                            <div className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                                                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                                                <a
                                                    href={hotel.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                                >
                                                    {hotel.website}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {(isConfirmed || isPrebookRequested) && guestManagePath && (
                                <Button asChild className="w-full rounded-2xl h-12 bg-blue-600 hover:bg-blue-700 font-bold">
                                    <Link href={guestManagePath}>
                                        Manage This Booking
                                    </Link>
                                </Button>
                            )}
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
                    We had trouble displaying your booking details right now. Please return to the homepage or contact
                    the accommodation team if this page does not recover after refresh.
                </p>
                <Link href="/" className="px-8 py-3 bg-zinc-100 text-black rounded-xl font-bold hover:bg-white transition-colors">
                    Return to Marketplace
                </Link>
            </div>
        );
    }
}
