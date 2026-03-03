"use client";

import { Room } from "@/app/actions/admin";
import { RoomCard } from "./room-card";
import { Info } from "lucide-react";

interface RoomListProps {
    hotelId: string;
    rooms: Room[];
    checkIn: Date;
    checkOut: Date;
}

export function RoomList({ hotelId, rooms, checkIn, checkOut }: RoomListProps) {
    if (rooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Info className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-zinc-950 dark:text-white uppercase tracking-widest text-xs mb-2">No Availability Found</h3>
                    <p className="text-zinc-500 font-medium">We couldn't find any rooms matching your current dates. Try adjusting your search criteria.</p>
                </div>
            </div>
        );
    }

    const cleanImages = (images: any): string[] => {
        if (!images) return [];
        if (Array.isArray(images)) return images;
        if (typeof images === 'string') return [images];
        return [];
    };

    return (
        <div className="space-y-12">
            {rooms.map(room => (
                <RoomCard
                    key={room.id}
                    // @ts-ignore
                    room={{
                        ...room,
                        price: room.price_per_night,
                        size: room.size || 0,
                        images: cleanImages(room.images),
                        amenities: room.amenities || []
                    }}
                    hotelId={hotelId}
                    checkIn={checkIn}
                    checkOut={checkOut}
                />
            ))}
        </div>
    )
}

