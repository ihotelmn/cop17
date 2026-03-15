import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-zinc-50 px-4 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            <div className="mx-auto max-w-3xl space-y-8">
                <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Legal</p>
                    <h1 className="text-4xl font-black tracking-tight">Terms of Use</h1>
                    <p className="text-sm font-medium text-zinc-500">
                        These terms apply to COP17 Mongolia accommodation booking and delegate support services.
                    </p>
                </div>

                <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <section className="space-y-2">
                        <h2 className="text-xl font-bold">Bookings</h2>
                        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            Reservations are subject to room availability, hotel confirmation, payment verification,
                            and the cancellation rules shown during checkout.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold">Delegate Information</h2>
                        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            Guests must provide accurate traveler and accreditation information. Incorrect or incomplete
                            information may delay confirmation, check-in, or event access support.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold">Platform Use</h2>
                        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            Users may not misuse the platform, interfere with bookings, or attempt unauthorized access
                            to accommodation, delegate, or administrative data.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold">Support</h2>
                        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            For booking corrections, payment issues, or delegate support, contact the COP17
                            accommodation coordination team through the official support channels shown in the platform.
                        </p>
                    </section>
                </div>

                <Link href="/login" className="inline-flex text-sm font-bold text-blue-600 hover:text-blue-700">
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
