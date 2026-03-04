"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

interface SingleHotelMapProps {
    latitude: number;
    longitude: number;
    hotelName: string;
}

const SingleHotelMap = dynamic<SingleHotelMapProps>(() => import('@/components/single-hotel-map-content'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        </div>
    )
});

export function SingleHotelMapWrapper({
    latitude,
    longitude,
    hotelName
}: {
    latitude: number;
    longitude: number;
    hotelName: string;
}) {
    return <SingleHotelMap latitude={latitude} longitude={longitude} hotelName={hotelName} />;
}
