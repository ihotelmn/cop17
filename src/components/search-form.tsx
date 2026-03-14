"use client";

import * as React from "react";
import { differenceInDays, format } from "date-fns";
import {
    BedDouble,
    Calendar as CalendarIcon,
    ChevronDown,
    Minus,
    Plus,
    Sparkles,
    Users,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    applyBookingSearchStateToParams,
    type BookingSearchState,
    getDateRangeFromBookingSearchState,
    mergeBookingSearchState,
    normalizeBookingSearchState,
    persistBookingSearchState,
    readPartialBookingSearchState,
    readStoredBookingSearchState,
} from "@/lib/booking-search";

interface SearchFormProps extends React.HTMLAttributes<HTMLDivElement> {
    compact?: boolean;
}

export function SearchForm({ className, compact = false }: SearchFormProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const searchParamsString = searchParams.toString();

    const [isDatePopoverOpen, setIsDatePopoverOpen] = React.useState(false);
    const [isGuestsPopoverOpen, setIsGuestsPopoverOpen] = React.useState(false);
    const [isMobileViewport, setIsMobileViewport] = React.useState(false);
    const [storedSearchState, setStoredSearchState] = React.useState<Partial<BookingSearchState> | null>(
        () => readStoredBookingSearchState()
    );

    const urlSearchState = React.useMemo(
        () => readPartialBookingSearchState(new URLSearchParams(searchParamsString)),
        [searchParamsString]
    );

    const bookingSearchState = React.useMemo(
        () => mergeBookingSearchState(urlSearchState, storedSearchState),
        [storedSearchState, urlSearchState]
    );

    const date: DateRange | undefined = React.useMemo(
        () => getDateRangeFromBookingSearchState(bookingSearchState),
        [bookingSearchState]
    );

    const adults = bookingSearchState.adults;
    const children = bookingSearchState.children;
    const rooms = bookingSearchState.rooms;
    const nights = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;
    const totalGuests = adults + children;

    React.useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return;
        }

        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const updateViewport = () => setIsMobileViewport(mediaQuery.matches);

        updateViewport();
        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", updateViewport);
            return () => mediaQuery.removeEventListener("change", updateViewport);
        }

        mediaQuery.addListener(updateViewport);

        return () => mediaQuery.removeListener(updateViewport);
    }, []);

    React.useEffect(() => {
        const persistedState = readStoredBookingSearchState();
        if (!persistedState) {
            return;
        }

        setStoredSearchState(persistedState);

        const mergedState = mergeBookingSearchState(urlSearchState, persistedState);
        const params = new URLSearchParams(searchParamsString);
        applyBookingSearchStateToParams(params, mergedState);

        const nextParamsString = params.toString();
        if (nextParamsString === searchParamsString) {
            return;
        }

        router.replace(`${pathname}${nextParamsString ? `?${nextParamsString}` : ""}`, {
            scroll: false,
        });
    }, [pathname, router, searchParamsString, urlSearchState]);

    const updateParams = (overrides?: Partial<BookingSearchState>) => {
        const nextSearchState = normalizeBookingSearchState({
            ...bookingSearchState,
            ...(overrides ?? {}),
        });

        persistBookingSearchState(nextSearchState);
        setStoredSearchState(nextSearchState);

        const params = new URLSearchParams(searchParamsString);
        applyBookingSearchStateToParams(params, nextSearchState);

        const nextParamsString = params.toString();
        if (nextParamsString !== searchParamsString) {
            router.replace(`${pathname}${nextParamsString ? `?${nextParamsString}` : ""}`, {
                scroll: false,
            });
        }
    };

    const handleDateSelect = (selectedRange: DateRange | undefined) => {
        if (date?.from && date?.to && selectedRange?.from) {
            const clickedDay = selectedRange.to || selectedRange.from;
            if (clickedDay.getTime() !== date.to.getTime()) {
                updateParams({
                    from: format(clickedDay, "yyyy-MM-dd"),
                    to: undefined,
                });
                return;
            }
        }

        updateParams({
            from: selectedRange?.from ? format(selectedRange.from, "yyyy-MM-dd") : undefined,
            to: selectedRange?.to ? format(selectedRange.to, "yyyy-MM-dd") : undefined,
        });
    };

    if (compact) {
        return (
            <div className={cn("space-y-3", className)}>
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Dates</p>
                        <p className="mt-1 text-xs font-black tracking-tight text-zinc-950 dark:text-white">
                            {date?.from && date?.to
                                ? `${format(date.from, "MMM d")} - ${format(date.to, "MMM d")}`
                                : "Not set"}
                        </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Guests</p>
                        <p className="mt-1 text-xs font-black tracking-tight text-zinc-950 dark:text-white">
                            {totalGuests} guest{totalGuests > 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Rooms</p>
                        <p className="mt-1 text-xs font-black tracking-tight text-zinc-950 dark:text-white">
                            {rooms} room{rooms > 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                        <PopoverTrigger asChild>
                            <button className="w-full rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-blue-500/30 hover:shadow-md focus:outline-none dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                                            <CalendarIcon className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-black tracking-tight text-zinc-950 dark:text-white">
                                                {date?.from && date?.to
                                                    ? `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd")}`
                                                    : "Choose dates"}
                                            </span>
                                            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                                                {nights > 0 ? `${nights} night stay` : "Check-in and check-out"}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] max-w-[42rem] overflow-hidden rounded-3xl border-none p-0 shadow-[0_30px_70px_rgba(0,0,0,0.2)]" align="start" sideOffset={8}>
                            <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Stay Selection</span>
                                    <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                                        Pick the exact dates you want to carry throughout the booking flow
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateParams({ from: undefined, to: undefined })}
                                    className="h-8 rounded-lg text-[9px] font-black uppercase text-zinc-400 hover:text-red-500"
                                >
                                    Reset
                                </Button>
                            </div>
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleDateSelect}
                                numberOfMonths={isMobileViewport ? 1 : 2}
                                disabled={(disabledDate) => disabledDate < new Date(new Date().setHours(0, 0, 0, 0))}
                                className="p-4"
                            />
                            <div className="border-t border-zinc-100 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
                                <Button
                                    className="h-12 w-full rounded-2xl bg-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl dark:bg-white dark:text-zinc-950"
                                    onClick={() => setIsDatePopoverOpen(false)}
                                >
                                    Keep These Dates
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover open={isGuestsPopoverOpen} onOpenChange={setIsGuestsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <button className="w-full rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-blue-500/30 hover:shadow-md focus:outline-none dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                                            <Users className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-black tracking-tight text-zinc-950 dark:text-white">
                                                {totalGuests} traveler{totalGuests > 1 ? "s" : ""}
                                            </span>
                                            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                                                {adults} adults, {children} children, {rooms} room{rooms > 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 rounded-3xl border-zinc-200 bg-white p-6 shadow-[0_30px_70px_rgba(0,0,0,0.2)] dark:border-zinc-800 dark:bg-zinc-900" align="start" sideOffset={8}>
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                                        Synced Request
                                    </p>
                                    <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                                        {rooms} room{rooms > 1 ? "s" : ""} requested for {totalGuests} guest{totalGuests > 1 ? "s" : ""}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-white">Adults</span>
                                        <p className="text-[10px] font-bold uppercase text-zinc-500">Ages 13+</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800" onClick={() => updateParams({ adults: Math.max(1, adults - 1) })} disabled={adults <= 1}>
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="w-4 text-center text-xs font-black">{adults}</span>
                                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800" onClick={() => updateParams({ adults: Math.min(10, adults + 1) })}>
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-white">Children</span>
                                        <p className="text-[10px] font-bold uppercase text-zinc-500">Ages 0-12</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800" onClick={() => updateParams({ children: Math.max(0, children - 1) })} disabled={children <= 0}>
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="w-4 text-center text-xs font-black">{children}</span>
                                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800" onClick={() => updateParams({ children: Math.min(10, children + 1) })}>
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    className="h-12 w-full rounded-2xl bg-blue-600 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-xl hover:bg-blue-700"
                                    onClick={() => setIsGuestsPopoverOpen(false)}
                                >
                                    Save Guest Setup
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-5", className)}>
            <div className={cn(
                "overflow-hidden border border-blue-100/80 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_42%),linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(248,250,252,0.96)_100%)] shadow-[0_20px_50px_rgba(37,99,235,0.08)] dark:border-blue-900/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_38%),linear-gradient(180deg,_rgba(24,24,27,0.98)_0%,_rgba(9,9,11,0.96)_100%)]",
                compact ? "rounded-[1.6rem] p-4" : "rounded-[2rem] p-5"
            )}>
                <div className="flex items-start justify-between gap-4">
                    <div className="max-w-xs">
                        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">
                            <Sparkles className="h-3 w-3" />
                            Reservation Assistant
                        </p>
                        <h3 className={cn("font-black tracking-tight text-zinc-950 dark:text-white", compact ? "mt-2 text-lg" : "mt-3 text-xl")}>
                            Your stay details stay locked as you browse
                        </h3>
                        <p className={cn("font-medium leading-relaxed text-zinc-500 dark:text-zinc-400", compact ? "mt-1 text-xs" : "mt-2 text-sm")}>
                            Dates and guest setup now follow you between the homepage, hotel detail, and checkout.
                        </p>
                    </div>

                    <div className={cn(
                        "border border-white/60 bg-white/80 text-right shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5",
                        compact ? "rounded-xl px-3 py-2" : "rounded-2xl px-4 py-3"
                    )}>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Stay Mode</p>
                        <p className={cn("mt-1 font-black text-zinc-950 dark:text-white", compact ? "text-xs" : "text-sm")}>
                            {nights > 0 ? `${nights} night${nights > 1 ? "s" : ""}` : "Flexible"}
                        </p>
                    </div>
                </div>

                <div className={cn("grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3", compact ? "mt-4" : "mt-5")}>
                    <div className={cn("border border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-white/5", compact ? "rounded-xl px-3 py-2.5" : "rounded-2xl px-4 py-3")}>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Dates</p>
                        <p className={cn("mt-1 font-black tracking-tight text-zinc-950 dark:text-white", compact ? "text-xs" : "text-sm")}>
                            {date?.from && date?.to
                                ? `${format(date.from, "MMM d")} - ${format(date.to, "MMM d")}`
                                : date?.from
                                    ? `${format(date.from, "MMM d")} onward`
                                    : "Not selected"}
                        </p>
                    </div>

                    <div className={cn("border border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-white/5", compact ? "rounded-xl px-3 py-2.5" : "rounded-2xl px-4 py-3")}>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Travelers</p>
                        <p className={cn("mt-1 font-black tracking-tight text-zinc-950 dark:text-white", compact ? "text-xs" : "text-sm")}>
                            {totalGuests} guest{totalGuests > 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className={cn("border border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-white/5", compact ? "rounded-xl px-3 py-2.5" : "rounded-2xl px-4 py-3")}>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Room Request</p>
                        <p className={cn("mt-1 font-black tracking-tight text-zinc-950 dark:text-white", compact ? "text-xs" : "text-sm")}>
                            {rooms} room{rooms > 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                        Stay Period
                    </label>
                    <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                        <PopoverTrigger asChild>
                            <button className={cn("w-full border border-zinc-200 bg-white text-left shadow-sm transition-all hover:border-blue-500/30 hover:shadow-md focus:outline-none dark:border-white/10 dark:bg-white/5", compact ? "rounded-[1.35rem] px-4 py-3" : "rounded-[1.75rem] px-5 py-4")}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("flex shrink-0 items-center justify-center bg-blue-500/10", compact ? "h-10 w-10 rounded-xl" : "h-12 w-12 rounded-2xl")}>
                                            <CalendarIcon className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <span className={cn("block font-black tracking-tight text-zinc-950 dark:text-white", compact ? "text-xs" : "text-sm")}>
                                                {date?.from && date?.to
                                                    ? `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd")}`
                                                    : "Choose check-in and check-out"}
                                            </span>
                                            <span className={cn("mt-1 block font-bold uppercase tracking-[0.18em] text-zinc-400", compact ? "text-[9px]" : "text-[10px]")}>
                                                {nights > 0 ? `${nights} night stay` : "Keep this synced across the site"}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-blue-500" />
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] max-w-[42rem] overflow-hidden rounded-3xl border-none p-0 shadow-[0_30px_70px_rgba(0,0,0,0.2)]" align="start" sideOffset={8}>
                            <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Stay Selection</span>
                                    <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                                        Pick the exact dates you want to carry throughout the booking flow
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateParams({ from: undefined, to: undefined })}
                                    className="h-8 rounded-lg text-[9px] font-black uppercase text-zinc-400 hover:text-red-500"
                                >
                                    Reset
                                </Button>
                            </div>
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleDateSelect}
                                numberOfMonths={isMobileViewport ? 1 : 2}
                                disabled={(disabledDate) => disabledDate < new Date(new Date().setHours(0, 0, 0, 0))}
                                className="p-4"
                            />
                            <div className="border-t border-zinc-100 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
                                <Button
                                    className="h-12 w-full rounded-2xl bg-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl dark:bg-white dark:text-zinc-950"
                                    onClick={() => setIsDatePopoverOpen(false)}
                                >
                                    Keep These Dates
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                        Guest Setup
                    </label>
                    <Popover open={isGuestsPopoverOpen} onOpenChange={setIsGuestsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <button className={cn("w-full border border-zinc-200 bg-white text-left shadow-sm transition-all hover:border-blue-500/30 hover:shadow-md focus:outline-none dark:border-white/10 dark:bg-white/5", compact ? "rounded-[1.35rem] px-4 py-3" : "rounded-[1.75rem] px-5 py-4")}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-blue-500/10", compact ? "h-10 w-10 rounded-xl" : "h-12 w-12 rounded-2xl")}>
                                            <Users className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <span className={cn("block font-black tracking-tight text-zinc-950 dark:text-white", compact ? "text-xs" : "text-sm")}>
                                                {totalGuests} traveler{totalGuests > 1 ? "s" : ""}
                                            </span>
                                            <span className={cn("mt-1 block font-bold uppercase tracking-[0.18em] text-zinc-400", compact ? "text-[9px]" : "text-[10px]")}>
                                                {adults} adults, {children} children, {rooms} room{rooms > 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-blue-500" />
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 rounded-3xl border-zinc-200 bg-white p-6 shadow-[0_30px_70px_rgba(0,0,0,0.2)] dark:border-zinc-800 dark:bg-zinc-900" align="start" sideOffset={8}>
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                                        Synced Request
                                    </p>
                                    <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                                        {rooms} room{rooms > 1 ? "s" : ""} requested for {totalGuests} guest{totalGuests > 1 ? "s" : ""}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-white">Adults</span>
                                        <p className="text-[10px] font-bold uppercase text-zinc-500">Ages 13+</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800"
                                            onClick={() => updateParams({ adults: Math.max(1, adults - 1) })}
                                            disabled={adults <= 1}
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="w-4 text-center text-xs font-black">{adults}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800"
                                            onClick={() => updateParams({ adults: Math.min(10, adults + 1) })}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-white">Children</span>
                                        <p className="text-[10px] font-bold uppercase text-zinc-500">Ages 0-12</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800"
                                            onClick={() => updateParams({ children: Math.max(0, children - 1) })}
                                            disabled={children <= 0}
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="w-4 text-center text-xs font-black">{children}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800"
                                            onClick={() => updateParams({ children: Math.min(10, children + 1) })}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
                                            <BedDouble className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                Rooms Requested
                                            </p>
                                            <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                                                {rooms} room{rooms > 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                                        From homepage
                                    </span>
                                </div>

                                <Button
                                    className="h-12 w-full rounded-2xl bg-blue-600 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-xl hover:bg-blue-700"
                                    onClick={() => setIsGuestsPopoverOpen(false)}
                                >
                                    Save Guest Setup
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className={cn(
                "border border-zinc-200/80 bg-white/80 font-bold uppercase tracking-[0.16em] text-zinc-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-400",
                compact ? "rounded-xl px-3 py-2 text-[10px]" : "rounded-2xl px-4 py-3 text-[11px]"
            )}>
                Your active booking dates follow you back to the homepage and forward into checkout.
            </div>
        </div>
    );
}
