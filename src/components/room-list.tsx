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

    const cleanImage = (url: string | undefined) => {
        if (!url) return "/images/room-placeholder.jpg";

        // Debug
        // console.log("Cleaning image URL:", url);

        let cleaned = url;

        // Handle ["url"] format (JSON stringified array)
        if (typeof cleaned === 'string' && (cleaned.startsWith('[') || cleaned.startsWith('"['))) {
            try {
                // Remove extra outer quotes if present
                if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                    cleaned = cleaned.slice(1, -1);
                }

                const parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed[0];
                }
            } catch (e) {
                // Fallback regex
                const match = cleaned.match(/https?:\/\/[^"\]]+/);
                if (match) return match[0];
            }
        }

        return cleaned;
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
                        image: cleanImage(room.images?.[0]),
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

