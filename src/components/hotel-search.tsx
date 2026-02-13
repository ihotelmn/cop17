"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, List, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function HotelSearch() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const [query, setQuery] = useState(searchParams.get("query")?.toString() || "");
    const [stars, setStars] = useState(searchParams.get("stars")?.toString() || "");
    const [minPrice, setMinPrice] = useState(searchParams.get("minPrice")?.toString() || "");
    const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice")?.toString() || "");
    const [sortBy, setSortBy] = useState(searchParams.get("sortBy")?.toString() || "newest");
    const [view, setView] = useState(searchParams.get("view")?.toString() || "list");

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams);

        if (query) params.set("query", query); else params.delete("query");
        if (stars && stars !== "all") params.set("stars", stars); else params.delete("stars");
        if (minPrice) params.set("minPrice", minPrice); else params.delete("minPrice");
        if (maxPrice) params.set("maxPrice", maxPrice); else params.delete("maxPrice");
        if (sortBy) params.set("sortBy", sortBy); else params.delete("sortBy");
        if (view) params.set("view", view); else params.delete("view");

        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleClear = () => {
        setQuery("");
        setStars("");
        setMinPrice("");
        setMaxPrice("");
        setSortBy("newest");
        router.replace(pathname);
    };

    const toggleView = (newView: string) => {
        setView(newView);
        const params = new URLSearchParams(searchParams);
        params.set("view", newView);
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-4 mb-8">
            <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* Search */}
                    <div className="md:col-span-12 lg:col-span-4 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Hotel name or location..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    {/* Star Rating */}
                    <div className="md:col-span-6 lg:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Rating</label>
                        <Select value={stars} onValueChange={(val: any) => { setStars(val); }}>
                            <SelectTrigger className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                                <SelectValue placeholder="All Stars" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stars</SelectItem>
                                <SelectItem value="5">5 Stars</SelectItem>
                                <SelectItem value="4">4+ Stars</SelectItem>
                                <SelectItem value="3">3+ Stars</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price Range */}
                    <div className="md:col-span-6 lg:col-span-3 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Price Range ($)</label>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Min"
                                type="number"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            />
                            <span className="text-zinc-400">-</span>
                            <Input
                                placeholder="Max"
                                type="number"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            />
                        </div>
                    </div>

                    {/* Sort By */}
                    <div className="md:col-span-6 lg:col-span-3 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Sort By</label>
                        <Select value={sortBy} onValueChange={(val: any) => { setSortBy(val); }}>
                            <SelectTrigger className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                                <SelectValue placeholder="Newest" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Latest Upload</SelectItem>
                                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                                <SelectItem value="stars-desc">Stars: High to Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-2 gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full sm:w-auto">
                            <button
                                onClick={() => toggleView("list")}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all w-full sm:w-auto",
                                    view === "list" ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700"
                                )}
                            >
                                <List className="h-4 w-4" />
                                List
                            </button>
                            <button
                                onClick={() => toggleView("map")}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all w-full sm:w-auto",
                                    view === "map" ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700"
                                )}
                            >
                                <MapIcon className="h-4 w-4" />
                                Map
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {searchParams.size > 0 && !(searchParams.size === 1 && searchParams.has("view")) && (
                            <Button variant="ghost" onClick={handleClear} className="text-zinc-500 hover:text-red-500 h-11 px-4 flex-1 sm:flex-none">
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        )}
                        <Button onClick={handleSearch} className="h-11 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 flex-1 sm:flex-none">
                            Update Results
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
