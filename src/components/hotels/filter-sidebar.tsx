"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import { X } from "lucide-react";

export function FilterSidebar() {
    const router = useRouter();
    const searchParams = useSearchParams();

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

        router.push(`/hotels?${params.toString()}`, { scroll: false });
    }, [priceRange, selectedStars, selectedAmenities, router, searchParams]);

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
        router.push(`/hotels?${params.toString()}`, { scroll: false });
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
        router.push(`/hotels?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        setPriceRange([0, 1000]);
        setSelectedStars([]);
        setSelectedAmenities([]);
        router.push("/hotels");
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Filters</h3>
                {(selectedAmenities.length > 0 || selectedStars.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 h-auto p-0 hover:bg-transparent hover:text-red-600">
                        Reset
                    </Button>
                )}
            </div>

            {/* Price Range */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold mb-2">Price Range</h4>
                <Slider
                    defaultValue={[0, 1000]}
                    value={priceRange}
                    max={1000}
                    step={10}
                    minStepsBetweenThumbs={1}
                    onValueChange={setPriceRange} // Update local state for smooth sliding
                    className="py-4"
                />
                <div className="flex items-center justify-between text-sm text-zinc-500">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}+</span>
                </div>
            </div>

            <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Star Rating */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold">Star Rating</h4>
                <div className="space-y-2">
                    {["5", "4", "3"].map((star) => (
                        <div key={star} className="flex items-center space-x-2">
                            <Checkbox
                                id={`star-${star}`}
                                checked={selectedStars.includes(star)}
                                onCheckedChange={() => handleStarChange(star)}
                            />
                            <Label htmlFor={`star-${star}`} className="flex items-center cursor-pointer">
                                {star} Stars
                                <span className="ml-1 text-amber-500">{'★'.repeat(Number(star))}</span>
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Amenities */}
            <Accordion type="single" collapsible defaultValue="amenities">
                <AccordionItem value="amenities" className="border-none">
                    <AccordionTrigger className="text-sm font-semibold py-0 pb-3 hover:no-underline">
                        Amenities
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-1">
                            {["WiFi", "Breakfast", "Pool", "Gym", "Spa", "Parking", "Shuttle"].map((item) => (
                                <div key={item} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`amenity-${item}`}
                                        checked={selectedAmenities.includes(item)}
                                        onCheckedChange={() => handleAmenityChange(item)}
                                    />
                                    <Label htmlFor={`amenity-${item}`} className="cursor-pointer font-normal text-zinc-600 dark:text-zinc-400">
                                        {item}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
