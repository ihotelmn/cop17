"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Wifi, Car, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hotel } from "@/app/actions/public";

export function HotelList({ hotels }: { hotels: (Hotel & { minPrice: number })[] }) {
    if (!hotels || hotels.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-500">No hotels found at the moment.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
            ))}
        </div>
    )
}

function HotelCard({ hotel }: { hotel: (Hotel & { minPrice: number }) }) {
    const mainImage = hotel.images && hotel.images.length > 0 ? hotel.images[0] : "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2940";

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                    src={mainImage}
                    alt={hotel.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 right-3 flex items-center rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-amber-600 shadow-sm">
                    <Star className="mr-1 h-3.5 w-3.5 fill-current" />
                    {hotel.stars}
                </div>
            </div>
            <div className="p-5">
                <div>
                    <h3 className="text-xl font-bold leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                        {hotel.name}
                    </h3>
                    <div className="mt-2 flex items-center text-sm text-zinc-500 dark:text-zinc-400">
                        <MapPin className="mr-1.5 h-4 w-4 shrink-0" />
                        <span className="truncate">{hotel.address || "Ulaanbaatar, Mongolia"}</span>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {hotel.amenities?.filter(a => typeof a === 'string').map((amenity, i) => (
                        <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            {amenity}
                        </span>
                    )).slice(0, 3)}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Starting from</p>
                        <p className="text-xl font-black text-zinc-900 dark:text-white">
                            {hotel.minPrice != null && hotel.minPrice > 0 ? `$${hotel.minPrice}` : "N/A"}<span className="text-xs font-medium text-zinc-400 ml-1">/night</span>
                        </p>
                    </div>
                    <Button asChild className="rounded-full shadow-md hover:shadow-lg transition-all" size="sm">
                        <Link href={`/hotels/${hotel.id}`}>Details</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
