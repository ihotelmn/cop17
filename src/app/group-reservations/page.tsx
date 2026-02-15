import { GroupRequestForm } from "@/components/booking/group-request-form";
import { Users, ShieldCheck, Gem } from "lucide-react";

export default function GroupReservationsPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left Column: Info & Value Prop */}
                    <div className="lg:w-1/3 space-y-8">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
                                For Delegations
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
                                Group <br /> Reservations
                            </h1>
                            <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Secure premium accommodations for your entire delegation with simplified booking management and dedicated support.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Streamlined Booking</h3>
                                    <p className="text-sm text-zinc-500 mt-1">Submit one request for 5+ guests and receive a consolidated proposal.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
                                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Priority Security</h3>
                                    <p className="text-sm text-zinc-500 mt-1">Pre-vetted hotels with enhanced security protocols for COP17 delegates.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
                                    <Gem className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">VIP Handling</h3>
                                    <p className="text-sm text-zinc-500 mt-1">Dedicated liaisons available for high-level delegation management.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-black text-2xl mb-2">Need Assistance?</h3>
                                <p className="text-blue-100 mb-6 font-medium">Our support team is available 24/7 for urgent group inquiries.</p>
                                <a href="mailto:groups@cop17.mn" className="inline-flex items-center justify-center h-11 px-6 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors">
                                    Contact Support
                                </a>
                            </div>
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="lg:w-2/3">
                        <GroupRequestForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
