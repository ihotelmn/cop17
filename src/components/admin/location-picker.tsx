"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

interface LocationPickerProps {
    value?: { lat: number; lng: number } | null;
    onChange: (value: { lat: number; lng: number }) => void;
}

const MapPicker = dynamic(() => import("./map-picker"), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-md" />,
});

export function LocationPicker(props: LocationPickerProps) {
    return (
        <div className="space-y-2">
            <div className="h-[400px] w-full rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 relative z-0">
                <MapPicker {...props} />
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
                <div>Lat: {props.value?.lat.toFixed(6) || "N/A"}</div>
                <div>Lng: {props.value?.lng.toFixed(6) || "N/A"}</div>
            </div>
        </div>
    );
}
