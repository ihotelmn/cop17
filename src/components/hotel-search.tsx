"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, X, Calendar as CalendarIcon, Users, Minus, Plus } from "lucide-react";
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
        else params.delete("guests"); // Default implies 1 or 2, maybe keep clean or explicit? 

        router.replace(`${pathname}?${params.toString()}`);
        setIsDatePopoverOpen(false);
        setIsGuestsPopoverOpen(false);
    };

    const handleClear = () => {
        setQuery("");
        setDate(undefined);
        setGuests(2);
        router.replace(pathname);
    };

    const updateGuests = (delta: number) => {
        setGuests(prev => Math.max(1, Math.min(10, prev + delta)));
    }

    // Smart Date Selection: Close popover when range is complete
    const handleDateSelect = (selectedRange: DateRange | undefined) => {
        setDate(selectedRange);
        if (selectedRange?.from && selectedRange?.to) {
            // Give a tiny delay for visual confirmation before closing
            setTimeout(() => setIsDatePopoverOpen(false), 300);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto mb-10">
            {/* Desktop / Tablet Bar */}
            <div className="hidden md:flex items-center bg-white dark:bg-zinc-900 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-800 p-2 pl-6 gap-4">

                {/* Location */}
                <div className="flex-1 flex flex-col justify-center border-r border-zinc-100 dark:border-zinc-800 pr-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Where</label>
                    <input
                        type="text"
                        placeholder="Search destinations"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="bg-transparent border-none text-sm font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none w-full truncate"
                    />
                </div>

                {/* Dates (Functional) */}
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                    <PopoverTrigger asChild>
                        <div className="flex-1 flex flex-col justify-center border-r border-zinc-100 dark:border-zinc-800 px-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors py-1 group">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">Check in - Check out</label>
                            <div className={cn("text-sm font-semibold truncate", !date?.from ? "text-zinc-400 font-normal" : "text-zinc-950 dark:text-blue-400 font-bold")}>
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "MMM dd")} - {format(date.to, "MMM dd")}
                                        </>
                                    ) : (
                                        `${format(date.from, "MMM dd")} - Add date`
                                    )
                                ) : (
                                    "Add dates"
                                )}
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 shadow-2xl border-zinc-200 dark:border-zinc-800" align="start">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Select Date Range</span>
                            <Button variant="ghost" size="sm" onClick={() => setDate(undefined)} className="h-7 text-[10px] uppercase font-bold text-red-500 hover:text-red-600 hover:bg-red-50">Clear</Button>
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from || new Date()}
                            selected={date}
                            onSelect={handleDateSelect}
                            numberOfMonths={2}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                    </PopoverContent>
                </Popover>

                {/* Guests (Functional) */}
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex-shrink-0 w-32 flex flex-col justify-center px-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors py-1 group">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">Guests</label>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                {guests} guest{guests > 1 ? "s" : ""}
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-4" align="center">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Guests</span>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => updateGuests(-1)}
                                    disabled={guests <= 1}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-4 text-center text-sm font-bold">{guests}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => updateGuests(1)}
                                    disabled={guests >= 10}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Search Button */}
                <Button
                    onClick={handleSearch}
                    size="lg"
                    className="rounded-full h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shrink-0"
                >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                </Button>
            </div>

            {/* Mobile Bar */}
            <div className="md:hidden space-y-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                    {/* Keyword Input */}
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3">
                        <Search className="h-5 w-5 text-zinc-400 mr-3" />
                        <input
                            type="text"
                            placeholder="Where to?"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="bg-transparent border-none text-base font-medium text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none w-full"
                        />
                        {query && (
                            <X className="h-5 w-5 text-zinc-400 cursor-pointer" onClick={handleClear} />
                        )}
                    </div>
                </div>

                {/* Mobile Filter Button Row */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <MobileFilter />
                    {/* Could add quick date filter here too if needed on mobile, but Sidebar has it? No sidebar doesn't have date.
                        Ideally Mobile should allow Date picking too. 
                        Let's keep it simple for now as requested. */}
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
