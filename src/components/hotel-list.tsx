"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Navigation, Wifi, Car, Coffee, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Hotel } from "@/types/hotel";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn, getHotelImageUrl } from "@/lib/utils";
import { isVipPartnerHotel } from "@/lib/vip-partners";
import { getHotelDisplayDistance, getHotelDisplayDriveTime } from "@/lib/hotel-distance";
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
                        className="h-14 w-full rounded-2xl border-2 border-zinc-200 px-6 text-sm font-bold uppercase tracking-[0.16em] shadow-lg transition-all hover:bg-zinc-900 hover:text-white dark:border-zinc-800 dark:hover:bg-white dark:hover:text-zinc-900 sm:w-auto sm:rounded-full sm:px-12 sm:text-base sm:tracking-normal"
                    >
                        Load More Properties ({hotels.length - displayCount} left)
                    </Button>
                </div>
            )}
        </div>
    );
}

function HotelCard({ hotel }: { hotel: (Hotel & { minPrice: number }) }) {
    const searchParams = useSearchParams();
    const isVipPartner = isVipPartnerHotel(hotel);
    // Images fallback
    const images = hotel.images && hotel.images.length > 0
        ? hotel.images
        : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2940"];

    // Use cached real data
    const displayDistance = getHotelDisplayDistance(hotel);
    const displayTime = getHotelDisplayDriveTime(hotel, hotel.cached_drive_time_text);

    const qs = searchParams.toString();
    const href = qs ? `/hotels/${hotel.id}?${qs}` : `/hotels/${hotel.id}`;

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-900 md:flex-row">
            {/* Image Section - Slider */}
            <div className="relative aspect-[16/10] w-full shrink-0 bg-zinc-100 dark:bg-zinc-800 md:w-[280px] md:aspect-auto lg:w-[320px]">
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
                            <CarouselPrevious className="left-2 h-9 w-9 border-none bg-white/35 text-white backdrop-blur-md transition-opacity hover:bg-white/50 md:opacity-0 md:group-hover:opacity-100" />
                            <CarouselNext className="right-2 h-9 w-9 border-none bg-white/35 text-white backdrop-blur-md transition-opacity hover:bg-white/50 md:opacity-0 md:group-hover:opacity-100" />
                        </>
                    )}
                </Carousel>

                {/* Overlay Badges (Top Left) */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                    {isVipPartner && (
                        <div className="flex items-center gap-1 rounded-full bg-blue-600/90 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-xl backdrop-blur-md">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            VIP
                        </div>
                    )}
                    {hotel.is_recommended && (
                        <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/90 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-900 shadow-xl backdrop-blur-md dark:bg-zinc-900/90 dark:text-white">
                            <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                            Delegate Choice
                        </div>
                    )}
                </div>

                {/* Rating Badge (Bottom Right) */}
                {hotel.cached_rating && (
                    <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1.5 backdrop-blur-md">
                        <span className="text-[8px] font-black text-white/90 uppercase leading-none">Rating</span>
                        <div className="text-white text-[11px] font-black">
                            {hotel.cached_rating}
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-4 sm:p-5 md:p-6">
                <div className="flex-1">
                    {/* Top row: Stars + Price */}
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                        <div className="flex min-h-[3.5rem] flex-col items-start sm:items-end">
                            {hotel.minPrice != null && (
                                <>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white sm:text-[1.7rem]">
                                            {`$${hotel.minPrice}`}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                            / night
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-green-600 font-bold uppercase tracking-tight">
                                        Includes taxes & fees
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <h3 className="mb-2 text-xl font-black leading-tight text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-white md:text-2xl">
                        {hotel.name}
                    </h3>

                    <div className="mb-4 flex flex-wrap items-center gap-y-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <span className="line-clamp-2 min-w-0 flex-1">{hotel.address || "Ulaanbaatar, Mongolia"}</span>
                        <span className="mx-2 hidden text-zinc-300 sm:inline">•</span>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${hotel.latitude || hotel.address},${hotel.longitude || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 text-xs font-bold uppercase tracking-tight text-blue-600 hover:underline sm:mt-0"
                        >
                            Map
                        </a>
                    </div>

                    {/* Amenities Badges - Cleaned Up */}
                    <div className="mb-6 flex flex-wrap gap-2">
                        {hotel.amenities?.slice(0, 4).map((a, i) => (
                            <div key={i} className="flex items-center rounded-xl border border-zinc-100 bg-zinc-50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-tight text-zinc-600 dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:text-zinc-400">
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

                <div className="mt-auto flex flex-col gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        {displayDistance != null && (
                            <div className="flex flex-col rounded-2xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                                <div className="flex items-center text-[11px] font-black uppercase tracking-tight text-zinc-700 dark:text-zinc-300">
                                    <Navigation className="h-3 w-3 mr-1.5 text-blue-500" />
                                    {typeof displayDistance === 'number' ? displayDistance.toFixed(1) : displayDistance} km to Venue
                                </div>
                                <span className="ml-4.5 text-[9px] font-bold uppercase tracking-tighter text-zinc-400">
                                    {displayTime} drive
                                </span>
                            </div>
                        )}
                    </div>

                    <Link href={href} className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-900 px-8 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-zinc-900/10 transition-all hover:bg-blue-600 active:scale-95 sm:w-auto">
                        See Availability
                    </Link>
                </div>
            </div>
        </div>
    );
}
