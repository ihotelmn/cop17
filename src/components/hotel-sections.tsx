"use client";

import type { Hotel } from "@/types/hotel";
import { HotelCardGrid } from "./hotel-card-grid";
import { ArrowRight, Star, ShieldCheck, Flame, Hotel as HotelIcon } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "./scroll-reveal";

interface HotelSectionsProps {
    hotels: (Hotel & { minPrice: number })[];
}

export function HotelSections({ hotels }: HotelSectionsProps) {
    // 1. Official Partners (Featured)
    const officialAll = hotels.filter(h => h.is_official_partner);
    const officialHotels = officialAll.slice(0, officialAll.length > 6 ? 5 : 6);

    // 2. Recommended for Delegates
    const recommendedAll = hotels.filter(h => h.is_recommended && !h.is_official_partner);
    const recommendedHotels = recommendedAll.slice(0, recommendedAll.length > 6 ? 5 : 6);

    // 3. Top Rated / Popular (4.5+ rating or 5 stars)
    const topRatedAll = hotels.filter(h =>
        (h.stars >= 5 || (h.cached_rating && h.cached_rating >= 4.5)) &&
        !h.is_official_partner &&
        !h.is_recommended
    );
    const topRatedHotels = topRatedAll.slice(0, topRatedAll.length > 6 ? 5 : 6);

    return (
        <div className="space-y-24">
            {/* 1. Official Partners Section */}
            {officialHotels.length > 0 && (
                <section className="relative">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 px-1">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Official Partner Hotels</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm font-medium">Specially selected accommodations for VIP delegates and speakers.</p>
                        </div>
                        <Link href="/?view=list" className="flex items-center gap-2 group text-[11px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 shrink-0">
                            View All <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {officialHotels.map((hotel, idx) => (
                            <ScrollReveal key={hotel.id} delay={idx * 0.05} className="h-full">
                                <HotelCardGrid hotel={hotel} />
                            </ScrollReveal>
                        ))}
                        {officialAll.length > 6 && (
                            <ScrollReveal delay={0.3} className="h-full">
                                <MoreCard href="/?view=list" count={officialAll.length - 5} />
                            </ScrollReveal>
                        )}
                    </div>
                </section>
            )}

            {/* 2. Recommended for Delegates Section */}
            {recommendedHotels.length > 0 && (
                <section className="relative">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 px-1">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Recommended Stays</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm font-medium">Optimal balance of comfort, proximity, and delegate-friendly amenities.</p>
                        </div>
                        <Link href="/?view=list" className="flex items-center gap-2 group text-[11px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 shrink-0">
                            View All <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {recommendedHotels.map((hotel, idx) => (
                            <ScrollReveal key={hotel.id} delay={idx * 0.05} className="h-full">
                                <HotelCardGrid hotel={hotel} />
                            </ScrollReveal>
                        ))}
                        {recommendedAll.length > 6 && (
                            <ScrollReveal delay={0.3} className="h-full">
                                <MoreCard href="/?view=list" count={recommendedAll.length - 5} />
                            </ScrollReveal>
                        )}
                    </div>
                </section>
            )}

            {/* 3. Top Rated Section */}
            {topRatedHotels.length > 0 && (
                <section className="relative">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 px-1">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Top Rated Properties</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm font-medium">Properties with the highest guest satisfaction and exceptional service.</p>
                        </div>
                        <Link href="/?view=list" className="flex items-center gap-2 group text-[11px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 shrink-0">
                            View All <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {topRatedHotels.map((hotel, idx) => (
                            <ScrollReveal key={hotel.id} delay={idx * 0.05} className="h-full">
                                <HotelCardGrid hotel={hotel} />
                            </ScrollReveal>
                        ))}
                        {topRatedAll.length > 6 && (
                            <ScrollReveal delay={0.3} className="h-full">
                                <MoreCard href="/?view=list" count={topRatedAll.length - 5} />
                            </ScrollReveal>
                        )}
                    </div>
                </section>
            )}

            {/* If no special sections found (unlikely), show general list info */}
            {officialHotels.length === 0 && recommendedHotels.length === 0 && topRatedHotels.length === 0 && (
                <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <HotelIcon className="h-12 w-12 text-zinc-300 mx-auto mb-6 opacity-50" />
                    <p className="text-zinc-500 text-lg font-medium">Please use the filters to find properties.</p>
                </div>
            )}
        </div>
    );
}

function MoreCard({ href, count }: { href: string; count: number }) {
    return (
        <Link href={href} className="group block h-full">
            <div className="h-full min-h-[380px] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-500 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex flex-col items-center text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                        <ArrowRight className="h-6 w-6 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>

                    <h4 className="text-xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">
                        Explore More
                    </h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium max-w-[160px]">
                        Discover {count}+ more exceptional properties
                    </p>

                    <div className="mt-8 overflow-hidden h-1 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800 relative">
                        <div className="absolute inset-0 bg-blue-600 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-700" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
