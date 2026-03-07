"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { differenceInDays } from "date-fns";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReservationSummaryProps {
    hotelId: string;
    rooms: any[];
    checkIn?: Date;
    checkOut?: Date;
    mode?: "desktop" | "mobile" | "both";
}

export function ReservationSummary({ hotelId, rooms, checkIn, checkOut, mode = "both" }: ReservationSummaryProps) {
    const searchParams = useSearchParams();
    const showDesktopSummary = mode !== "mobile";
    const showMobileSummary = mode !== "desktop";
    const scrollToRooms = useCallback(() => {
        if (typeof document === "undefined") {
            return;
        }

        const firstRoomCard = document.getElementById("first-room-card");
        if (firstRoomCard) {
            firstRoomCard.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        const roomsSection = document.getElementById("rooms");
        if (!roomsSection) {
            return;
        }

        roomsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    // Use URL params as single source of truth for dates
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const clientCheckIn = fromParam ? new Date(`${fromParam}T12:00:00`) : checkIn;
    const clientCheckOut = toParam ? new Date(`${toParam}T12:00:00`) : checkOut;

    const hasDates = !!(clientCheckIn && clientCheckOut);
    const nights = hasDates ? Math.max(1, differenceInDays(clientCheckOut!, clientCheckIn!)) : 0;

    // Calculate selected rooms
    const selectedRooms = rooms.reduce((acc, room) => {
        const qtyStr = searchParams.get(`r_${room.id}`);
        const qty = qtyStr ? parseInt(qtyStr) : 0;
        if (qty > 0) {
            acc.push({ ...room, quantity: qty });
        }
        return acc;
    }, [] as any[]);

    const totalRooms = selectedRooms.reduce((sum: number, room: any) => sum + room.quantity, 0);
    const totalPrice = hasDates
        ? selectedRooms.reduce((sum: number, room: any) => sum + (room.price_per_night * room.quantity * nights), 0)
        : 0;

    const checkoutParams = new URLSearchParams(searchParams.toString());
    if (!checkoutParams.has("from") && fromParam) checkoutParams.set("from", fromParam);
    if (!checkoutParams.has("to") && toParam) checkoutParams.set("to", toParam);
    const checkoutHref = `/hotels/${hotelId}/checkout?${checkoutParams.toString()}`;
    const mobileBar = showMobileSummary ? (
        <div
            className="fixed inset-x-0 bottom-0 z-50 px-4 lg:hidden"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
        >
            <div className="mx-auto max-w-md rounded-[1.4rem] border border-zinc-200/80 bg-white/95 p-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl dark:border-zinc-700 dark:bg-zinc-900/95">
                {selectedRooms.length === 0 ? (
                    <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                Room Selection
                            </p>
                            <p className="mt-1 truncate text-base font-black tracking-tight text-zinc-950 dark:text-white">
                                Choose a room
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                Jump to the first available room card.
                            </p>
                        </div>

                        <Button
                            type="button"
                            onClick={scrollToRooms}
                            className="h-12 min-w-[8.5rem] rounded-[1.1rem] bg-zinc-950 px-4 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-none hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                            Choose Room
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                {hasDates ? "Ready to continue" : "Finish your selection"}
                            </p>
                            <p className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">
                                {totalRooms} room{totalRooms > 1 ? "s" : ""}{hasDates ? ` • ${nights} night${nights > 1 ? "s" : ""}` : ""}
                            </p>
                            <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                {hasDates ? `Estimated total $${totalPrice}` : "Choose your stay dates to unlock pricing"}
                            </p>
                        </div>

                        {hasDates ? (
                            <Button asChild className="h-14 min-w-[9rem] rounded-2xl bg-blue-600 px-5 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700">
                                <Link href={checkoutHref}>
                                    Continue
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild variant="outline" className="h-14 min-w-[8.5rem] rounded-2xl border-zinc-200 px-4 text-[11px] font-black uppercase tracking-[0.16em] dark:border-zinc-700">
                                <Link href="#mobile-search-assistant">Set Dates</Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    ) : null;

    if (selectedRooms.length === 0) {
        if (!showDesktopSummary) {
            return mobileBar;
        }

        return (
            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-4 rounded-2xl border border-zinc-200/50 bg-zinc-50 p-6 text-zinc-500 dark:border-zinc-700/50 dark:bg-zinc-800/50">
                    <Info className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">Select your preferred rooms from the list to see your reservation summary and proceed to booking.</p>
                </div>
            </div>
        );
    }

    // If rooms selected but no dates, prompt user to pick dates first
    if (!hasDates) {
        return (
            <>
                {showDesktopSummary && (
                    <div className="animate-in slide-in-from-bottom-4 fade-in border-t border-zinc-100 pt-8 duration-500 dark:border-zinc-800">
                        <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Selected Inventory</h4>
                        <div className="mb-6 space-y-3">
                            {selectedRooms.map((room: any) => (
                                <div key={room.id} className="flex items-center justify-between rounded-xl border border-blue-100/50 bg-blue-50/50 p-3 text-sm dark:border-blue-800/20 dark:bg-blue-900/10">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50">
                                            <span className="text-xs font-bold">{room.quantity}x</span>
                                        </div>
                                        <span className="max-w-[150px] truncate font-bold capitalize text-zinc-900 dark:text-zinc-100">{room.name.replace(/standart/ig, "Standard")}</span>
                                    </div>
                                    <span className="font-bold text-zinc-400">—</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-amber-200/50 bg-amber-50 p-4 text-amber-700 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-400">
                            <Info className="h-5 w-5 shrink-0" />
                            <p className="text-xs font-bold">Please select your stay dates above to see pricing and proceed to booking.</p>
                        </div>
                    </div>
                )}
                {mobileBar}
            </>
        );
    }

    return (
        <>
            {showDesktopSummary && (
                <div className="animate-in slide-in-from-bottom-4 fade-in border-t border-zinc-100 pt-8 duration-500 dark:border-zinc-800">
                    <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Selected Inventory</h4>

                    <div className="mb-6 space-y-3">
                        {selectedRooms.map((room: any) => (
                            <div key={room.id} className="flex items-center justify-between rounded-xl border border-blue-100/50 bg-blue-50/50 p-3 text-sm dark:border-blue-800/20 dark:bg-blue-900/10">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50">
                                        <span className="text-xs font-bold">{room.quantity}x</span>
                                    </div>
                                    <span className="max-w-[150px] truncate font-bold capitalize text-zinc-900 dark:text-zinc-100">{room.name.replace(/standart/ig, "Standard")}</span>
                                </div>
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">${room.price_per_night * room.quantity * nights}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mb-8 flex items-end justify-between">
                        <div>
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">Estimated Total</p>
                            <p className="text-xs font-bold text-zinc-500">{totalRooms} Rooms, {nights} Nights</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black tracking-tighter text-blue-600 dark:text-blue-400">${totalPrice}</span>
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">USD</span>
                        </div>
                    </div>

                    <Button asChild className="group h-18 w-full rounded-2.5xl bg-blue-600 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.97]">
                        <Link href={checkoutHref}>
                            Proceed to Secure Booking
                            <ArrowRight className="ml-4 h-5 w-5 transition-transform group-hover:translate-x-2" />
                        </Link>
                    </Button>
                </div>
            )}
            {mobileBar}
        </>
    );
}
