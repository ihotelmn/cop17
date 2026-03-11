"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateHotelPublishedStatus } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

interface HotelPublishToggleProps {
    hotelId: string;
    hotelName: string;
    initialPublished: boolean;
}

export function HotelPublishToggle({
    hotelId,
    hotelName,
    initialPublished,
}: HotelPublishToggleProps) {
    const [isPublished, setIsPublished] = useState(initialPublished);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        const nextValue = !isPublished;
        setIsPublished(nextValue);

        startTransition(async () => {
            const result = await updateHotelPublishedStatus(hotelId, nextValue);

            if (result?.success) {
                toast.success(`${hotelName} is now ${nextValue ? "active" : "inactive"}.`);
                return;
            }

            setIsPublished(!nextValue);
            toast.error(result?.error || "Failed to update hotel status.");
        });
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isPublished}
            aria-label={`${hotelName} status toggle`}
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
                "inline-flex items-center gap-3 rounded-full border border-zinc-700 bg-zinc-950/80 px-3 py-1.5 text-left transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-70",
                isPublished ? "text-emerald-300" : "text-zinc-400"
            )}
        >
            <span className="min-w-[56px] text-xs font-medium">
                {isPending ? "Saving..." : isPublished ? "Active" : "Inactive"}
            </span>
            <span
                className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    isPublished ? "bg-emerald-500/80" : "bg-zinc-700"
                )}
            >
                <span
                    className={cn(
                        "inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-zinc-900 transition-transform",
                        isPublished ? "translate-x-6" : "translate-x-1"
                    )}
                >
                    {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                </span>
            </span>
        </button>
    );
}
