"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { X, Star } from "lucide-react";

export function FilterSidebar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // -- State --
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [selectedStars, setSelectedStars] = useState<string[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // -- Init State from URL --
    useEffect(() => {
        // Price
        const min = searchParams.get("minPrice");
        const max = searchParams.get("maxPrice");
        if (min || max) {
            setPriceRange([Number(min) || 0, Number(max) || 1000]);
        }

        // Stars
        const starsParam = searchParams.get("stars");
        if (starsParam) {
            // API expects "5", we might support multiple in UI but API currently takes single gte.
            // For better UI, let's assume we filter by "at least X stars" or we update API later to support list.
            // Current API: gte("stars", stars). So if user selects 4 and 5, we should probably send 4 (gte 4 covers 4,5).
            // Let's just track the single highest selection or logic map it.
            // Simplified: "Minimum Rating"
        }

        // Amenities
        const amenitiesParam = searchParams.get("amenities");
        if (amenitiesParam) {
            setSelectedAmenities(amenitiesParam.split(","));
        }
    }, [searchParams]);

    // -- Handlers --
    const applyFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());

        // Price
        params.set("minPrice", priceRange[0].toString());
        params.set("maxPrice", priceRange[1].toString());

        // Amenities
        if (selectedAmenities.length > 0) {
            params.set("amenities", selectedAmenities.join(","));
        } else {
            params.delete("amenities");
        }

        // Stars (Simplification: If 5 is selected, send 5. If 4, send 4.)
        // Ideally we'd send list, but let's stick to current API 'gte'.
        // If user selects multiple, we take the minimum of selected to show all 'at least X'.
        if (selectedStars.length > 0) {
            const minStar = Math.min(...selectedStars.map(Number));
            params.set("stars", minStar.toString());
        } else {
            params.delete("stars");
        }

        // Reset pagination if exists
        params.delete("page");

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [priceRange, selectedStars, selectedAmenities, router, searchParams, pathname]);

    // Debounced Price Update
    useEffect(() => {
        const timeout = setTimeout(() => {
            // Only push if changed from URL defaults to avoid loops?
            // actually manual apply button is better for slider perf, or debounce.
            // Implemented manual "Apply" or debounce effect?
            // Let's rely on a separate Effect for Price that triggers applyFilters?
            // No, let's trigger it.
            const params = new URLSearchParams(searchParams.toString());
            const currentMin = Number(params.get("minPrice") || 0);
            const currentMax = Number(params.get("maxPrice") || 1000);

            if (priceRange[0] !== currentMin || priceRange[1] !== currentMax) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [priceRange, applyFilters, searchParams]);


    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };

    // Immediate apply for checkboxes
    useEffect(() => {
        // Logic to check if amenities changed vs URL...
        // Actually the applyFilters includes amenities. 
        // We can just call applyFilters when `selectedAmenities` changes?
        // Yes, but need to be careful of circular dep with Init.
        // Let's use a ref or manual tracking, OR straightforward: 
        // When user clicks checkbox -> update state -> trigger router push.
    }, [selectedAmenities]);


    const handleAmenityChange = (amenity: string) => {
        const newAmenities = selectedAmenities.includes(amenity)
            ? selectedAmenities.filter(a => a !== amenity)
            : [...selectedAmenities, amenity];

        setSelectedAmenities(newAmenities);

        // Direct update
        const params = new URLSearchParams(searchParams.toString());
        if (newAmenities.length > 0) {
            params.set("amenities", newAmenities.join(","));
        } else {
            params.delete("amenities");
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Star handling
    const handleStarChange = (star: string) => {
        // Toggle behavior for single selection simulation or multi?
        // Let's do multi-select UI but logic is "at least min(selected)".
        const newStars = selectedStars.includes(star)
            ? selectedStars.filter(s => s !== star)
            : [...selectedStars, star];

        setSelectedStars(newStars);

        const params = new URLSearchParams(searchParams.toString());
        if (newStars.length > 0) {
            const minStar = Math.min(...newStars.map(Number));
            params.set("stars", minStar.toString());
        } else {
            params.delete("stars");
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        setPriceRange([0, 1000]);
        setSelectedStars([]);
        setSelectedAmenities([]);
        // Push to base path to clear all params including query, stars, amenities, etc.
        router.push(pathname, { scroll: false });
    };

    const hasActiveFilters =
        selectedAmenities.length > 0 ||
        selectedStars.length > 0 ||
        priceRange[0] > 0 ||
        priceRange[1] < 1000 ||
        searchParams.get("query") !== null ||
        searchParams.get("stars") !== null ||
        searchParams.get("amenities") !== null ||
        (searchParams.get("sortBy") !== null && searchParams.get("sortBy") !== "newest");

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                        <X className="h-4 w-4 text-white rotate-45" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Filters</h3>
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
                    >
                        Reset All
                    </Button>
                )}
            </div>

            {/* Price Range */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Price Range</h4>
                    <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-400">USD</span>
                </div>
                <div className="px-2">
                    <Slider
                        defaultValue={[0, 1000]}
                        value={priceRange}
                        max={1000}
                        step={10}
                        minStepsBetweenThumbs={1}
                        onValueChange={setPriceRange} // Update local state for smooth sliding
                        className="py-4"
                    />
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">Min</span>
                            <span className="text-sm font-black">${priceRange[0]}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">Max</span>
                            <span className="text-sm font-black">${priceRange[1]}+</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800" />

            {/* Star Rating */}
            <div className="space-y-5">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Accommodation Class</h4>
                <div className="space-y-3">
                    {["5", "4", "3"].map((star) => (
                        <div key={star} className="flex items-center group cursor-pointer" onClick={() => handleStarChange(star)}>
                            <Checkbox
                                id={`star-${star}`}
                                checked={selectedStars.includes(star)}
                                onCheckedChange={() => handleStarChange(star)}
                                className="mr-3 border-zinc-300 rounded-md data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label htmlFor={`star-${star}`} className="flex items-center flex-1 cursor-pointer font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 transition-colors">
                                <span className="mr-auto">{star} Stars</span>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: Number(star) }).map((_, i) => (
                                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400 border-none" />
                                    ))}
                                </div>
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800" />

            {/* Amenities */}
            <div className="space-y-5">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Key Features</h4>
                <div className="grid grid-cols-1 gap-3">
                    {["WiFi", "Breakfast", "Pool", "Gym", "Spa", "Parking", "Shuttle"].map((item) => {
                        const icons: Record<string, string> = {
                            WiFi: "📶",
                            Breakfast: "☕",
                            Pool: "🏊",
                            Gym: "💪",
                            Spa: "💆",
                            Parking: "🅿️",
                            Shuttle: "🚐"
                        };

                        return (
                            <div key={item} className="flex items-center group cursor-pointer" onClick={() => handleAmenityChange(item)}>
                                <Checkbox
                                    id={`amenity-${item}`}
                                    checked={selectedAmenities.includes(item)}
                                    onCheckedChange={() => handleAmenityChange(item)}
                                    className="mr-3 border-zinc-300 rounded-md data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <Label htmlFor={`amenity-${item}`} className="flex items-center flex-1 cursor-pointer font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 transition-colors">
                                    <span className="mr-2 text-base">{icons[item]}</span>
                                    {item}
                                </Label>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Help / Support Mini Card */}
            <div className="mt-12 p-5 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                <h5 className="font-black text-sm mb-2 relative z-10">Need Assistance?</h5>
                <p className="text-[11px] text-blue-100 leading-relaxed mb-4 relative z-10">Our delegate support team is available 24/7 for booking help.</p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest relative z-10">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Available Now
                </div>
            </div>
        </div>
    );
}
