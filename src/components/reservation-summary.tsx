"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { differenceInDays } from "date-fns";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Room } from "@/types/hotel";
import {
    type BookingSearchState,
    applyBookingSearchStateToParams,
    mergeBookingSearchState,
    readPartialBookingSearchState,
    readStoredBookingSearchState,
} from "@/lib/booking-search";

type SelectedRoom = Room & { quantity: number };

interface ReservationSummaryProps {
    hotelId: string;
    rooms: Room[];
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
    const scrollToSearch = useCallback(() => {
        if (typeof document === "undefined") {
            return;
        }

        const mobileAssistant = document.getElementById("mobile-search-assistant");
        if (mobileAssistant && mobileAssistant.offsetParent !== null) {
            mobileAssistant.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        const desktopAssistant = document.getElementById("reservation-assistant");
        if (!desktopAssistant || desktopAssistant.offsetParent === null) {
            return;
        }

        desktopAssistant.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    // Source of truth for dates: merge URL params with localStorage-persisted
    // state (the same pattern SearchForm uses). On first paint after a hard
    // navigation the URL may be missing `from`/`to` even though the user has
    // already chosen dates in a previous session — falling back to localStorage
    // here keeps the summary in sync with the visible "Stay details" widget.
    const searchParamsString = searchParams.toString();
    const urlSearchState = useMemo(
        () => readPartialBookingSearchState(new URLSearchParams(searchParamsString)),
        [searchParamsString]
    );
    const [storedSearchState, setStoredSearchState] = useState<Partial<BookingSearchState> | null>(
        () => readStoredBookingSearchState()
    );

    useEffect(() => {
        // Pick up persisted state once the component is on the client. This
        // mirrors the effect inside SearchForm so both stay in lockstep when
        // navigating between hotel cards.
        setStoredSearchState(readStoredBookingSearchState());
    }, [searchParamsString]);

    const merged = useMemo(
        () => mergeBookingSearchState(urlSearchState, storedSearchState),
        [storedSearchState, urlSearchState]
    );

    const fromParam = searchParams.get("from") ?? merged.from ?? undefined;
    const toParam = searchParams.get("to") ?? merged.to ?? undefined;
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
    }, [] as SelectedRoom[]);

    const totalRooms = selectedRooms.reduce((sum: number, room) => sum + room.quantity, 0);
    const totalPrice = hasDates
        ? selectedRooms.reduce((sum: number, room) => sum + (room.price_per_night * room.quantity * nights), 0)
        : 0;
    const selectedRoomsLabel = selectedRooms
        .slice(0, 2)
        .map((room) => `${room.quantity}x ${room.name.replace(/standart/ig, "Standard")}`)
        .join(", ");
    const remainingSelectedRooms = Math.max(0, selectedRooms.length - 2);

    // Build checkout URL with the merged search state so dates persist even
    // when the user reached this page via a deep link without `from`/`to`.
    const checkoutParams = new URLSearchParams(searchParams.toString());
    applyBookingSearchStateToParams(checkoutParams, merged);
    if (!checkoutParams.has("from") && fromParam) checkoutParams.set("from", fromParam);
    if (!checkoutParams.has("to") && toParam) checkoutParams.set("to", toParam);
    const checkoutHref = `/hotels/${hotelId}/checkout?${checkoutParams.toString()}`;

    if (rooms.length === 0) {
        return null;
    }

    const mobileBar = showMobileSummary ? (
        <div
            className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="mx-auto max-w-md px-3">
                <div className="rounded-t-[1.4rem] border border-zinc-200/80 border-b-0 bg-white/96 p-3 shadow-[0_-12px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-zinc-700 dark:bg-zinc-900/96">
                {selectedRooms.length === 0 ? (
                    <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-black tracking-tight text-zinc-950 dark:text-white">
                                Choose a room
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                View types and rates to continue.
                            </p>
                        </div>

                        <Button
                            type="button"
                            onClick={scrollToRooms}
                            className="h-11 min-w-[8.25rem] shrink-0 rounded-[1rem] bg-blue-600 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                        >
                            View Rooms
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                {hasDates ? "Ready to continue" : "Finish your selection"}
                            </p>
                            <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                                {totalRooms} room{totalRooms > 1 ? "s" : ""}{hasDates ? ` • ${nights} night${nights > 1 ? "s" : ""}` : ""}
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                {hasDates ? `$${totalPrice} total` : "Add stay dates to continue"}
                            </p>
                        </div>

                        {hasDates ? (
                            <Button asChild className="h-11 min-w-[8.25rem] shrink-0 rounded-[1rem] bg-blue-600 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                                <Link href={checkoutHref}>
                                    Continue
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild variant="outline" className="h-11 min-w-[8.25rem] shrink-0 rounded-[1rem] border-zinc-200 px-4 text-[10px] font-black uppercase tracking-[0.16em] dark:border-zinc-700">
                                <Link href="#mobile-search-assistant">Set Dates</Link>
                            </Button>
                        )}
                    </div>
                )}
                </div>
            </div>
        </div>
    ) : null;

    if (selectedRooms.length === 0) {
        if (!showDesktopSummary) {
            return mobileBar;
        }

        return (
            <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/50 bg-zinc-50 p-5 dark:border-zinc-700/50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-4 text-zinc-500">
                        <Info className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">Select your preferred rooms from the list to proceed to booking.</p>
                    </div>
                    <Button
                        type="button"
                        onClick={scrollToRooms}
                        className="h-14 w-full rounded-2xl bg-blue-600 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700"
                    >
                        Choose Room
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    // If rooms selected but no dates, prompt user to pick dates first
    if (!hasDates) {
        return (
            <>
                {showDesktopSummary && (
                    <div className="animate-in slide-in-from-bottom-4 fade-in border-t border-zinc-100 pt-5 duration-500 dark:border-zinc-800">
                        <div className="rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Selected Rooms</p>
                            <p className="mt-2 text-sm font-black text-zinc-950 dark:text-white">
                                {selectedRoomsLabel}
                                {remainingSelectedRooms > 0 ? ` +${remainingSelectedRooms} more` : ""}
                            </p>
                            <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                {totalRooms} room{totalRooms > 1 ? "s" : ""} selected
                            </p>
                        </div>
                        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-200/50 bg-amber-50 p-4 text-amber-700 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-400">
                            <Info className="h-5 w-5 shrink-0" />
                            <p className="text-xs font-bold">Please select your stay dates above to see pricing and proceed to booking.</p>
                        </div>
                        <Button
                            type="button"
                            onClick={scrollToSearch}
                            variant="outline"
                            className="mt-4 h-14 w-full rounded-2xl border-amber-300 bg-white text-[11px] font-black uppercase tracking-[0.16em] text-amber-700 hover:bg-amber-50 dark:border-amber-700/60 dark:bg-transparent dark:text-amber-400 dark:hover:bg-amber-900/10"
                        >
                            Set Dates To Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}
                {mobileBar}
            </>
        );
    }

    return (
        <>
            {showDesktopSummary && (
                <div className="animate-in slide-in-from-bottom-4 fade-in border-t border-zinc-100 pt-5 duration-500 dark:border-zinc-800">
                    <div className="rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ready To Continue</p>
                                <p className="mt-2 truncate text-sm font-black text-zinc-950 dark:text-white">
                                    {selectedRoomsLabel}
                                    {remainingSelectedRooms > 0 ? ` +${remainingSelectedRooms} more` : ""}
                                </p>
                                <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                    {totalRooms} room{totalRooms > 1 ? "s" : ""} • {nights} night{nights > 1 ? "s" : ""}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Estimated Total</p>
                                <p className="mt-1 text-2xl font-black tracking-tighter text-blue-600 dark:text-blue-400">${totalPrice}</p>
                            </div>
                        </div>
                    </div>

                    <Button asChild className="group mt-4 h-14 w-full rounded-2xl bg-blue-600 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.97]">
                        <Link href={checkoutHref}>
                            Continue
                            <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>
            )}
            {mobileBar}
        </>
    );
}
