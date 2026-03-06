import { Metadata } from "next";
import Link from "next/link";
import { Mountain, Camera, TreePine, Compass, Clock, Users, MapPin, Calendar, ArrowRight, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Curated Tours | COP17 Mongolia",
    description: "Discover Mongolia's breathtaking landscapes and rich culture through exclusive tours designed for COP17 delegates.",
};

const tours = [
    {
        title: "Terelj National Park Day Trip",
        description: "Explore stunning rock formations, visit the iconic Turtle Rock, and experience a traditional Mongolian ger camp just 70km from Ulaanbaatar.",
        duration: "Full day (8-10 hrs)",
        groupSize: "6-15 delegates",
        price: "$85",
        highlight: "Most Popular",
        icon: Mountain,
        features: ["Round-trip transport", "Lunch included", "English-speaking guide", "Horseback riding option"],
    },
    {
        title: "Ulaanbaatar Heritage Walking Tour",
        description: "Walk through the capital's cultural heart — from Chinggis Khaan Square to Gandantegchinlen Monastery, discovering 800 years of Mongolian history.",
        duration: "Half day (4 hrs)",
        groupSize: "8-20 delegates",
        price: "$35",
        highlight: "Cultural",
        icon: Camera,
        features: ["Expert historian guide", "Monastery visit", "Museum entry", "Traditional tea ceremony"],
    },
    {
        title: "Khustain Nuruu Wild Horse Reserve",
        description: "Witness the remarkable Takhi (Przewalski's horse) — the world's last truly wild horse — in their natural habitat at this UNESCO-recognized reserve.",
        duration: "Full day (9 hrs)",
        groupSize: "6-12 delegates",
        price: "$95",
        highlight: "Eco-Tourism",
        icon: TreePine,
        features: ["Wildlife spotting", "Conservation briefing", "Lunch at eco-camp", "Photography opportunities"],
    },
    {
        title: "Nomadic Culture Immersion",
        description: "Spend an evening with a real nomadic family: learn traditional dairy processing, try Mongolian archery, and dine under the eternal blue sky.",
        duration: "Evening (5 hrs)",
        groupSize: "4-10 delegates",
        price: "$120",
        highlight: "Exclusive",
        icon: Compass,
        features: ["Authentic ger dinner", "Archery experience", "Airag tasting", "Sunset photography"],
    },
];

export default function ToursPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-zinc-950 to-blue-950 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601224857026-1be34a4a tried-c-format?q=80&w=2940')] opacity-10 bg-cover bg-center" />
                <div className="container mx-auto px-4 py-24 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-8">
                            <Mountain className="h-3.5 w-3.5" />
                            COP17 Delegate Experiences
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                            Discover <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Mongolia</span>
                        </h1>
                        <p className="text-xl text-white/70 font-medium leading-relaxed max-w-2xl">
                            Exclusive curated tours for COP17 delegates — from ancient monasteries to wild horse reserves.
                            Experience Mongolia's extraordinary natural beauty and nomadic heritage.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tours Grid */}
            <div className="container mx-auto px-4 max-w-6xl -mt-12 relative z-20">
                <div className="grid gap-8 md:grid-cols-2">
                    {tours.map((tour, i) => (
                        <div key={i} className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-1">
                            <div className="p-8">
                                {/* Badge + Icon */}
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg">
                                        {tour.highlight}
                                    </span>
                                    <div className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors">
                                        <tour.icon className="h-6 w-6 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-3">
                                    {tour.title}
                                </h3>
                                <p className="text-zinc-500 font-medium leading-relaxed mb-6 text-sm">
                                    {tour.description}
                                </p>

                                {/* Meta */}
                                <div className="flex flex-wrap gap-4 mb-6">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                                        {tour.duration}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                                        <Users className="h-3.5 w-3.5 text-blue-500" />
                                        {tour.groupSize}
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="grid grid-cols-2 gap-2 mb-8">
                                    {tour.features.map((f, j) => (
                                        <div key={j} className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                    <div>
                                        <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{tour.price}</span>
                                        <span className="text-xs font-bold text-zinc-400 ml-1">/ person</span>
                                    </div>
                                    <Button className="rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-xs uppercase tracking-widest h-12 px-8 hover:scale-105 active:scale-95 transition-all shadow-lg">
                                        Inquire
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-16 text-center bg-gradient-to-r from-emerald-600 to-blue-600 rounded-3xl p-12 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black tracking-tight mb-4">Custom Group Tours Available</h2>
                        <p className="text-white/80 font-medium mb-8 max-w-lg mx-auto">
                            Planning for a delegation of 10+? We offer fully customizable itineraries with private transport,
                            dedicated guides, and exclusive access.
                        </p>
                        <Button asChild className="bg-white text-emerald-700 hover:bg-zinc-100 rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                            <Link href="/support">
                                Contact Our Team
                                <ArrowRight className="ml-3 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
