"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, MapPin, Building2, Loader2, X, Clock, Flame } from "lucide-react";
import { getSearchSuggestions } from "@/app/actions/public";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface AutocompleteSearchProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: () => void;
    placeholder?: string;
    className?: string;
}

const POPULAR_DESTINATIONS = [
    { name: "Ulaanbaatar", type: "city" },
    { name: "Terelj", type: "area" },
    { name: "Sukhbaatar Square", type: "landmark" }
];

export function AutocompleteSearch({
    value,
    onChange,
    onSearch,
    placeholder = "Search hotels or locations...",
    className
}: AutocompleteSearchProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value);
    const [suggestions, setSuggestions] = React.useState<string[]>([]);
    const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    // Load recent searches on mount
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem("recentSearches");
            if (saved) {
                setRecentSearches(JSON.parse(saved));
            }
        } catch (e) {
            // Ignore
        }
    }, []);

    const saveRecentSearch = (term: string) => {
        if (!term) return;
        try {
            const current = [...recentSearches];
            const filtered = current.filter(s => s.toLowerCase() !== term.toLowerCase());
            const updated = [term, ...filtered].slice(0, 5); // Keep top 5
            setRecentSearches(updated);
            localStorage.setItem("recentSearches", JSON.stringify(updated));
        } catch (e) {
            // Ignore
        }
    };

    const debouncedQuery = useDebounce(inputValue, 150);

    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

    React.useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        async function fetchSuggestions() {
            setIsLoading(true);
            try {
                const results = await getSearchSuggestions(debouncedQuery);
                setSuggestions(results);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSuggestions();
    }, [debouncedQuery]);

    const handleSelect = (itemValue: string) => {
        setInputValue(itemValue);
        onChange(itemValue);
        setOpen(false);
        saveRecentSearch(itemValue);
        // Small delay to allow state update before trigger search
        setTimeout(() => onSearch?.(), 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            setOpen(false);
            if (inputValue) saveRecentSearch(inputValue);
            onSearch?.();
        }
        if (e.key === "Escape") setOpen(false);
    };

    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={cn("relative w-full group", className)}>
            <div className="relative flex items-center h-full">
                <input
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-0 transition-all outline-none"
                />

                {isLoading && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    </div>
                )}

                {!isLoading && inputValue && (
                    <button
                        onClick={() => {
                            setInputValue("");
                            onChange("");
                            setSuggestions([]);
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-95"
                    >
                        <X className="h-3 w-3 text-zinc-400 hover:text-red-500" />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <Command className="w-full bg-transparent">
                        <Command.List className="p-2 max-h-[300px] overflow-y-auto">

                            {/* Loading State */}
                            {isLoading && (
                                <div className="p-4 text-center text-sm text-zinc-500">
                                    Loading suggestions...
                                </div>
                            )}

                            {/* Active Search Suggestions */}
                            {!isLoading && inputValue.length >= 2 && suggestions.length > 0 && (
                                <div className="py-2">
                                    <div className="px-4 pb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Suggestions</div>
                                    {suggestions.map((item) => (
                                        <Command.Item
                                            key={item}
                                            onSelect={() => handleSelect(item)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800"
                                        >
                                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                                {item.length > 20 || /^\d/.test(item) ? <MapPin className="h-5 w-5 text-blue-500" /> : <Building2 className="h-5 w-5 text-blue-500" />}
                                            </div>
                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{item}</span>
                                        </Command.Item>
                                    ))}
                                </div>
                            )}

                            {/* Empty State / No Results */}
                            {!isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
                                <div className="p-4 text-center text-sm text-zinc-500">
                                    No places found.
                                </div>
                            )}

                            {/* Default State (Empty Input) */}
                            {!inputValue && (
                                <div className="py-2 space-y-6">
                                    {/* Recent Searches */}
                                    {recentSearches.length > 0 && (
                                        <div>
                                            <div className="px-4 pb-2 flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recent Searches</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setRecentSearches([]); localStorage.removeItem("recentSearches"); }}
                                                    className="text-xs text-blue-500 hover:text-blue-600 font-bold"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                            {recentSearches.map((item) => (
                                                <Command.Item
                                                    key={`recent-${item}`}
                                                    onSelect={() => handleSelect(item)}
                                                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800 group"
                                                >
                                                    <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-zinc-700 shadow-sm transition-colors">
                                                        <Clock className="h-5 w-5 text-zinc-500" />
                                                    </div>
                                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{item}</span>
                                                </Command.Item>
                                            ))}
                                        </div>
                                    )}

                                    {/* Popular Destinations */}
                                    <div>
                                        <div className="px-4 pb-2 text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                                            <Flame className="h-3 w-3 text-orange-500" /> Popular Destinations
                                        </div>
                                        {POPULAR_DESTINATIONS.map((item) => (
                                            <Command.Item
                                                key={`pop-${item.name}`}
                                                onSelect={() => handleSelect(item.name)}
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800 group"
                                            >
                                                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                                                    <MapPin className="h-5 w-5 text-orange-600" />
                                                </div>
                                                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{item.name}</span>
                                            </Command.Item>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </Command.List>
                    </Command>
                </div>
            )}
        </div>
    );
}
