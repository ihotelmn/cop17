"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Hotel } from "@/app/actions/public";

const HotelMap = dynamic(() => import('@/components/hotel-map'), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-inner">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
    )
});

export function HotelMapWrapper({ hotels }: { hotels: (Hotel & { minPrice: number })[] }) {
    return <HotelMap hotels={hotels} />;
}
