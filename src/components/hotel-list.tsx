"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Wifi, Car, Coffee, ArrowRight, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hotel } from "@/app/actions/public";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { estimateTravelTime } from "@/lib/venue";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

export function HotelList({ hotels }: { hotels: (Hotel & { minPrice: number })[] }) {
    if (!hotels || hotels.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
            ))}
        </div>
    )
}

function HotelCard({ hotel }: { hotel: (Hotel & { minPrice: number }) }) {
    // Determine badges
    const isOfficial = hotel.is_official_partner;
    const isRecommended = hotel.is_recommended;
    const hasShuttle = hotel.has_shuttle_service || hotel.amenities?.includes("Shuttle") || hotel.amenities?.includes("Airport shuttle");

    // Images fallback
    const images = hotel.images && hotel.images.length > 0
        ? hotel.images
        : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2940"];

    // Use cached real distance if available, otherwise fallback to calculated logic
    const displayDistance = hotel.cached_distance_km || hotel.distanceToVenue;
    const displayTime = hotel.cached_drive_time_text || (hotel.distanceToVenue ? `~${estimateTravelTime(hotel.distanceToVenue, 'driving')}` : null);
    const isRealData = !!hotel.cached_drive_time_text;

    return (
        <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Image Section - Slider */}
            <div className="relative w-full md:w-[280px] lg:w-[320px] aspect-[16/10] md:aspect-auto shrink-0 bg-zinc-100 dark:bg-zinc-800">
                <Carousel className="w-full h-full">
                    <CarouselContent className="h-full">
                        {images.slice(0, 5).map((img, index) => (
                            <CarouselItem key={index} className="h-full">
                                <div className="relative w-full h-full">
                                    <Image
                                        src={img.startsWith('http') ? img : `https://api.myhotel.mn/image?path=${img}`}
                                        alt={`${hotel.name} - view ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {images.length > 1 && (
                        <>
                            <CarouselPrevious className="left-2 bg-white/50 hover:bg-white/80 border-none h-6 w-6" />
                            <CarouselNext className="right-2 bg-white/50 hover:bg-white/80 border-none h-6 w-6" />
                        </>
                    )}
                </Carousel>

                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {isOfficial && (
                        <span className="inline-flex items-center rounded-md bg-blue-600 px-2 py-1 text-[10px] font-bold text-white shadow-lg border border-blue-500/50 backdrop-blur-md uppercase tracking-wider">
                            Official Partner
                        </span>
                    )}
                    {isRecommended && (
                        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 shadow-sm border border-amber-200/50 backdrop-blur-md uppercase tracking-wider">
                            COP17 Recommended
                        </span>
                    )}
                    {hotel.stars >= 5 && (
                        <span className="inline-flex items-center rounded-md bg-zinc-900/80 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md uppercase tracking-wider">
                            Luxury
                        </span>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-5 md:p-6 justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {hotel.hotel_type && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                        {hotel.hotel_type}
                                    </span>
                                )}
                                <div className="flex items-center">
                                    {Array.from({ length: hotel.stars }).map((_, i) => (
                                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                {hotel.name}
                            </h3>
                        </div>
                        {/* Rating Box - Google Reviews */}
                        {hotel.cached_rating && (
                            <div className="hidden md:flex flex-col items-end">
                                <div className="flex items-center justify-center h-10 min-w-10 px-1 rounded-lg bg-blue-600 text-white font-bold text-sm shadow-md">
                                    {hotel.cached_rating}
                                </div>
                                <span className="text-xs text-zinc-500 mt-1">
                                    {hotel.cached_rating >= 4.5 ? "Exceptional" :
                                        hotel.cached_rating >= 4.0 ? "Very Good" :
                                            hotel.cached_rating >= 3.5 ? "Good" : "Average"}
                                </span>
                                {hotel.cached_review_count && (
                                    <span className="text-[10px] text-zinc-400">
                                        {hotel.cached_review_count} reviews
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-2 flex items-center text-sm text-zinc-500 dark:text-zinc-400">
                        <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <span className="line-clamp-1">{hotel.address || "Ulaanbaatar, Mongolia"}</span>
                        <span className="mx-2 text-zinc-300">•</span>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${hotel.latitude || hotel.address},${hotel.longitude || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-medium hover:underline cursor-pointer"
                        >
                            Show on map
                        </a>
                    </div>

                    {/* Amenities Badges */}
                    <div className="mt-5 flex flex-wrap gap-2.5">
                        {hotel.amenities?.slice(0, 5).map((a, i) => {
                            const isDelegateFavorite = ["WiFi", "Wireless", "Business", "Meeting", "Conference", "Security", "Safe", "Air condition", "AC"].some(term => a.toLowerCase().includes(term.toLowerCase()));

                            return (
                                <div key={i} className={cn(
                                    "flex items-center text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all",
                                    isDelegateFavorite
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/40"
                                        : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700/50"
                                )}>
                                    {a.toLowerCase().includes("wifi") && <Wifi className="h-3.5 w-3.5 mr-1.5 text-blue-500" />}
                                    {a.toLowerCase().includes("shuttle") && <Car className="h-3.5 w-3.5 mr-1.5 text-green-500" />}
                                    {a.toLowerCase().includes("breakfast") && <Coffee className="h-3.5 w-3.5 mr-1.5 text-amber-500" />}
                                    {a.toLowerCase().includes("air condit") && <span className="mr-1.5 text-sky-500">❄️</span>}
                                    {a.toLowerCase().includes("meeting") && <span className="mr-1.5 text-indigo-500">🤝</span>}
                                    {a}
                                </div>
                            );
                        })}
                        {(hotel.amenities?.length || 0) > 5 && (
                            <span className="text-[10px] font-bold text-zinc-400 self-center uppercase tracking-tighter">
                                +{hotel.amenities!.length - 5} others
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-zinc-400 mb-0.5">Price for 1 night, 1 adult</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-zinc-900 dark:text-white">
                                {hotel.minPrice ? `$${hotel.minPrice}` : "N/A"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-green-600 font-bold">Includes taxes & fees</span>
                            {displayDistance != null && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-100 dark:border-blue-800/50 font-bold whitespace-nowrap flex items-center gap-1 shadow-sm" title="Distance to UG Arena">
                                        <Navigation className="h-2.5 w-2.5" />
                                        {typeof displayDistance === 'number' ? displayDistance.toFixed(1) : displayDistance} km to Venue
                                    </span>
                                    <span className={`text-[10px] px-2 py-1 rounded border font-bold whitespace-nowrap shadow-sm ${isRealData ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800/50" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700"}`}>
                                        {displayTime}
                                    </span>
                                </div>
                            )}
                            {hasShuttle && (
                                <span className="text-[10px] bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded border border-green-100 dark:border-green-800/50 font-bold whitespace-nowrap flex items-center gap-1 shadow-sm">
                                    <Car className="h-2.5 w-2.5" />
                                    Official Shuttle Service
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-shrink-0">
                        <Button asChild size="lg" className="rounded-full px-8 shadow-md hover:shadow-lg transition-all group-hover:bg-blue-600">
                            <Link href={`/hotels/${hotel.id}`} className="gap-2">
                                See Availability <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
