import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-zinc-50 px-4 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            <div className="mx-auto max-w-3xl space-y-8">
                <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Legal</p>
                    <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
                    <p className="text-sm font-medium text-zinc-500">
                        This page explains how COP17 Mongolia booking data is collected, protected, and used.
                    </p>
                </div>

                <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <section className="space-y-2">
                        <h2 className="text-xl font-bold">Information We Process</h2>
                        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            We process accommodation details, traveler contact information, payment references, and
                            delegate support information needed to manage COP17 bookings and related services.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold">Why We Use It</h2>
                        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            Your information is used to confirm reservations, coordinate hotel operations, manage
                            delegate support, and provide booking-related communications.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold">Security</h2>
                        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            Sensitive booking data is stored within protected systems and access is restricted to
                            authorized personnel and approved operational workflows.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold">Retention and Corrections</h2>
                        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            Booking records may be retained for operational, reporting, and audit purposes. If your
                            reservation details need correction, please use the support channels available in the
                            platform.
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
