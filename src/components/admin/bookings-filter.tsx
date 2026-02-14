"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
// import { useDebounce } from "@/hooks/use-debounce"; 

export function BookingsFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State for inputs
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [status, setStatus] = useState(searchParams.get("status") || "all");

    // Create query string
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== "all") {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only push if value changed from URL to avoid loop
            const currentSearch = searchParams.get("search") || "";
            if (search !== currentSearch) {
                // If search is empty, remove it from query
                const queryString = createQueryString("search", search);
                router.push(pathname + (queryString ? "?" + queryString : ""));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search, router, pathname, createQueryString, searchParams]);

    // Handle Status Change
    const handleStatusChange = (value: string) => {
        setStatus(value);
        router.push(pathname + "?" + createQueryString("status", value));
    };

    // Clear Filters
    const clearFilters = () => {
        setSearch("");
        setStatus("all");
        router.push(pathname);
    };

    const hasFilters = search || (status && status !== "all");

    return (
        <div className="flex items-center gap-4 py-4 w-full">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search guests, IDs..."
                    className="pl-9 bg-white dark:bg-zinc-900"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Status Filter */}
            <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-900">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="checked-out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>

            {/* Reset Button */}
            {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="px-2 lg:px-3 text-muted-foreground">
                    Reset
                    <X className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
