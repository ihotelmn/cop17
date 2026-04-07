import { getBookingDetail } from "@/app/actions/booking";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ShieldCheck, MapPin, Phone, Mail, Globe } from "lucide-react";
import { PrintTrigger } from "./print-trigger";
import { getPreferredHotelAddress, getPreferredHotelName } from "@/lib/hotel-display";
import { formatUsd, roundCurrencyAmount } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ReceiptHotelDisplay = {
    name: string;
    name_en: string | null;
    address: string | null;
    address_en: string | null;
    description: string | null;
    description_en: string | null;
    stars: number;
    contact_phone: string | null;
    contact_email: string | null;
    website: string | null;
    check_in_time: string | null;
};

function getReceiptHotelRelation(value: unknown): ReceiptHotelDisplay | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const hotelRelation = "hotel" in value ? (value as { hotel?: unknown }).hotel : null;
    const normalizedHotel = Array.isArray(hotelRelation) ? hotelRelation[0] : hotelRelation;

    if (!normalizedHotel || typeof normalizedHotel !== "object") {
        return null;
    }

    const hotelRecord = normalizedHotel as Record<string, unknown>;

    return {
        name: typeof hotelRecord.name === "string" && hotelRecord.name.trim() ? hotelRecord.name : "COP17 Hotel",
        name_en: typeof hotelRecord.name_en === "string" ? hotelRecord.name_en : null,
        address: typeof hotelRecord.address === "string" ? hotelRecord.address : null,
        address_en: typeof hotelRecord.address_en === "string" ? hotelRecord.address_en : null,
        description: typeof hotelRecord.description === "string" ? hotelRecord.description : null,
        description_en: typeof hotelRecord.description_en === "string" ? hotelRecord.description_en : null,
        stars: typeof hotelRecord.stars === "number" ? hotelRecord.stars : 0,
        contact_phone: typeof hotelRecord.contact_phone === "string" ? hotelRecord.contact_phone : null,
        contact_email: typeof hotelRecord.contact_email === "string" ? hotelRecord.contact_email : null,
        website: typeof hotelRecord.website === "string" ? hotelRecord.website : null,
        check_in_time: typeof hotelRecord.check_in_time === "string" ? hotelRecord.check_in_time : null,
    };
}

interface ReceiptPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ access?: string }>;
}

type ReceiptBooking = {
    id: string;
    status: string;
    user_id: string | null;
    guest_email: string | null;
    check_in_date: string;
    check_out_date: string;
    total_price: number | string;
    service_fee?: number | string | null;
    room: {
        name: string;
        price_per_night: number | string;
        hotel?: unknown;
    };
};

export default async function ReceiptPage({ params, searchParams }: ReceiptPageProps) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const booking = await getBookingDetail(id, resolvedSearchParams.access) as ReceiptBooking | null;

    if (!booking) {
        notFound();
    }

    const hotel = getReceiptHotelRelation(booking.room);
    const hotelName = hotel ? getPreferredHotelName(hotel) : "COP17 Hotel";
    const hotelAddress = hotel ? (getPreferredHotelAddress(hotel) || "Ulaanbaatar, Mongolia") : "Ulaanbaatar, Mongolia";
    const isPrebookRequested = booking.status === "prebook_requested";
    const hasDirectHotelContact =
        !isPrebookRequested && Boolean(hotel?.contact_phone || hotel?.contact_email || hotel?.website);
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const totalPaid = roundCurrencyAmount(booking.total_price);
    const serviceFee = roundCurrencyAmount(booking.service_fee);
    const subtotal = roundCurrencyAmount(totalPaid - serviceFee);

    return (
        <div className="min-h-screen bg-white text-zinc-900 p-8 md:p-16 max-w-4xl mx-auto border-x min-w-[800px]">
            <PrintTrigger />

            <div className="flex justify-between items-start mb-16">
                <div>
                    <h1 className="text-3xl font-black mb-1">COP17 MONGOLIA</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Official Accommodation Voucher</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold">Voucher ID: <span className="text-blue-600 font-black">{booking.id}</span></p>
                    <p className="text-xs text-zinc-500">Issued on: {format(new Date(), "PP")}</p>
                </div>
            </div>

            <div className="bg-blue-600 text-white p-8 rounded-2xl mb-12 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black mb-1">
                        Status: {isPrebookRequested ? "PRE-BOOK REQUESTED" : "CONFIRMED"}
                    </h2>
                    <p className="text-blue-100 text-sm">
                        {isPrebookRequested
                            ? "Your request has been received. Our team will contact you to arrange payment."
                            : "Your reservation is fully paid and guaranteed."}
                    </p>
                </div>
                <ShieldCheck className="h-12 w-12 text-blue-200" />
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Guest Details</h3>
                    <div className="space-y-2">
                        <p className="text-lg font-bold">Delegate Booking</p>
                        <p className="text-sm text-zinc-600">{booking.guest_email || `ID: ${booking.user_id?.substring(0, 8)}...`}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Hotel Details</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-lg font-bold">{hotelName}</p>
                            <div className="flex items-start gap-2 text-sm text-zinc-500 mt-1">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{hotelAddress}</span>
                            </div>
                        </div>
                        {hasDirectHotelContact && (
                            <div className="flex flex-col gap-1 text-sm text-zinc-500">
                                {hotel?.contact_phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3" /> {hotel.contact_phone}
                                    </div>
                                )}
                                {hotel?.contact_email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> {hotel.contact_email}
                                    </div>
                                )}
                                {hotel?.website && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-3 w-3" />
                                        <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {hotel.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="border border-zinc-200 rounded-3xl overflow-hidden mb-12">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="p-6 text-xs font-black uppercase text-zinc-400">Description</th>
                            <th className="p-6 text-xs font-black uppercase text-zinc-400">Dates</th>
                            <th className="p-6 text-xs font-black uppercase text-zinc-400 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        <tr>
                            <td className="p-6">
                                <p className="font-bold">{booking.room.name}</p>
                                <p className="text-sm text-zinc-500">{formatUsd(booking.room.price_per_night)} per night x {nights} nights</p>
                            </td>
                            <td className="p-6 text-sm font-medium">
                                {format(checkIn, "MMM d, yyyy")} - <br /> {format(checkOut, "MMM d, yyyy")}
                            </td>
                            <td className="p-6 text-right font-bold text-lg">
                                {formatUsd(subtotal)}
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2} className="p-6 text-right text-sm font-bold uppercase text-zinc-400">
                                Service Fee (3%)
                            </td>
                            <td className="p-6 text-right font-bold text-base text-blue-600">{formatUsd(serviceFee)}</td>
                        </tr>
                        <tr className="bg-zinc-50/50">
                            <td colSpan={2} className="p-6 text-right text-sm font-bold uppercase text-zinc-400">
                                {isPrebookRequested ? "Estimated Total (USD)" : "Total Paid (USD)"}
                            </td>
                            <td className="p-6 text-right font-black text-2xl text-blue-600">{formatUsd(totalPaid)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-2 gap-8 text-xs text-zinc-400 pt-12 border-t mt-12">
                <div>
                    <p className="font-bold text-zinc-600 mb-2 uppercase tracking-tighter">Important Information</p>
                    <ul className="space-y-1 list-disc pl-4">
                        <li>Please present this voucher upon check-in.</li>
                        <li>Check-in is typically from {hotel?.check_in_time?.substring(0, 5) || "14:00"} onwards.</li>
                        <li>Early check-in is subject to availability.</li>
                    </ul>
                </div>
                <div className="text-right">
                    <p className="font-bold text-zinc-600 mb-2 uppercase tracking-tighter">Need Assistance?</p>
                    <p>Contact: hotel@unccdcop17.org</p>
                </div>
            </div>

            <div className="flex justify-center mt-20 no-print">
                <PrintTrigger showButton />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 0 !important; margin: 0 !important; }
                }
            `}} />
        </div>
    );
}
