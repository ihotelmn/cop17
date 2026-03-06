"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Star, MapPin, Navigation, ShieldCheck } from "lucide-react";
import type { Hotel } from "@/types/hotel";
import { cn, getHotelImageUrl } from "@/lib/utils";

export function HotelCardGrid({ hotel }: { hotel: (Hotel & { minPrice: number }) }) {
    const searchParams = useSearchParams();
    const paramsString = searchParams.toString();
    const href = paramsString ? `/hotels/${hotel.id}?${paramsString}` : `/hotels/${hotel.id}`;

    const images = hotel.images && hotel.images.length > 0
        ? hotel.images
        : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2940"];

    const displayDistance = hotel.cached_distance_km || hotel.distanceToVenue;

    return (
        <Link href={href} className="group block h-full w-full">
            <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] hover:-translate-y-2 group-hover:border-blue-500/40">
                {/* Image Section */}
                <div className="relative aspect-[16/10] w-full overflow-hidden shrink-0">
                    <Image
                        src={getHotelImageUrl(images[0])}
                        alt={hotel.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                        unoptimized
                    />

                    {/* High-End Badges Overlay (Top Left) */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                        {hotel.is_official_partner && (
                            <div className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg shadow-xl uppercase tracking-widest backdrop-blur-md bg-blue-600/90 flex items-center gap-1.5">
                                <ShieldCheck className="h-3 w-3" />
                                Official Partner
                            </div>
                        )}
                        {hotel.is_recommended && (
                            <div className="bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg shadow-xl uppercase tracking-widest backdrop-blur-md flex items-center gap-1.5 border border-white/20">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                Delegate Choice
                            </div>
                        )}
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-transparent to-transparent z-0" />

                    {/* Rating Badge (Only shown if real data exists) */}
                    {hotel.cached_rating && (
                        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/20 backdrop-blur-md border border-white/10">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-white/90 uppercase leading-none">Rating</span>
                            </div>
                            <div className="text-white text-[11px] font-black">
                                {hotel.cached_rating}
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="flex flex-col flex-1 p-4 sm:p-5">
                    {/* Top row: Stars + Price (Price moved here) */}
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        "h-3 w-3",
                                        i < hotel.stars ? "fill-amber-400 text-amber-400" : "text-zinc-200 dark:text-zinc-800"
                                    )}
                                />
                            ))}
                        </div>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-base font-black tracking-tighter text-zinc-900 dark:text-white">${hotel.minPrice || "N/A"}</span>
                            <span className="text-[9px] font-medium text-zinc-500 uppercase">/night</span>
                        </div>
                    </div>

                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors leading-tight">
                        {hotel.name}
                    </h3>

                    <div className="flex items-center text-[12px] text-zinc-500 dark:text-zinc-400 font-medium mb-3">
                        <MapPin className="h-3 w-3 mr-1.5 text-zinc-400 shrink-0" />
                        <span className="line-clamp-1">{hotel.address || "Ulaanbaatar, Mongolia"}</span>
                    </div>

                    <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
                        {displayDistance != null ? (
                            <div className="flex flex-col">
                                <div className="flex items-center text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">
                                    <Navigation className="h-2.5 w-2.5 mr-1 text-blue-500" />
                                    {typeof displayDistance === 'number' ? displayDistance.toFixed(1) : displayDistance} km to Venue
                                </div>
                            </div>
                        ) : (
                            <div className="h-4" />
                        )}

                        <div className="inline-flex items-center justify-center h-8 px-5 rounded-xl bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 active:scale-95 shadow-lg shadow-zinc-900/10">
                            Book
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
