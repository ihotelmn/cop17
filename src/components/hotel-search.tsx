"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Calendar as CalendarIcon, Users, Minus, Plus, MapPin } from "lucide-react";
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
    const [isDesktopDateOpen, setIsDesktopDateOpen] = useState(false);
    const [isMobileDateOpen, setIsMobileDateOpen] = useState(false);

    // Guests Popovers
    const [isDesktopGuestsOpen, setIsDesktopGuestsOpen] = useState(false);
    const [isMobileGuestsOpen, setIsMobileGuestsOpen] = useState(false);

    // -- State --
    const [query, setQuery] = useState(searchParams.get("query")?.toString() || "");

    // Dates
    const [date, setDate] = useState<DateRange | undefined>({
        from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
        to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
    });

    // Guests
    const [adults, setAdults] = useState(parseInt(searchParams.get("adults") || "2"));
    const [children, setChildren] = useState(parseInt(searchParams.get("children") || "0"));
    const [rooms, setRooms] = useState(parseInt(searchParams.get("rooms") || "1"));

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams);

        if (query) params.set("query", query); else params.delete("query");

        if (date?.from) params.set("from", format(date.from, "yyyy-MM-dd"));
        else params.delete("from");

        if (date?.to) params.set("to", format(date.to, "yyyy-MM-dd"));
        else params.delete("to");

        params.set("adults", adults.toString());
        params.set("children", children.toString());
        params.set("rooms", rooms.toString());

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        setIsDesktopDateOpen(false);
        setIsMobileDateOpen(false);
        setIsDesktopGuestsOpen(false);
        setIsMobileGuestsOpen(false);
    };

    const handleSelect = (selectedRange: DateRange | undefined) => {
        setDate(selectedRange);
    };

    const nights = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;
    const totalGuests = adults + children;

    return (
        <div className="w-full max-w-5xl mx-auto mb-10 px-4 md:px-0">
            {/* Desktop / Tablet Bar */}
            <div className="hidden md:flex items-center bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-200 dark:border-zinc-800 p-2.5 pl-10 gap-2 relative z-40 transition-all hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)] group/bar">

                {/* Location with Autocomplete */}
                <div className="flex-[1.5] flex flex-col justify-center pr-4 border-r border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-[1.5rem] px-8 py-3 transition-all cursor-text group relative">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 mb-1 uppercase tracking-widest">Where</label>
                    <div className="relative">
                        <AutocompleteSearch
                            value={query}
                            onChange={setQuery}
                            onSearch={handleSearch}
                            placeholder="Find destinations..."
                        />
                    </div>
                </div>

                <div className="h-12 w-px bg-zinc-100 dark:bg-zinc-800 mx-1 flex-shrink-0" />

                {/* Dates Selector - Split Check-in / Check-out */}
                <Popover open={isDesktopDateOpen} onOpenChange={setIsDesktopDateOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="flex-[2] flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-[1.5rem] transition-all outline-none cursor-pointer group/dates px-2"
                        >
                            {/* Check-in */}
                            <div className="flex-1 flex flex-col justify-center px-6 py-3 border-r border-transparent text-left relative">
                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 mb-1 uppercase tracking-widest pointer-events-none">Check in</label>
                                <div className={cn("text-sm truncate pointer-events-none font-bold", date?.from ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
                                    {date?.from ? format(date.from, "MMM dd, yyyy") : "Add dates"}
                                </div>
                            </div>

                            <div className="h-10 w-px bg-zinc-100 dark:bg-zinc-800 mx-1 flex-shrink-0" />

                            {/* Check-out */}
                            <div className="flex-1 flex flex-col justify-center px-6 py-3 text-left">
                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 mb-1 uppercase tracking-widest pointer-events-none">Check out</label>
                                <div className={cn("text-sm truncate pointer-events-none font-bold", date?.to ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
                                    {date?.to ? format(date.to, "MMM dd, yyyy") : "Add dates"}
                                </div>
                            </div>
                        </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0 shadow-[0_30px_70px_rgba(0,0,0,0.2)] border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden" align="center" sideOffset={16}>
                        {/* Header */}
                        <div className="px-8 py-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                                    {!date?.from ? "Select Check-in" : !date?.to ? "Select Check-out" : `${nights} Nights`}
                                </span>
                                {date?.from && date?.to ? (
                                    <p className="text-zinc-900 dark:text-white text-lg font-black tracking-tight">
                                        {format(date.from, "MMM dd")} — {format(date.to, "MMM dd, yyyy")}
                                    </p>
                                ) : (
                                    <p className="text-zinc-400 text-sm font-medium">Select your stay period</p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDate(undefined)}
                                className="h-9 px-4 text-[10px] uppercase font-black text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                            >
                                Reset
                            </Button>
                        </div>

                        {/* Calendar */}
                        <div className="px-6 py-4 bg-white dark:bg-zinc-900">
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

                        {/* Footer */}
                        <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center gap-8">
                            <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight leading-relaxed max-w-[200px]">
                                Rates shown are exclusive to COP17 delegates.
                            </p>
                            <Button
                                className="rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-black uppercase tracking-widest text-[11px] h-14 shadow-2xl transition-all hover:scale-105 active:scale-95 px-8"
                                onClick={() => setIsDesktopDateOpen(false)}
                            >
                                Apply Period
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="h-12 w-px bg-zinc-100 dark:bg-zinc-800 mx-1 flex-shrink-0" />

                {/* Guests Selector & Search Button */}
                <div className="flex-[1.2] flex items-center justify-between relative pl-2 h-full gap-4 pr-1">
                    <Popover open={isDesktopGuestsOpen} onOpenChange={setIsDesktopGuestsOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="flex flex-col justify-center flex-1 px-6 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-[1.5rem] transition-all text-left outline-none relative h-full"
                            >
                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 mb-1 uppercase tracking-widest pointer-events-none">Who</label>
                                <div className={cn("text-sm truncate pointer-events-none font-bold", totalGuests > 0 ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
                                    {totalGuests} guest{totalGuests > 1 ? "s" : ""}, {rooms} room{rooms > 1 ? "s" : ""}
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-8 rounded-[2rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-4" align="end" sideOffset={10}>
                            <div className="space-y-8">
                                {/* Adults */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-base font-black text-zinc-900 dark:text-white tracking-tight">Adults</span>
                                        <p className="text-xs text-zinc-500 font-medium">Ages 13 or above</p>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 rounded-full border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all active:scale-90"
                                            onClick={() => setAdults(Math.max(1, adults - 1))}
                                            disabled={adults <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-4 text-center text-sm font-black">{adults}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 rounded-full border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all active:scale-90"
                                            onClick={() => setAdults(Math.min(10, adults + 1))}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-base font-black text-zinc-900 dark:text-white tracking-tight">Children</span>
                                        <p className="text-xs text-zinc-500 font-medium">Ages 0 - 12</p>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 rounded-full border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all active:scale-90"
                                            onClick={() => setChildren(Math.max(0, children - 1))}
                                            disabled={children <= 0}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-4 text-center text-sm font-black">{children}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 rounded-full border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all active:scale-90"
                                            onClick={() => setChildren(Math.min(10, children + 1))}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Rooms */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-base font-black text-zinc-900 dark:text-white tracking-tight">Rooms</span>
                                        <p className="text-xs text-zinc-500 font-medium">Accommodation units</p>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 rounded-full border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all active:scale-90"
                                            onClick={() => setRooms(Math.max(1, rooms - 1))}
                                            disabled={rooms <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-4 text-center text-sm font-black">{rooms}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 rounded-full border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all active:scale-90"
                                            onClick={() => setRooms(Math.min(10, rooms + 1))}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-4 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-black uppercase tracking-widest text-[11px] shadow-2xl"
                                    onClick={() => setIsDesktopGuestsOpen(false)}
                                >
                                    Done
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Search Button */}
                    <Button
                        onClick={handleSearch}
                        className="rounded-full h-16 w-16 md:h-16 md:w-auto md:px-10 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                        <Search className="h-5 w-5 md:mr-3" />
                        <span className="hidden md:inline">Search</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Bar - Redesigned Modal Trigger Style */}
            <div className="md:hidden pt-4 pb-4">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] p-6 border border-zinc-100 dark:border-zinc-800 space-y-6 relative z-50">

                    {/* Destination Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-blue-500" /> Destination
                        </label>
                        <div className="relative bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all border border-zinc-100/50 dark:border-zinc-700/30">
                            <AutocompleteSearch
                                value={query}
                                onChange={setQuery}
                                onSearch={handleSearch}
                                placeholder="Find your stay..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Dates Button */}
                        <Popover open={isMobileDateOpen} onOpenChange={setIsMobileDateOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex flex-col items-start justify-center h-24 rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 shadow-none px-6 group active:scale-95 transition-all text-left gap-1.5"
                                >
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                        <CalendarIcon className="h-2.5 w-2.5 text-blue-500" /> Period
                                    </span>
                                    <span className={cn("text-xs font-black truncate w-full tracking-tight", date?.from ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
                                        {date?.from ? (
                                            date.to ? `${format(date.from, "MMM d")} - ${format(date.to, "MMM d")}` : `${format(date.from, "MMM d")}...`
                                        ) : "Set dates"}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[calc(100vw-32px)] p-0 shadow-[0_30px_70px_rgba(0,0,0,0.2)] border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden mt-2" align="center" sideOffset={10}>
                                <div className="px-6 py-5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                    <span className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Stay Dates</span>
                                </div>
                                <div className="p-3 bg-white dark:bg-zinc-900 flex justify-center">
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
                                <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                                    <Button className="w-full rounded-2xl h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl" onClick={() => setIsMobileDateOpen(false)}>
                                        Apply Dates
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Guests Button */}
                        <Popover open={isMobileGuestsOpen} onOpenChange={setIsMobileGuestsOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex flex-col items-start justify-center h-24 rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 shadow-none px-6 active:scale-95 transition-all text-left gap-1.5"
                                >
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                        <Users className="h-2.5 w-2.5 text-blue-500" /> Guests
                                    </span>
                                    <span className={cn("text-xs font-black truncate w-full tracking-tight", totalGuests > 0 ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
                                        {totalGuests} {totalGuests > 1 ? "Travelers" : "Traveler"}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[calc(100vw-32px)] p-8 rounded-[2rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-2" align="end" sideOffset={10}>
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <span className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Adults</span>
                                            <p className="text-xs text-zinc-500 font-medium">Ages 13+</p>
                                        </div>
                                        <div className="flex items-center gap-5">
                                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full border-zinc-200 dark:border-zinc-800 active:scale-90" onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-4 text-center text-sm font-black">{adults}</span>
                                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full border-zinc-200 dark:border-zinc-800 active:scale-90" onClick={() => setAdults(Math.min(10, adults + 1))}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <span className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Children</span>
                                            <p className="text-xs text-zinc-500 font-medium">Ages 0-12</p>
                                        </div>
                                        <div className="flex items-center gap-5">
                                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full border-zinc-200 dark:border-zinc-800 active:scale-90" onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-4 text-center text-sm font-black">{children}</span>
                                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full border-zinc-200 dark:border-zinc-800 active:scale-90" onClick={() => setChildren(Math.min(10, children + 1))}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Button className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl" onClick={() => setIsMobileGuestsOpen(false)}>
                                        Complete Selection
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button
                        onClick={handleSearch}
                        className="w-full rounded-2xl h-18 py-5 bg-zinc-900 dark:bg-white dark:text-zinc-950 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Search className="h-5 w-5" /> Search Availability
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
            <SelectTrigger aria-label="Sort properties" className="w-[180px] h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
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
