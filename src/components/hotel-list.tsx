"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Wifi, Car, Coffee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hotel } from "@/app/actions/public";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

export function HotelList({ hotels }: { hotels: (Hotel & { minPrice: number })[] }) {
    if (!hotels || hotels.length === 0) {
        return null; // Handled by parent
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
    const isOfficial = true; // Logic to determine if official partner
    const hasShuttle = hotel.amenities?.includes("Shuttle");

    // Images fallback
    const images = hotel.images && hotel.images.length > 0
        ? hotel.images
        : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2940"];

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
                                        src={img}
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
                        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800 shadow-sm border border-amber-200/50 backdrop-blur-md">
                            Official Partner
                        </span>
                    )}
                    {hotel.stars >= 5 && (
                        <span className="inline-flex items-center rounded-md bg-zinc-900/80 px-2 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
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
                        {/* Rating Box - Placeholder for Review System */}
                        <div className="hidden md:flex flex-col items-end">
                            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 text-white font-bold text-sm shadow-md">
                                9.2
                            </div>
                            <span className="text-xs text-zinc-500 mt-1">Exceptional</span>
                        </div>
                    </div>

                    <div className="mt-2 flex items-center text-sm text-zinc-500 dark:text-zinc-400">
                        <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <span className="line-clamp-1">{hotel.address || "Ulaanbaatar, Mongolia"}</span>
                        <span className="mx-2 text-zinc-300">•</span>
                        <span className="text-blue-600 font-medium hover:underline cursor-pointer">Show on map</span>
                    </div>

                    {/* Amenities Badges */}
                    <div className="mt-5 flex flex-wrap gap-3">
                        {hotel.amenities?.slice(0, 4).map((a, i) => (
                            <div key={i} className="flex items-center text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                                {/* Icons mapping could go here */}
                                {a === "WiFi" && <Wifi className="h-3 w-3 mr-1.5" />}
                                {a === "Shuttle" && <Car className="h-3 w-3 mr-1.5" />}
                                {a === "Breakfast" && <Coffee className="h-3 w-3 mr-1.5" />}
                                {a}
                            </div>
                        ))}
                        {(hotel.amenities?.length || 0) > 4 && (
                            <span className="text-xs font-medium text-zinc-400 self-center">
                                +{hotel.amenities!.length - 4} more
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
                        <span className="text-xs text-green-600 font-bold mt-1">Includes taxes & fees</span>
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
