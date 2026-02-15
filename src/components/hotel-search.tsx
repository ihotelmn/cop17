"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Calendar as CalendarIcon, Users, Minus, Plus } from "lucide-react";
import { MobileFilter } from "./hotels/mobile-filter";
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
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { AutocompleteSearch } from "./autocomplete-search";
import { differenceInDays } from "date-fns";

export function HotelSearch() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    // State for Popovers
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [isGuestsPopoverOpen, setIsGuestsPopoverOpen] = useState(false);

    // -- State --
    const [query, setQuery] = useState(searchParams.get("query")?.toString() || "");

    // Dates
    const [date, setDate] = useState<DateRange | undefined>({
        from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
        to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
    });

    // Guests
    const [guests, setGuests] = useState(parseInt(searchParams.get("guests") || "2"));

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams);

        if (query) params.set("query", query); else params.delete("query");

        if (date?.from) params.set("from", format(date.from, "yyyy-MM-dd"));
        else params.delete("from");

        if (date?.to) params.set("to", format(date.to, "yyyy-MM-dd"));
        else params.delete("to");

        if (guests > 1) params.set("guests", guests.toString());
        else params.delete("guests");

        router.replace(`${pathname}?${params.toString()}`);
        setIsDatePopoverOpen(false);
        setIsGuestsPopoverOpen(false);
    };

    const updateGuests = (delta: number) => {
        setGuests((prev: number) => Math.max(1, Math.min(10, prev + delta)));
    }

    const handleSelect = (selectedRange: DateRange | undefined, selectedDay: Date) => {
        // Log to debug if needed, but logic is:
        // 1. If we have a full range (from & to), resets to just the new day (Start)
        // 2. If we have no start, sets the new day (Start)
        // 3. If new day is before start, resets to new day (Start)
        // 4. Otherwise, completes the range (Start -> New Day)

        if (date?.from && date?.to) {
            setDate({ from: selectedDay, to: undefined });
            return;
        }

        if (!date?.from) {
            setDate({ from: selectedDay, to: undefined });
            return;
        }

        if (selectedDay < date.from) {
            setDate({ from: selectedDay, to: undefined });
        } else {
            setDate({ from: date.from, to: selectedDay });
        }
    };

    const nights = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;

    return (
        <div className="w-full max-w-5xl mx-auto mb-10 px-4 md:px-0">
            {/* Desktop / Tablet Bar */}
            <div className="hidden md:flex items-center bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 dark:border-zinc-800 p-2 pl-6 gap-2">

                {/* Location with Autocomplete */}
                <div className="flex-[1.5] flex flex-col justify-center pr-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 ml-1">Destination or Hotel</label>
                    <AutocompleteSearch
                        value={query}
                        onChange={setQuery}
                        onSearch={handleSearch}
                        placeholder="Where are you going?"
                    />
                </div>

                <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

                {/* Dates Selector */}
                {/* Dates Selector - Single Unified Trigger */}
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="flex-[1.5] group flex flex-col justify-center px-6 cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded-2xl transition-all h-full outline-none text-left"
                            onClick={() => setIsDatePopoverOpen(true)}
                        >
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 pointer-events-none group-hover:text-blue-500 transition-colors">Select Dates</label>
                            <div className={cn("text-sm font-bold truncate pointer-events-none", date?.from ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
                                {date?.from ? (
                                    date.to ? (
                                        <div className="flex items-center gap-2">
                                            <span>{format(date.from, "MMM dd")} - {format(date.to, "MMM dd")}</span>
                                            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-black ml-1">{nights}N</span>
                                        </div>
                                    ) : (
                                        `${format(date.from, "MMM dd")} - Check-out`
                                    )
                                ) : (
                                    "Check-in - Check-out"
                                )}
                            </div>
                        </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden" align="center" sideOffset={16}>
                        {/* Header */}
                        <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                                    {!date?.from ? "Select Check-in" : !date?.to ? "Select Check-out" : `${nights} Nights`}
                                </span>
                                {date?.from && date?.to && (
                                    <p className="text-zinc-900 dark:text-white text-sm font-bold">
                                        {format(date.from, "MMM dd")} - {format(date.to, "MMM dd, yyyy")}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDate(undefined)}
                                    className="h-8 px-3 text-[10px] uppercase font-black text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="p-4 bg-white dark:bg-zinc-900">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from || new Date()}
                                selected={date}
                                onSelect={handleSelect}
                                numberOfMonths={2}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3"
                            />
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <div className="text-xs text-zinc-400 font-medium px-2">
                                * Prices may vary by dates
                            </div>
                            <Button
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-500/20"
                                onClick={() => setIsDatePopoverOpen(false)}
                            >
                                Apply Dates
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

                {/* Guests Selector */}
                <Popover open={isGuestsPopoverOpen} onOpenChange={setIsGuestsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="flex-shrink-0 w-32 flex flex-col justify-center px-4 cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded-2xl transition-all py-1.5 group text-left outline-none"
                        >
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 group-hover:text-blue-500 transition-colors pointer-events-none">Guests</label>
                            <div className="text-sm font-bold text-zinc-900 dark:text-white truncate pointer-events-none">
                                {guests} guest{guests > 1 ? "s" : ""}
                            </div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-6 rounded-3xl shadow-2xl border-zinc-200 dark:border-zinc-800" align="end" sideOffset={12}>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <span className="text-sm font-black text-zinc-900 dark:text-white">Adults</span>
                                <p className="text-[10px] text-zinc-500 font-medium">Ages 13 or above</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    onClick={() => updateGuests(-1)}
                                    disabled={guests <= 1}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-4 text-center text-sm font-black">{guests}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    onClick={() => updateGuests(1)}
                                    disabled={guests >= 10}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <Button
                            className="w-full mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-10"
                            onClick={() => setIsGuestsPopoverOpen(false)}
                        >
                            Apply
                        </Button>
                    </PopoverContent>
                </Popover>

                {/* Search Button */}
                <Button
                    onClick={handleSearch}
                    className="rounded-full h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95 shrink-0 ml-2"
                >
                    <Search className="h-5 w-5 mr-3" />
                    Search
                </Button>
            </div>

            {/* Mobile Bar */}
            <div className="md:hidden space-y-4">
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-zinc-800 p-4 space-y-4">
                    {/* Keyword Input with Autocomplete */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Destination</label>
                        <AutocompleteSearch
                            value={query}
                            onChange={setQuery}
                            onSearch={handleSearch}
                            placeholder="Where to?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Dates</label>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold"
                                onClick={() => setIsDatePopoverOpen(true)}
                            >
                                <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                                {date?.from ? (
                                    date.to ? `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd")}` : `${format(date.from, "MMM dd")} - Check-out`
                                ) : "Add dates"}
                            </Button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Guests</label>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold"
                                onClick={() => setIsGuestsPopoverOpen(true)}
                            >
                                <Users className="h-4 w-4 mr-2 text-blue-500" />
                                {guests} guest{guests > 1 ? "s" : ""}
                            </Button>
                        </div>
                    </div>

                    <Button
                        onClick={handleSearch}
                        className="w-full rounded-xl h-14 bg-blue-600 text-white font-black text-lg shadow-lg active:scale-95 transition-all"
                    >
                        Search Hotels
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function SortDropdown() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const currentSort = searchParams.get("sortBy") || "newest";

    const handleSort = (val: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("sortBy", val);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <Select value={currentSort} onValueChange={handleSort}>
            <SelectTrigger className="w-[180px] h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">Recommended</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="stars-desc">Top Rated</SelectItem>
            </SelectContent>
        </Select>
    )
}
