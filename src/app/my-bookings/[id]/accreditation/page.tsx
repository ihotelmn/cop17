import { getDocumentsByBookingAction } from "@/app/actions/document-actions";
import { createClient } from "@/lib/supabase/server";
import { DocumentUpload } from "@/components/booking/document-upload";
import {
    ChevronLeft,
    ShieldAlert,
    ShieldCheck,
    Clock,
    FileText,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { notFound } from "next/navigation";

export default async function AccreditationPage({
    params
}: {
    params: { id: string }
}) {
    const bookingId = params.id;
    const supabase = await createClient();

    // Verify booking ownership
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(`
            *,
            hotel:hotels(name)
        `)
        .eq("id", bookingId)
        .single();

    if (bookingError || !booking) {
        notFound();
    }

    const documents = await getDocumentsByBookingAction(bookingId);

    const passportDoc = documents.find(d => d.type === 'passport');
    const visaDoc = documents.find(d => d.type === 'visa');

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link
                    href={`/my-bookings/${bookingId}`}
                    className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors mb-8"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to Booking
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
                            Accreditation & Docs
                        </h1>
                        <p className="text-lg text-zinc-500 dark:text-zinc-400">
                            Required documents for your stay at <span className="text-zinc-900 dark:text-white font-bold">{booking.hotel.name}</span>
                        </p>
                    </div>

                    <div className="bg-blue-600 rounded-3xl px-6 py-4 text-white flex items-center gap-4 shadow-xl shadow-blue-500/20">
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-blue-100">Overall Status</p>
                            <p className="font-black text-lg">
                                {passportDoc?.status === 'verified' && visaDoc?.status === 'verified'
                                    ? "Verified"
                                    : "Pending Review"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Passport Card */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Identity Documents
                        </h3>
                        <DocumentUpload
                            bookingId={bookingId}
                            type="passport"
                            label="Passport Copy"
                            guestId={booking.user_id}
                        />
                        {passportDoc && (
                            <DocumentStatusCard doc={passportDoc} />
                        )}
                    </div>

                    {/* Visa Card */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Entry Requirements
                        </h3>
                        <DocumentUpload
                            bookingId={bookingId}
                            type="visa"
                            label="Entry Visa / E-Visa"
                            guestId={booking.user_id}
                        />
                        {visaDoc && (
                            <DocumentStatusCard doc={visaDoc} />
                        )}
                    </div>
                </div>

                <div className="mt-16 p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex gap-6 items-start">
                        <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                            <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Security & Privacy</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                All documents are encrypted and stored in a secure vault. Only the assigned COP17 Liaison and accredited security officers have access to your identity documents. After the event conclusion, all copies will be purged from our servers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DocumentStatusCard({ doc }: { doc: any }) {
    const isVerified = doc.status === 'verified';
    const isRejected = doc.status === 'rejected';

    return (
        <Card className={cn(
            "bg-white dark:bg-zinc-900 border transition-all",
            isVerified ? "border-green-500/20" : isRejected ? "border-red-500/20" : "border-zinc-200 dark:border-zinc-800"
        )}>
            <CardContent className="pt-6 flex items-start gap-4">
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isVerified ? "bg-green-100 dark:bg-green-900/40 text-green-600" :
                        isRejected ? "bg-red-100 dark:bg-red-900/40 text-red-600" :
                            "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                )}>
                    {isVerified ? <ShieldCheck className="h-5 w-5" /> :
                        isRejected ? <XCircle className="h-5 w-5" /> :
                            <Clock className="h-5 w-5" />}
                </div>
                <div>
                    <h5 className="font-bold text-zinc-900 dark:text-white">
                        {isVerified ? "Document Verified" :
                            isRejected ? "Re-submission Required" :
                                "Pending Verification"}
                    </h5>
                    <p className="text-xs text-zinc-500 mt-1">
                        Applied on {format(new Date(doc.created_at), "MMM d, yyyy")}
                    </p>
                    {doc.notes && (
                        <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                            <strong>Note:</strong> {doc.notes}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
