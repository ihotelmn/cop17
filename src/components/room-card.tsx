"use client";

import React, { useState } from "react";
import { ImageGallery } from "@/components/image-gallery";
import { cn } from "@/lib/utils";
import { Check, User, Square, ArrowRight, ShieldCheck, Minus, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

interface Room {
    id: string;
    name: string;
    description: string;
    price: number;
    capacity: number;
    size: number; // in sqm
    amenities: string[];
    images: string[];
    total_inventory?: number;
}

interface RoomCardProps {
    room: Room;
    hotelId: string;
    checkIn?: Date;
    checkOut?: Date;
}

export function RoomCard({ room, hotelId, checkIn, checkOut }: RoomCardProps) {
    const nights = checkIn && checkOut ? Math.max(1, differenceInDays(checkOut, checkIn)) : 0;

    const inventory = room.total_inventory !== undefined ? room.total_inventory : 0;
    const isSoldOut = inventory <= 0;

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const currentQtyStr = searchParams.get(`r_${room.id}`);
    const quantity = currentQtyStr ? parseInt(currentQtyStr) : 0;

    const [localQty, setLocalQty] = React.useState(quantity);

    React.useEffect(() => {
        setLocalQty(quantity);
    }, [quantity]);

    const updateQuantity = (newQty: number) => {
        setLocalQty(newQty); // Optimistic immediate update
        const params = new URLSearchParams(searchParams.toString());
        if (newQty > 0) {
            params.set(`r_${room.id}`, newQty.toString());
        } else {
            params.delete(`r_${room.id}`);
        }
        React.startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    return (
        <div className={cn(
            "group relative overflow-hidden rounded-[2.5rem] border bg-white transition-all duration-500 flex flex-col xl:flex-row min-h-[480px]",
            isSoldOut
                ? "border-zinc-200 grayscale dark:border-zinc-800 opacity-80"
                : "border-zinc-200 shadow-xl shadow-zinc-200/40 hover:shadow-2xl hover:shadow-zinc-300/50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:shadow-none"
        )}>
            {/* Image Section */}
            <div className="relative xl:w-[42%] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <ImageGallery
                    images={room.images}
                    alt={room.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    aspectRatio="video"
                    showControls={!isSoldOut}
                />

                {/* Badges */}
                <div className="absolute top-8 left-8 z-10 flex flex-col gap-3">
                    {isSoldOut ? (
                        <div className="px-5 py-2.5 rounded-full bg-black/80 backdrop-blur-xl shadow-2xl border border-white/10 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Sold Out</span>
                        </div>
                    ) : (
                        <>
                            <div className="px-5 py-2.5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-xl shadow-xl border border-white/20">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 dark:text-white">Premium Collection</span>
                            </div>
                            {inventory <= 3 && (
                                <div className="px-5 py-2.5 rounded-full bg-red-600 shadow-xl border border-red-500/30 flex items-center gap-2 animate-bounce-slow">
                                    <Zap className="w-3.5 h-3.5 text-white fill-current" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Last {inventory} Units</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-8 md:p-12 justify-between relative">
                {isSoldOut && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[2px] pointer-events-none rounded-[2.5rem]">
                        <div className="rotate-[-12deg] border-4 border-black/20 dark:border-white/20 px-8 py-4 rounded-2xl">
                            <span className="text-4xl font-black uppercase tracking-[0.3em] opacity-20">No Vacancy</span>
                        </div>
                    </div>
                )}

                <div>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black text-zinc-950 dark:text-white tracking-tighter leading-tight capitalize">
                                {room.name.replace(/standart/ig, 'Standard')}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
                                    <User className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{room.capacity} Guests</span>
                                </div>
                                {room.size > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
                                        <Square className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{room.size} m²</span>
                                    </div>
                                )}
                                {inventory > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                        <Check className="h-4 w-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">{inventory} Units Left</span>
                                    </div>
                                )}
                            </div>
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Base Rate</p>
                            <div className="flex items-baseline md:justify-end gap-2">
                                <span className="text-5xl font-black tracking-tighter text-zinc-950 dark:text-white">${room.price}</span>
                                <span className="text-sm font-black uppercase tracking-widest text-zinc-400">USD</span>
                            </div>
                        </div>
                    </div>

                    {/* Amenities Display */}
                    {room.amenities && Array.isArray(room.amenities) && room.amenities.filter(Boolean).length > 0 && (
                        <div className="mb-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 font-mono">Room Features & Services</p>
                            <div className="flex flex-wrap gap-2 md:gap-3">
                                {room.amenities.filter(Boolean).map((amenity, i) => (
                                    <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-white/5 hover:border-blue-500/30 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                        <div className="h-4.5 w-4.5 bg-blue-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                            <Check className="h-3 w-3 text-white" strokeWidth={4} />
                                        </div>
                                        <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">{amenity.trim()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-8 mt-auto">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isSoldOut ? "bg-zinc-100 text-zinc-400" : "bg-green-500/10 text-green-500"
                        )}>
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-950 dark:text-white">Guaranteed Booking</p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Instant Confirmation Policy</p>
                        </div>
                    </div>

                    {isSoldOut ? (
                        <Button disabled className="w-full md:w-auto px-12 h-18 text-[11px] font-black uppercase tracking-[0.2em] rounded-2.5xl bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800">
                            Sold Out Online
                        </Button>
                    ) : localQty > 0 ? (
                        <div className="flex items-center justify-between gap-4 bg-zinc-950 dark:bg-white rounded-2.5xl p-2 w-full md:w-auto h-16 md:h-18 shadow-2xl shadow-zinc-950/20">
                            <button
                                onClick={() => updateQuantity(localQty - 1)}
                                aria-label={`Decrease quantity for ${room.name.replace(/standart/ig, 'Standard')}`}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center text-white dark:text-zinc-950 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-all active:scale-90"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <div className="flex flex-col items-center min-w-[5rem]">
                                <span className="text-xl md:text-2xl font-black text-white dark:text-zinc-950 leading-none">{localQty}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-1">Rooms</span>
                            </div>
                            <button
                                onClick={() => updateQuantity(localQty + 1)}
                                disabled={localQty >= inventory}
                                aria-label={`Increase quantity for ${room.name.replace(/standart/ig, 'Standard')}`}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center text-white dark:text-zinc-950 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-30 disabled:hover:scale-100 transition-all active:scale-90"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => updateQuantity(1)}
                            aria-label={`Select ${room.name.replace(/standart/ig, 'Standard')}`}
                            className="w-full md:w-auto px-12 h-16 md:h-18 text-[11px] md:text-xs font-black uppercase tracking-[0.2em] rounded-2.5xl transition-all duration-300 bg-zinc-950 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-100 shadow-2xl shadow-zinc-950/20 active:scale-[0.97]"
                        >
                            Select Residence
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
