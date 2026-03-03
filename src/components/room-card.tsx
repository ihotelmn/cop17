"use client";

import React, { useState } from "react";
import { ImageGallery } from "@/components/image-gallery";
import { cn } from "@/lib/utils";
import { Check, User, Square, ArrowRight, ShieldCheck, Minus, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";

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
    checkIn: Date;
    checkOut: Date;
}

export function RoomCard({ room, hotelId, checkIn, checkOut }: RoomCardProps) {
    const nights = Math.max(1, differenceInDays(checkOut, checkIn));

    const inventory = room.total_inventory !== undefined ? room.total_inventory : 0;
    const isSoldOut = inventory <= 0;

    const [quantity, setQuantity] = useState(isSoldOut ? 0 : 1);
    const totalPrice = room.price * quantity * nights;

    const handleIncrement = () => {
        if (quantity < inventory) {
            setQuantity(prev => prev + 1);
        }
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
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
                            <h3 className="text-4xl font-black text-zinc-950 dark:text-white tracking-tighter leading-tight">
                                {room.name}
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
                                {!isSoldOut && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                        <Check className="h-4 w-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">Available</span>
                                    </div>
                                )}
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

                    <div
                        className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed font-medium mb-10 line-clamp-2 max-w-2xl"
                        dangerouslySetInnerHTML={{ __html: room.description }}
                    />

                    {/* Selector & Price Logic */}
                    <div className={cn(
                        "rounded-[2rem] p-8 border flex flex-col lg:flex-row items-center justify-between gap-10 mb-10 transition-all duration-300",
                        isSoldOut
                            ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                            : "bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/20 shadow-inner"
                    )}>
                        <div className="space-y-4 w-full lg:w-auto text-center lg:text-left">
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Inventory Selection</p>
                            <div className="flex items-center justify-center lg:justify-start gap-6">
                                <button
                                    onClick={handleDecrement}
                                    disabled={quantity <= 1 || isSoldOut}
                                    className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-950 dark:text-white hover:bg-zinc-50 disabled:opacity-20 transition-all shadow-sm active:scale-90"
                                >
                                    <Minus className="w-6 h-6" />
                                </button>
                                <div className="flex flex-col items-center min-w-[3rem]">
                                    <span className="text-3xl font-black text-zinc-950 dark:text-white">{quantity}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Rooms</span>
                                </div>
                                <button
                                    onClick={handleIncrement}
                                    disabled={quantity >= inventory || isSoldOut}
                                    className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-950 dark:text-white hover:bg-zinc-50 disabled:opacity-20 transition-all shadow-sm active:scale-90"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="h-px lg:h-16 w-full lg:w-px bg-zinc-200 dark:bg-zinc-800" />

                        <div className="space-y-2 text-center lg:text-right w-full lg:w-auto">
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Estimated Total ({nights} Nights)</p>
                            <div className="flex items-baseline justify-center lg:justify-end gap-3">
                                <span className={cn(
                                    "text-5xl font-black tracking-tighter transition-colors",
                                    isSoldOut ? "text-zinc-300 dark:text-zinc-700" : "text-blue-600 dark:text-blue-400"
                                )}>${totalPrice}</span>
                                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Overall</span>
                            </div>
                        </div>
                    </div>
                </div>

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

                    <Button
                        asChild={!isSoldOut}
                        disabled={isSoldOut}
                        className={cn(
                            "w-full md:w-auto px-12 h-18 text-[11px] font-black uppercase tracking-[0.2em] rounded-2.5xl transition-all duration-300",
                            isSoldOut
                                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800"
                                : "bg-zinc-950 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-100 shadow-2xl shadow-zinc-950/20 active:scale-[0.97] group"
                        )}
                    >
                        {isSoldOut ? (
                            "Sold Out Online"
                        ) : (
                            <Link href={`/hotels/${hotelId}/checkout/${room.id}?from=${format(checkIn, "yyyy-MM-dd")}&to=${format(checkOut, "yyyy-MM-dd")}&quantity=${quantity}`}>
                                {quantity > 1 ? `Reserve ${quantity} Selected Residences` : "Secure This Residence"}
                                <ArrowRight className="ml-4 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                            </Link>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
