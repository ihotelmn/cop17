"use client";

import type { Hotel } from "@/types/hotel";
import { HotelCardGrid } from "./hotel-card-grid";
import { Hotel as HotelIcon } from "lucide-react";
import ScrollReveal from "./scroll-reveal";
import { isVipPartnerHotel } from "@/lib/vip-partners";

interface HotelSectionsProps {
    hotels: (Hotel & { minPrice: number })[];
}

export function HotelSections({ hotels }: HotelSectionsProps) {
    const vipPartnerHotels = hotels.filter(isVipPartnerHotel);
    const partnerHotels = hotels.filter((hotel) => !isVipPartnerHotel(hotel));

    return (
        <div className="space-y-24">
            {vipPartnerHotels.length > 0 && (
                <section className="relative">
                    <div className="mb-8 gap-4 px-1">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">VIP Partners</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm font-medium">Priority accommodation partners highlighted for the homepage.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {vipPartnerHotels.map((hotel, idx) => (
                            <ScrollReveal key={hotel.id} delay={idx * 0.05} className="h-full">
                                <HotelCardGrid hotel={hotel} />
                            </ScrollReveal>
                        ))}
                    </div>
                </section>
            )}

            {partnerHotels.length > 0 && (
                <section className="relative">
                    <div className="mb-8 gap-4 px-1">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Partners</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm font-medium">All remaining active accommodation partners available on the platform.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {partnerHotels.map((hotel, idx) => (
                            <ScrollReveal key={hotel.id} delay={idx * 0.05} className="h-full">
                                <HotelCardGrid hotel={hotel} />
                            </ScrollReveal>
                        ))}
                    </div>
                </section>
            )}

            {vipPartnerHotels.length === 0 && partnerHotels.length === 0 && (
                <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <HotelIcon className="h-12 w-12 text-zinc-300 mx-auto mb-6 opacity-50" />
                    <p className="text-zinc-500 text-lg font-medium">Please use the filters to find properties.</p>
                </div>
            )}
        </div>
    );
}
