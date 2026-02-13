"use client";

import { Room } from "@/app/actions/admin";
import { RoomCard } from "./room-card";

interface RoomListProps {
    hotelId: string;
    rooms: Room[];
}

export function RoomList({ hotelId, rooms }: RoomListProps) {
    // Determine check-in/out dates (Mock for now, should come from context/props)
    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 1);

    if (rooms.length === 0) {
        return (
            <div className="text-center py-10 text-zinc-500">
                No rooms available for this hotel yet.
            </div>
        );
    }

    const cleanImages = (images: string[] | null | undefined): string[] => {
        if (!images || !Array.isArray(images)) return [];
        return images.map(url => {
            if (!url) return "";
            // Handle double-encoded JSON strings if necessary, though simpler is better
            // Ideally backend sends clean arrays. Assuming clean arrays for now based on public.ts logic
            return url;
        }).filter(Boolean);
    };

    return (
        <div className="space-y-6">
            {rooms.map(room => (
                <RoomCard
                    key={room.id}
                    // @ts-ignore
                    room={{
                        ...room,
                        price: room.price_per_night,
                        size: 40,
                        images: cleanImages(room.images), // Use the helper
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

