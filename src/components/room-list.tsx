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

    const cleanImages = (images: any): string[] => {
        if (!images) return [];

        // If it's already an array, return it (ImageGallery will clean nested strings)
        if (Array.isArray(images)) return images;

        // If it's a string (malformed data), wrap in array and let ImageGallery handle it
        if (typeof images === 'string') return [images];

        return [];
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

