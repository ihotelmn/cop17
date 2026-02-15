import { getBookingDetail } from "@/app/actions/booking";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Printer, ShieldCheck, MapPin, Phone, Mail } from "lucide-react";
import { PrintTrigger } from "./print-trigger";

interface ReceiptPageProps {
    params: Promise<{ id: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
    const { id } = await params;
    const booking = await getBookingDetail(id);

    if (!booking) {
        notFound();
    }

    const hotel = booking.room.hotel;
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

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
                    <h2 className="text-2xl font-black mb-1">Status: CONFIRMED</h2>
                    <p className="text-blue-100 text-sm">Your reservation is fully paid and guaranteed.</p>
                </div>
                <ShieldCheck className="h-12 w-12 text-blue-200" />
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Guest Details</h3>
                    <div className="space-y-2">
                        <p className="text-lg font-bold">Delegate Booking</p>
                        <p className="text-sm text-zinc-600">ID: {booking.user_id?.substring(0, 8)}...</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Hotel Details</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-lg font-bold">{hotel.name}</p>
                            <div className="flex items-start gap-2 text-sm text-zinc-500 mt-1">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{hotel.address}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-zinc-500">
                            <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" /> {hotel.contact_phone || "+976 ..."}
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" /> {hotel.contact_email || "support@cop17.mn"}
                            </div>
                        </div>
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
                                <p className="text-sm text-zinc-500">${booking.room.price_per_night} per night x {nights} nights</p>
                            </td>
                            <td className="p-6 text-sm font-medium">
                                {format(checkIn, "MMM d, yyyy")} - <br /> {format(checkOut, "MMM d, yyyy")}
                            </td>
                            <td className="p-6 text-right font-bold text-lg">
                                ${booking.total_price}
                            </td>
                        </tr>
                        <tr className="bg-zinc-50/50">
                            <td colSpan={2} className="p-6 text-right text-sm font-bold uppercase text-zinc-400">Total Paid (USD)</td>
                            <td className="p-6 text-right font-black text-2xl text-blue-600">${booking.total_price}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-2 gap-8 text-xs text-zinc-400 pt-12 border-t mt-12">
                <div>
                    <p className="font-bold text-zinc-600 mb-2 uppercase tracking-tighter">Important Information</p>
                    <ul className="space-y-1 list-disc pl-4">
                        <li>Please present this voucher upon check-in.</li>
                        <li>Check-in is typically from 14:00 onwards.</li>
                        <li>Early check-in is subject to availability.</li>
                    </ul>
                </div>
                <div className="text-right">
                    <p className="font-bold text-zinc-600 mb-2 uppercase tracking-tighter">Need Assistance?</p>
                    <p>Support Line: +976 7000 0000</p>
                    <p>Email: accommodation@cop17.mn</p>
                </div>
            </div>

            <div className="flex justify-center mt-20 no-print">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-8 h-12 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 transition-colors shadow-lg"
                >
                    <Printer className="h-5 w-5" />
                    Print Receipt
                </button>
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
