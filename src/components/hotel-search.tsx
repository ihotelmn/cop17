"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { differenceInDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
    Calendar as CalendarIcon,
    MapPin,
    Minus,
    Plus,
    Search,
    Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { AutocompleteSearch } from "./autocomplete-search";
import {
    applyBookingSearchStateToParams,
    type BookingSearchState,
    createBookingSearchState,
    getDateRangeFromBookingSearchState,
    mergeBookingSearchState,
    normalizeBookingSearchState,
    persistBookingSearchState,
    readPartialBookingSearchState,
    readStoredBookingSearchState,
} from "@/lib/booking-search";

export function HotelSearch() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const searchParamsString = searchParams.toString();
    const urlSearchState = useMemo(
        () => normalizeBookingSearchState(readPartialBookingSearchState(new URLSearchParams(searchParamsString))),
        [searchParamsString]
    );

    const [isDesktopDateOpen, setIsDesktopDateOpen] = useState(false);
    const [isMobileDateOpen, setIsMobileDateOpen] = useState(false);
    const [isDesktopGuestsOpen, setIsDesktopGuestsOpen] = useState(false);
    const [isMobileGuestsOpen, setIsMobileGuestsOpen] = useState(false);

    const [query, setQuery] = useState(urlSearchState.query);
    const [date, setDate] = useState<DateRange | undefined>(
        getDateRangeFromBookingSearchState(urlSearchState)
    );
    const [adults, setAdults] = useState(urlSearchState.adults);
    const [children, setChildren] = useState(urlSearchState.children);
    const [rooms, setRooms] = useState(urlSearchState.rooms);

    useEffect(() => {
        setQuery(urlSearchState.query);
        setDate(getDateRangeFromBookingSearchState(urlSearchState));
        setAdults(urlSearchState.adults);
        setChildren(urlSearchState.children);
        setRooms(urlSearchState.rooms);
    }, [
        urlSearchState.adults,
        urlSearchState.children,
        urlSearchState.from,
        urlSearchState.query,
        urlSearchState.rooms,
        urlSearchState.to,
    ]);

    useEffect(() => {
        const storedSearchState = readStoredBookingSearchState();
        if (!storedSearchState) {
            return;
        }

        const mergedSearchState = mergeBookingSearchState(urlSearchState, storedSearchState);
        setQuery(mergedSearchState.query);
        setDate(getDateRangeFromBookingSearchState(mergedSearchState));
        setAdults(mergedSearchState.adults);
        setChildren(mergedSearchState.children);
        setRooms(mergedSearchState.rooms);

        const params = new URLSearchParams(searchParamsString);
        applyBookingSearchStateToParams(params, mergedSearchState);

        const nextParamsString = params.toString();
        if (nextParamsString === searchParamsString) {
            return;
        }

        router.replace(`${pathname}${nextParamsString ? `?${nextParamsString}` : ""}`, {
            scroll: false,
        });
    }, [pathname, router, searchParamsString, urlSearchState]);

    const syncSearchState = (overrides?: Partial<BookingSearchState>) => {
        const nextSearchState = normalizeBookingSearchState({
            ...createBookingSearchState({
                query,
                date,
                adults,
                children,
                rooms,
            }),
            ...(overrides ?? {}),
        });

        persistBookingSearchState(nextSearchState);

        const params = new URLSearchParams(searchParamsString);
        applyBookingSearchStateToParams(params, nextSearchState);

        const nextParamsString = params.toString();
        if (nextParamsString !== searchParamsString) {
            router.replace(`${pathname}${nextParamsString ? `?${nextParamsString}` : ""}`, {
                scroll: false,
            });
        }
    };

    const handleSearch = () => {
        syncSearchState();
        setIsDesktopDateOpen(false);
        setIsMobileDateOpen(false);
        setIsDesktopGuestsOpen(false);
        setIsMobileGuestsOpen(false);
    };

    const handleSelect = (selectedRange: DateRange | undefined) => {
        if (date?.from && date?.to && selectedRange?.from) {
            const clickedDay = selectedRange.to || selectedRange.from;
            if (clickedDay.getTime() !== date.to.getTime()) {
                setDate({ from: clickedDay, to: undefined });
                return;
            }
        }

        setDate(selectedRange);
    };

    const handleDesktopDateOpenChange = (open: boolean) => {
        if (!open && isDesktopDateOpen) {
            syncSearchState();
        }

        setIsDesktopDateOpen(open);
    };

    const handleMobileDateOpenChange = (open: boolean) => {
        if (!open && isMobileDateOpen) {
            syncSearchState();
        }

        setIsMobileDateOpen(open);
    };

    const handleDesktopGuestsOpenChange = (open: boolean) => {
        if (!open && isDesktopGuestsOpen) {
            syncSearchState();
        }

        setIsDesktopGuestsOpen(open);
    };

    const handleMobileGuestsOpenChange = (open: boolean) => {
        if (!open && isMobileGuestsOpen) {
            syncSearchState();
        }

        setIsMobileGuestsOpen(open);
    };

    const nights = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;
    const totalGuests = adults + children;
    const guestSummary = `${totalGuests} guest${totalGuests > 1 ? "s" : ""}`;
    const roomSummary = `${rooms} room${rooms > 1 ? "s" : ""}`;
    const guestRoomSummary = `${guestSummary} · ${roomSummary}`;

    return (
        <div className="w-full max-w-5xl mx-auto mb-10 px-4 md:px-0">
            <div className="hidden md:block">
                <div className="rounded-[1.8rem] border border-zinc-200/80 bg-white/96 p-2 shadow-[0_16px_44px_rgba(15,23,42,0.09)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
                    <div className="overflow-hidden rounded-[1.45rem] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.05fr)_minmax(0,0.9fr)_auto] items-stretch">
                            <div className="px-5 py-4">
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    Destination
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <AutocompleteSearch
                                            value={query}
                                            onChange={setQuery}
                                            onSearch={handleSearch}
                                            placeholder="Hotel name or area"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Popover open={isDesktopDateOpen} onOpenChange={handleDesktopDateOpenChange}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="border-l border-zinc-200 px-5 py-4 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/70"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                                                <CalendarIcon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                    Stay dates
                                                </label>
                                                <div>
                                                    <div className={cn("truncate text-sm font-semibold", date?.from ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
                                                        {date?.from
                                                            ? date?.to
                                                                ? `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd")}`
                                                                : `From ${format(date.from, "MMM dd")}`
                                                            : "Add dates"}
                                                    </div>
                                                    <p className="mt-1 text-[11px] font-medium text-zinc-400">
                                                        {nights > 0 ? `${nights} night${nights > 1 ? "s" : ""}` : "Check-in and check-out"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </PopoverTrigger>

                                <PopoverContent className="w-auto overflow-hidden rounded-[1.6rem] border-zinc-200 p-0 shadow-[0_22px_60px_rgba(15,23,42,0.16)] dark:border-zinc-800" align="center" sideOffset={12}>
                                    <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                {!date?.from ? "Select Check-in" : !date?.to ? "Select Check-out" : `${nights} Nights`}
                                            </span>
                                            {date?.from && date?.to ? (
                                                <p className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                                                    {format(date.from, "MMM dd")} — {format(date.to, "MMM dd, yyyy")}
                                                </p>
                                            ) : (
                                                <p className="text-sm font-medium text-zinc-500">Select your stay period</p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDate(undefined)}
                                            className="h-8 rounded-lg px-3 text-[10px] font-black uppercase text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                                        >
                                            Reset
                                        </Button>
                                    </div>

                                    <div className="bg-white px-4 py-3 dark:bg-zinc-900">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from || new Date()}
                                            selected={date}
                                            onSelect={handleSelect}
                                            numberOfMonths={2}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            className="rounded-xl"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between gap-6 border-t border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                                        <p className="max-w-[220px] text-[11px] font-medium leading-relaxed text-zinc-500">
                                            Selected dates follow you into hotel detail and checkout.
                                        </p>
                                        <Button
                                            className="h-11 rounded-xl bg-zinc-950 px-5 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-none transition-colors hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                                            onClick={handleSearch}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <div className="border-l border-zinc-200 dark:border-zinc-800">
                                <Popover open={isDesktopGuestsOpen} onOpenChange={handleDesktopGuestsOpenChange}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex h-full w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/70"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                    Guests
                                                </label>
                                                <div className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                                                    {guestRoomSummary}
                                                </div>
                                                <p className="mt-1 text-[11px] font-medium text-zinc-400">
                                                    Adults, children, rooms
                                                </p>
                                            </div>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="mt-3 w-80 rounded-[1.6rem] border-zinc-200 bg-white p-5 shadow-[0_22px_60px_rgba(15,23,42,0.16)] dark:border-zinc-800 dark:bg-zinc-900" align="end" sideOffset={10}>
                                        <div className="space-y-3">
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                    Current setup
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                                                    {guestRoomSummary}
                                                </p>
                                            </div>

                                            <CounterField
                                                label="Adults"
                                                description="Ages 13+"
                                                value={adults}
                                                onDecrement={() => setAdults(Math.max(1, adults - 1))}
                                                onIncrement={() => setAdults(Math.min(10, adults + 1))}
                                                decrementDisabled={adults <= 1}
                                            />

                                            <CounterField
                                                label="Children"
                                                description="Ages 0-12"
                                                value={children}
                                                onDecrement={() => setChildren(Math.max(0, children - 1))}
                                                onIncrement={() => setChildren(Math.min(10, children + 1))}
                                                decrementDisabled={children <= 0}
                                            />

                                            <CounterField
                                                label="Rooms"
                                                description="Accommodation units"
                                                value={rooms}
                                                onDecrement={() => setRooms(Math.max(1, rooms - 1))}
                                                onIncrement={() => setRooms(Math.min(10, rooms + 1))}
                                                decrementDisabled={rooms <= 1}
                                            />

                                            <Button
                                                className="mt-2 h-11 w-full rounded-xl bg-zinc-950 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-none transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                                                onClick={handleSearch}
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <Button
                                onClick={handleSearch}
                                className="h-full min-w-[10rem] rounded-none bg-blue-600 px-7 text-white shadow-none transition-colors hover:bg-blue-700 active:scale-[0.98] dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500"
                            >
                                <div className="flex items-center gap-3">
                                    <Search className="h-4 w-4" />
                                    <span className="text-sm font-black tracking-tight">Search</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:hidden pt-3 pb-3">
                <div className="rounded-[1.8rem] border border-zinc-200/80 bg-white/96 p-4 shadow-[0_16px_44px_rgba(15,23,42,0.09)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <label className="ml-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                <MapPin className="h-3 w-3 text-zinc-500" /> Destination
                            </label>
                            <div className="relative rounded-[1.45rem] border border-zinc-200 bg-zinc-50 p-4 transition-colors focus-within:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/70">
                                <AutocompleteSearch
                                    value={query}
                                    onChange={setQuery}
                                    onSearch={handleSearch}
                                    placeholder="Hotel name or area"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Popover open={isMobileDateOpen} onOpenChange={handleMobileDateOpenChange}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col items-start justify-center gap-1 rounded-[1.45rem] border-zinc-200 bg-zinc-50 px-4 text-left shadow-none active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/70"
                                    >
                                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                            <CalendarIcon className="h-2.5 w-2.5 text-zinc-500" /> Dates
                                        </span>
                                        <span className={cn("w-full truncate text-xs font-black tracking-tight", date?.from ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
                                            {date?.from
                                                ? date.to
                                                    ? `${format(date.from, "MMM d")} - ${format(date.to, "MMM d")}`
                                                    : `${format(date.from, "MMM d")}...`
                                                : "Set dates"}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="mt-2 w-[calc(100vw-32px)] overflow-hidden rounded-[1.6rem] border-zinc-200 p-0 shadow-[0_22px_60px_rgba(15,23,42,0.16)] dark:border-zinc-800" align="center" sideOffset={10}>
                                    <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                                        <span className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                                            Stay Dates
                                        </span>
                                    </div>
                                    <div className="flex justify-center bg-white p-3 dark:bg-zinc-900">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from || new Date()}
                                            selected={date}
                                            onSelect={handleSelect}
                                            numberOfMonths={1}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            className="rounded-xl p-0"
                                        />
                                    </div>
                                    <div className="border-t border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                                        <Button
                                            className="h-11 w-full rounded-xl bg-zinc-950 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-none hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                                            onClick={handleSearch}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Popover open={isMobileGuestsOpen} onOpenChange={handleMobileGuestsOpenChange}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col items-start justify-center gap-1 rounded-[1.45rem] border-zinc-200 bg-zinc-50 px-4 text-left shadow-none active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/70"
                                    >
                                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                            <Users className="h-2.5 w-2.5 text-zinc-500" /> Guests
                                        </span>
                                        <span className={cn("w-full truncate text-xs font-black tracking-tight", totalGuests > 0 ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
                                            {guestSummary}
                                        </span>
                                        <span className="text-[10px] font-medium text-zinc-400">
                                            {roomSummary}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="mt-2 w-[calc(100vw-32px)] rounded-[1.6rem] border-zinc-200 bg-white p-5 shadow-[0_22px_60px_rgba(15,23,42,0.16)] dark:border-zinc-800 dark:bg-zinc-900" align="end" sideOffset={10}>
                                    <div className="space-y-3">
                                        <CounterField
                                            label="Adults"
                                            description="Ages 13+"
                                            value={adults}
                                            onDecrement={() => setAdults(Math.max(1, adults - 1))}
                                            onIncrement={() => setAdults(Math.min(10, adults + 1))}
                                            decrementDisabled={adults <= 1}
                                        />

                                        <CounterField
                                            label="Children"
                                            description="Ages 0-12"
                                            value={children}
                                            onDecrement={() => setChildren(Math.max(0, children - 1))}
                                            onIncrement={() => setChildren(Math.min(10, children + 1))}
                                            decrementDisabled={children <= 0}
                                        />

                                        <CounterField
                                            label="Rooms"
                                            description="Accommodation units"
                                            value={rooms}
                                            onDecrement={() => setRooms(Math.max(1, rooms - 1))}
                                            onIncrement={() => setRooms(Math.min(10, rooms + 1))}
                                            decrementDisabled={rooms <= 1}
                                        />

                                        <Button
                                            className="h-11 w-full rounded-xl bg-zinc-950 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-none hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                                            onClick={handleSearch}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button
                            onClick={handleSearch}
                            className="h-14 w-full rounded-[1.45rem] bg-zinc-950 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-none transition-all active:scale-95 dark:bg-white dark:text-zinc-950"
                        >
                            <Search className="mr-3 h-4 w-4" />
                            Search Stays
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CounterField({
    label,
    description,
    value,
    onDecrement,
    onIncrement,
    decrementDisabled,
}: {
    label: string;
    description: string;
    value: number;
    onDecrement: () => void;
    onIncrement: () => void;
    decrementDisabled: boolean;
}) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="space-y-0.5">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{label}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full border-zinc-200 bg-white shadow-none transition-all active:scale-90 dark:border-zinc-800 dark:bg-zinc-900"
                    onClick={onDecrement}
                    disabled={decrementDisabled}
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-6 text-center text-sm font-black text-zinc-900 dark:text-white">{value}</span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full border-zinc-200 bg-white shadow-none transition-all active:scale-90 dark:border-zinc-800 dark:bg-zinc-900"
                    onClick={onIncrement}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export function SortDropdown({ compact = false }: { compact?: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const currentSort = searchParams.get("sortBy") || "newest";
    const compactSortLabel = {
        newest: "Sort",
        "price-asc": "Price",
        "price-desc": "Price",
        "stars-desc": "Top Rated",
    }[currentSort] ?? "Sort";

    const handleSort = (val: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("sortBy", val);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <Select value={currentSort} onValueChange={handleSort}>
            <SelectTrigger
                aria-label="Sort properties"
                className={cn(
                    "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
                    compact
                        ? "h-10 min-w-[5.5rem] rounded-full px-4 text-xs font-black uppercase tracking-[0.16em] shadow-none"
                        : "h-12 w-full rounded-2xl sm:h-10 sm:w-[180px] sm:rounded-lg"
                )}
            >
                {compact ? (
                    <span className="truncate">{compactSortLabel}</span>
                ) : (
                    <SelectValue placeholder="Sort by" />
                )}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">Recommended</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="stars-desc">Top Rated</SelectItem>
            </SelectContent>
        </Select>
    );
}
