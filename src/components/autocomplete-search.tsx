"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, MapPin, Building2, Loader2, X } from "lucide-react";
import { getSearchSuggestions } from "@/app/actions/public";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce"; // I'll need to create this hook if missing

interface AutocompleteSearchProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: () => void;
    placeholder?: string;
    className?: string;
}

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
    const [isLoading, setIsLoading] = React.useState(false);

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
        // Small delay to allow state update before trigger search
        setTimeout(() => onSearch?.(), 100);
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
            <div className="relative flex items-center">
                <Search className="absolute left-4 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            setOpen(false);
                            onSearch?.();
                        }
                        if (e.key === "Escape") setOpen(false);
                    }}
                    placeholder={placeholder}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl py-3 pl-11 pr-10 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                />

                {isLoading && (
                    <div className="absolute right-4">
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
                        className="absolute right-3 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                    >
                        <X className="h-3 w-3 text-zinc-500" />
                    </button>
                )}
            </div>

            {open && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <Command className="w-full">
                        <Command.List className="p-2">
                            {suggestions.map((item) => (
                                <Command.Item
                                    key={item}
                                    onSelect={() => handleSelect(item)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                        {/* Simple heuristic: if it looks like a hotel name (title case usually) vs address snippet */}
                                        {item.length > 20 || /^\d/.test(item) ? <MapPin className="h-4 w-4 text-blue-500" /> : <Building2 className="h-4 w-4 text-blue-500" />}
                                    </div>
                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{item}</span>
                                </Command.Item>
                            ))}
                        </Command.List>
                    </Command>
                </div>
            )}
        </div>
    );
}
