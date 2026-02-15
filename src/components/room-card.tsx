"use client";

import { ImageGallery } from "@/components/image-gallery";
import { Check, User, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

interface Room {
    id: string;
    name: string;
    description: string;
    price: number;
    capacity: number;
    size: number; // in sqm
    amenities: string[];
    images: string[];
}

interface RoomCardProps {
    room: Room;
    hotelId: string;
    checkIn: Date;
    checkOut: Date;
}

export function RoomCard({ room, hotelId, checkIn, checkOut }: RoomCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 flex flex-col md:flex-row">
            <div className="relative aspect-video md:w-1/3 md:aspect-auto overflow-hidden">
                <ImageGallery
                    images={room.images}
                    alt={room.name}
                    className="h-full w-full"
                    aspectRatio="video"
                    showControls={true}
                />
            </div>
            <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                    <div className="flex items-start justify-between">
                        <h3 className="text-xl font-semibold">{room.name}</h3>
                        <div className="text-right">
                            <span className="text-2xl font-bold">${room.price}</span>
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">/night</span>
                        </div>
                    </div>
                    <p className="mt-2 text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {room.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {room.capacity} Guests
                        </div>
                        <div className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            {room.size} m²
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {room.amenities.slice(0, 4).map((amenity) => (
                            <div key={amenity} className="flex items-center gap-2 text-sm text-zinc-500">
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                {amenity}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button asChild className="w-full md:w-auto px-8 h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/10">
                        <Link href={`/hotels/${hotelId}/checkout/${room.id}?from=${format(checkIn, "yyyy-MM-dd")}&to=${format(checkOut, "yyyy-MM-dd")}`}>
                            Book This Room
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
