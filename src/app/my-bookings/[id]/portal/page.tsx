"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBookingDetail, cancelBookingAction, requestModificationAction } from "@/app/actions/booking";
import { BookingStatusBadge } from "@/components/admin/booking-status-badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    MapPin,
    ArrowLeft,
    AlertTriangle,
    Clock,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Info,
    ChevronRight,
    Building2,
    ShieldCheck
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function BookingPortalPage() {
    const params = useParams();
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [modMessage, setModMessage] = useState("");
    const [isModDialogOpen, setIsModDialogOpen] = useState(false);

    const bookingId = params.id as string;

    useEffect(() => {
        async function load() {
            const data = await getBookingDetail(bookingId);
            if (!data) {
                toast.error("Booking not found");
                router.push("/my-bookings");
                return;
            }
            setBooking(data);
            setLoading(false);
        }
        load();
    }, [bookingId, router]);

    const handleCancel = async () => {
        setActionLoading(true);
        const res = await cancelBookingAction(bookingId);
        setActionLoading(false);
        if (res.success) {
            toast.success("Booking cancelled successfully");
            router.refresh();
            // Refresh local state
            const data = await getBookingDetail(bookingId);
            setBooking(data);
        } else {
            toast.error(res.error || "Failed to cancel booking");
        }
    };

    const handleRequestMod = async () => {
        if (!modMessage.trim()) {
            toast.error("Please enter a message");
            return;
        }
        setActionLoading(true);
        const res = await requestModificationAction(bookingId, modMessage);
        setActionLoading(false);
        if (res.success) {
            toast.success("Modification request sent to hotel");
            setIsModDialogOpen(false);
            setModMessage("");
        } else {
            toast.error(res.error || "Failed to send request");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 font-medium">Loading booking details...</p>
                </div>
            </div>
        );
    }

    const checkInDate = new Date(booking.check_in_date);
    const daysUntilCheckIn = differenceInDays(checkInDate, new Date());
    const canCancelFree = daysUntilCheckIn >= 7; // Example policy: Free cancellation if > 7 days

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header Navigation */}
                <Link
                    href="/my-bookings"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-blue-600 transition-colors mb-8 font-medium group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to My Bookings
                </Link>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1 space-y-6">
                        <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Management Portal</h1>
                                    <p className="text-zinc-500 text-sm mt-1">Booking ID: <span className="font-mono text-blue-600">{booking.id.slice(0, 8)}...</span></p>
                                </div>
                                <BookingStatusBadge status={booking.status} />
                            </div>

                            <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 bg-zinc-100 group">
                                <img
                                    src={booking.room?.hotel?.images?.[0] || "/placeholder-hotel.jpg"}
                                    alt={booking.room?.hotel?.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                                    <h2 className="text-2xl font-bold text-white mb-1">{booking.room?.hotel?.name}</h2>
                                    <div className="flex items-center gap-2 text-white/80 text-sm">
                                        <MapPin className="h-4 w-4" />
                                        <span>{booking.room?.hotel?.address}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                                    <div className="flex items-center gap-3 mb-3 text-blue-600">
                                        <Calendar className="h-5 w-5" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Check-in</span>
                                    </div>
                                    <p className="text-xl font-black text-zinc-900 dark:text-white">
                                        {format(new Date(booking.check_in_date), "MMM d, yyyy")}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">From 14:00 PM</p>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                                    <div className="flex items-center gap-3 mb-3 text-blue-600">
                                        <Calendar className="h-5 w-5" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Check-out</span>
                                    </div>
                                    <p className="text-xl font-black text-zinc-900 dark:text-white">
                                        {format(new Date(booking.check_out_date), "MMM d, yyyy")}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">Until 12:00 PM</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Manage My Stay
                            </h3>

                            <div className="grid gap-4">
                                {booking.status !== "cancelled" && (
                                    <>
                                        <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 gap-6">
                                            <div className="flex gap-4">
                                                <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                                                    <XCircle className="h-6 w-6 text-rose-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-zinc-900 dark:text-white">Cancel Booking</h4>
                                                    <p className="text-sm text-zinc-500 mt-1">
                                                        {canCancelFree
                                                            ? "Free cancellation available until " + format(new Date(checkInDate.getTime() - 7 * 24 * 60 * 60 * 1000), "MMM d")
                                                            : "Standard cancellation penalty may apply."}
                                                    </p>
                                                </div>
                                            </div>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="destructive" className="rounded-xl h-11 px-8 font-bold whitespace-nowrap">
                                                        Request Cancellation
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="rounded-3xl">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-2xl font-black">Confirm Cancellation?</DialogTitle>
                                                        <DialogDescription className="text-zinc-500">
                                                            This action will cancel your reservation at {booking.room?.hotel?.name}.
                                                            {canCancelFree
                                                                ? " Since you are within the free cancellation window, a full refund will be processed."
                                                                : " Please note that standard penalties may apply based on the hotel's policy."}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter className="mt-6 flex gap-3">
                                                        <Button variant="ghost" disabled={actionLoading} onClick={() => { }} className="rounded-xl font-bold">Nevermind</Button>
                                                        <Button
                                                            variant="destructive"
                                                            disabled={actionLoading}
                                                            onClick={handleCancel}
                                                            className="rounded-xl font-bold px-8 bg-rose-600 hover:bg-rose-700"
                                                        >
                                                            {actionLoading ? "Processing..." : "Confirm Cancellation"}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 gap-6">
                                            <div className="flex gap-4">
                                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                                    <MessageSquare className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-zinc-900 dark:text-white">Modify Booking</h4>
                                                    <p className="text-sm text-zinc-500 mt-1">Change dates, room type or guest info.</p>
                                                </div>
                                            </div>

                                            <Dialog open={isModDialogOpen} onOpenChange={setIsModDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="rounded-xl h-11 px-8 font-bold border-blue-200 text-blue-700 hover:bg-blue-100/50 transition-colors whitespace-nowrap">
                                                        Request Change
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="rounded-3xl">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-2xl font-black">What would you like to change?</DialogTitle>
                                                        <DialogDescription className="text-zinc-500">
                                                            Describe the changes you'd like to make (new dates, guests, etc.).
                                                            The hotel manager will review your request and contact you.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="mt-4">
                                                        <Textarea
                                                            placeholder="e.g. I would like to change my check-in date to June 15th..."
                                                            className="rounded-2xl border-zinc-200 min-h-[120px] p-4 text-sm"
                                                            value={modMessage}
                                                            onChange={(e) => setModMessage(e.target.value)}
                                                        />
                                                    </div>
                                                    <DialogFooter className="mt-6 flex gap-3">
                                                        <Button variant="ghost" onClick={() => setIsModDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                                                        <Button
                                                            disabled={actionLoading || !modMessage.trim()}
                                                            onClick={handleRequestMod}
                                                            className="rounded-xl font-bold px-8 bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            {actionLoading ? "Sending..." : "Submit Request"}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 gap-6">
                                            <div className="flex gap-4">
                                                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                                                    <ShieldCheck className="h-6 w-6 text-amber-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-zinc-900 dark:text-white">Accreditation & Documents</h4>
                                                    <p className="text-sm text-zinc-500 mt-1">Upload passports and visas for official COP17 accreditation.</p>
                                                </div>
                                            </div>

                                            <Button asChild className="rounded-xl h-11 px-8 font-bold bg-amber-500 hover:bg-amber-600 text-black whitespace-nowrap">
                                                <Link href={`/my-bookings/${bookingId}/accreditation`}>
                                                    Manage Documents
                                                </Link>
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {booking.status === "cancelled" && (
                                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700/50">
                                        <XCircle className="h-12 w-12 text-zinc-300 mb-4" />
                                        <h4 className="font-bold text-lg text-zinc-600">This booking is cancelled</h4>
                                        <p className="text-sm text-zinc-400 mt-2 max-w-xs">
                                            If this was a mistake, please contact our support team.
                                        </p>
                                        <Button asChild variant="link" className="mt-4 text-blue-600 font-bold">
                                            <Link href="/hotels">Book a new room</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar / Info */}
                    <div className="w-full lg:w-80 space-y-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
                            <h4 className="font-black text-sm uppercase tracking-widest text-zinc-400 mb-6">Stay Summary</h4>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-zinc-500">Room Type</span>
                                    <span className="text-zinc-900 dark:text-white">{booking.room?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-zinc-500">Rate Plan</span>
                                    <span className="text-green-600">Flexible - COP17</span>
                                </div>
                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4 flex justify-between items-center">
                                    <span className="text-base font-bold text-zinc-900 dark:text-white">Total Paid</span>
                                    <span className="text-2xl font-black text-blue-600">${booking.total_price}</span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Button asChild variant="outline" className="w-full rounded-2xl h-12 border-zinc-200 dark:border-zinc-800 font-bold hover:bg-zinc-50">
                                    <Link href={`/booking/receipt/${booking.id}`} target="_blank">
                                        View Receipt
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-6 text-white shadow-xl shadow-zinc-200/50 dark:shadow-none">
                            <div className="flex items-center gap-3 mb-6">
                                <Info className="h-5 w-5 text-blue-400" />
                                <h4 className="font-bold text-sm uppercase tracking-widest">Cancellation Policy</h4>
                            </div>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm">
                                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                                    </div>
                                    <p className="text-zinc-300">Free cancellation available up to 7 days before check-in.</p>
                                </li>
                                <li className="flex gap-3 text-sm">
                                    <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <Clock className="h-3 w-3 text-amber-400" />
                                    </div>
                                    <p className="text-zinc-300">50% penalty for cancellations between 7 days and 48h.</p>
                                </li>
                                <li className="flex gap-3 text-sm">
                                    <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <XCircle className="h-3 w-3 text-red-400" />
                                    </div>
                                    <p className="text-zinc-300">No refund for cancellations within 48h of arrival.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
