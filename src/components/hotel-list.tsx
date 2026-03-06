"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Navigation, Wifi, Car, Coffee, ArrowRight, ShieldCheck, Calendar, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Hotel } from "@/types/hotel";
import { useState } from "react";
import { cn, getHotelImageUrl } from "@/lib/utils";
import { estimateTravelTime } from "@/lib/venue";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

export function HotelList({ hotels }: { hotels: (Hotel & { minPrice: number })[] }) {
    const [displayCount, setDisplayCount] = useState(6);

    if (!hotels || hotels.length === 0) {
        return null;
    }

    const visibleHotels = hotels.slice(0, displayCount);
    const hasMore = hotels.length > displayCount;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
                {visibleHotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} />
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-8 pb-12">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setDisplayCount(prev => prev + 6)}
                        className="rounded-full px-12 h-14 border-2 border-zinc-200 dark:border-zinc-800 font-bold hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-all shadow-lg"
                    >
                        Load More Properties ({hotels.length - displayCount} left)
                    </Button>
                </div>
            )}
        </div>
    );
}

import { useSearchParams } from "next/navigation";

function HotelCard({ hotel }: { hotel: (Hotel & { minPrice: number }) }) {
    const searchParams = useSearchParams();
    // Images fallback
    const images = hotel.images && hotel.images.length > 0
        ? hotel.images
        : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2940"];

    // Use cached real data
    const displayDistance = hotel.cached_distance_km || hotel.distanceToVenue;
    const displayTime = hotel.cached_drive_time_text || (hotel.distanceToVenue ? `~${estimateTravelTime(hotel.distanceToVenue, 'driving')}` : null);

    const qs = searchParams.toString();
    const href = qs ? `/hotels/${hotel.id}?${qs}` : `/hotels/${hotel.id}`;

    return (
        <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 dark:border-zinc-800 dark:bg-zinc-900">
            {/* Image Section - Slider */}
            <div className="relative w-full md:w-[280px] lg:w-[320px] aspect-[16/10] md:aspect-auto shrink-0 bg-zinc-100 dark:bg-zinc-800">
                <Carousel className="w-full h-full">
                    <CarouselContent className="h-full">
                        {images.slice(0, 5).map((img, index) => (
                            <CarouselItem key={index} className="h-full">
                                <div className="relative w-full h-full">
                                    <Image
                                        src={getHotelImageUrl(img)}
                                        alt={hotel.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 320px, 320px"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        unoptimized
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {images.length > 1 && (
                        <>
                            <CarouselPrevious className="left-2 bg-white/20 hover:bg-white/40 border-none h-8 w-8 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CarouselNext className="right-2 bg-white/20 hover:bg-white/40 border-none h-8 w-8 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                    )}
                </Carousel>

                {/* Overlay Badges (Top Left) */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    {hotel.is_official_partner && (
                        <div className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-md shadow-xl uppercase tracking-widest backdrop-blur-md bg-blue-600/90 flex items-center gap-1">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Official
                        </div>
                    )}
                    {hotel.is_recommended && (
                        <div className="bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white text-[8px] font-black px-2 py-1 rounded-md shadow-xl uppercase tracking-widest backdrop-blur-md flex items-center gap-1 border border-white/20">
                            <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                            Delegate Choice
                        </div>
                    )}
                </div>

                {/* Rating Badge (Bottom Right) */}
                {hotel.cached_rating && (
                    <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/30 backdrop-blur-md border border-white/10">
                        <span className="text-[8px] font-black text-white/90 uppercase leading-none">Rating</span>
                        <div className="text-white text-[11px] font-black">
                            {hotel.cached_rating}
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-5 md:p-6">
                <div className="flex-1">
                    {/* Top row: Stars + Price */}
                    <div className="flex items-center justify-between mb-3">
                        {hotel.stars && hotel.stars > 0 ? (
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "h-3.5 w-3.5",
                                            i < hotel.stars ? "fill-amber-400 text-amber-400" : "text-zinc-100 dark:text-zinc-800"
                                        )}
                                    />
                                ))}
                            </div>
                        ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                                Rating not provided
                            </span>
                        )}
                        <div className="flex flex-col items-end">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">
                                    ${hotel.minPrice || "N/A"}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">/ night</span>
                            </div>
                            <span className="text-[9px] text-green-600 font-bold uppercase tracking-tight">Includes taxes & fees</span>
                        </div>
                    </div>

                    <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight mb-2">
                        {hotel.name}
                    </h3>

                    <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-4">
                        <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <span className="line-clamp-1">{hotel.address || "Ulaanbaatar, Mongolia"}</span>
                        <span className="mx-2 text-zinc-300">•</span>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${hotel.latitude || hotel.address},${hotel.longitude || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-bold hover:underline cursor-pointer text-xs uppercase tracking-tight"
                        >
                            Map
                        </a>
                    </div>

                    {/* Amenities Badges - Cleaned Up */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {hotel.amenities?.slice(0, 4).map((a, i) => (
                            <div key={i} className="flex items-center text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700/50 uppercase tracking-tight">
                                {a.toLowerCase().includes("wifi") && <Wifi className="h-3 w-3 mr-1.5 text-blue-500" />}
                                {a.toLowerCase().includes("shuttle") && <Car className="h-3 w-3 mr-1.5 text-green-500" />}
                                {a.toLowerCase().includes("breakfast") && <Coffee className="h-3 w-3 mr-1.5 text-amber-500" />}
                                {a}
                            </div>
                        ))}
                        {(hotel.amenities?.length || 0) > 4 && (
                            <span className="text-[9px] font-black text-zinc-400 self-center uppercase tracking-widest pl-1">
                                +{hotel.amenities!.length - 4} More
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-auto pt-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {displayDistance != null && (
                            <div className="flex flex-col">
                                <div className="flex items-center text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">
                                    <Navigation className="h-3 w-3 mr-1.5 text-blue-500" />
                                    {typeof displayDistance === 'number' ? displayDistance.toFixed(1) : displayDistance} km to Venue
                                </div>
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter ml-4.5">
                                    {displayTime} drive
                                </span>
                            </div>
                        )}
                    </div>

                    <Link href={href} className="inline-flex items-center justify-center h-11 px-8 rounded-2xl bg-zinc-900 text-white text-xs font-black uppercase tracking-widest transition-all hover:bg-blue-600 active:scale-95 shadow-xl shadow-zinc-900/10">
                        See Availability
                    </Link>
                </div>
            </div>
        </div>
    );
}
