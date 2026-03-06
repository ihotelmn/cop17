import { Metadata } from "next";
import Link from "next/link";
import { Bus, Clock, MapPin, CalendarCheck, ShieldCheck, ArrowRight, Info, Route, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Shuttle Service | COP17 Mongolia",
    description: "Free express shuttle service connecting COP17 venue to official partner hotels throughout Ulaanbaatar.",
};

const routes = [
    {
        name: "Route A — Central Express",
        from: "Chinggis Khaan Hotel ↔ COP17 Venue",
        stops: ["Kempinski Hotel", "Best Western", "Blue Sky Hotel"],
        frequency: "Every 20 min",
        firstBus: "07:00",
        lastBus: "22:00",
        duration: "~15 min",
        color: "bg-blue-500",
    },
    {
        name: "Route B — East Circuit",
        from: "Holiday Inn ↔ COP17 Venue",
        stops: ["Ramada", "Shangri-La", "Corporate Hotel"],
        frequency: "Every 25 min",
        firstBus: "07:00",
        lastBus: "21:30",
        duration: "~20 min",
        color: "bg-emerald-500",
    },
    {
        name: "Route C — South Loop",
        from: "Flower Hotel ↔ COP17 Venue",
        stops: ["Bayangol Hotel", "Namuun Hotel", "Springs Hotel"],
        frequency: "Every 30 min",
        firstBus: "07:30",
        lastBus: "21:00",
        duration: "~25 min",
        color: "bg-amber-500",
    },
];

const features = [
    { icon: Zap, title: "100% Free", desc: "Complimentary for all guests at official COP17 partner hotels." },
    { icon: ShieldCheck, title: "Secure & Tracked", desc: "GPS-tracked vehicles with COP17 security clearance." },
    { icon: CalendarCheck, title: "Daily Service", desc: "Operating throughout the entire COP17 conference period." },
    { icon: Route, title: "3 Routes", desc: "Covering all major hotel clusters across Ulaanbaatar." },
];

export default function ShuttlePage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-zinc-950 to-indigo-950 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-[128px]" />
                    <div className="absolute bottom-20 right-20 w-72 h-72 bg-indigo-500 rounded-full blur-[128px]" />
                </div>
                <div className="container mx-auto px-4 py-24 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-8">
                            <Bus className="h-3.5 w-3.5" />
                            Complimentary Delegate Transport
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                            Express <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Shuttle Service</span>
                        </h1>
                        <p className="text-xl text-white/70 font-medium leading-relaxed max-w-2xl">
                            Free daily shuttle connecting all official COP17 partner hotels to the conference venue.
                            GPS-tracked, climate-controlled coaches running every 20-30 minutes.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl -mt-12 relative z-20">
                {/* Feature Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {features.map((f, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                                <f.icon className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="font-black text-zinc-900 dark:text-white text-sm mb-1">{f.title}</h3>
                            <p className="text-xs text-zinc-500 font-medium">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Routes */}
                <div className="mb-16">
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">Shuttle Routes</h2>
                    <p className="text-zinc-500 font-medium mb-10">Three routes covering all official hotel clusters across the city.</p>

                    <div className="space-y-6">
                        {routes.map((route, i) => (
                            <div key={i} className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all overflow-hidden">
                                <div className="p-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`h-3 w-3 rounded-full ${route.color}`} />
                                                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{route.name}</h3>
                                            </div>
                                            <p className="text-sm font-bold text-blue-600 mb-4">{route.from}</p>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {route.stops.map((stop, j) => (
                                                    <span key={j} className="text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1.5 rounded-lg">
                                                        {stop}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 md:grid-cols-1 gap-4 md:text-right">
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Frequency</p>
                                                <p className="text-sm font-black text-zinc-900 dark:text-white">{route.frequency}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Operating</p>
                                                <p className="text-sm font-black text-zinc-900 dark:text-white">{route.firstBus}–{route.lastBus}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Travel Time</p>
                                                <p className="text-sm font-black text-zinc-900 dark:text-white">{route.duration}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Important Info */}
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-3xl p-10 border border-blue-100 dark:border-blue-900/50 mb-16">
                    <div className="flex items-start gap-4">
                        <Info className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-3">Important Information</h3>
                            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                                <li>• Shuttle service is available exclusively to guests staying at official COP17 partner hotels.</li>
                                <li>• Present your hotel key card or COP17 delegate badge when boarding.</li>
                                <li>• All vehicles are climate-controlled and Wi-Fi equipped.</li>
                                <li>• Special late-night services available upon request for official COP17 evening events.</li>
                                <li>• Wheelchair-accessible vehicles available on all routes — please request in advance.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black tracking-tight mb-4">Need a Custom Transfer?</h2>
                        <p className="text-white/80 font-medium mb-8 max-w-lg mx-auto">
                            Airport transfers, private vehicles, and custom delegation transport can be arranged through our support team.
                        </p>
                        <Button asChild className="bg-white text-blue-700 hover:bg-zinc-100 rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                            <Link href="/support">
                                Contact Support
                                <ArrowRight className="ml-3 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
