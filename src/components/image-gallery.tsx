"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
    images: string[];
    alt: string;
    className?: string;
    aspectRatio?: "video" | "square" | "wide";
    showControls?: boolean;
}

export function ImageGallery({
    images,
    alt,
    className,
    aspectRatio = "video",
    showControls = true
}: ImageGalleryProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    // Recursive helper to extract all actual URLs from any object/string/array
    const extractUrls = (input: any): string[] => {
        if (!input) return [];

        // 1. If it's already an array, flatten its contents
        if (Array.isArray(input)) {
            return input.flatMap(item => extractUrls(item));
        }

        // 2. If it's not a string, we can't do much more
        if (typeof input !== 'string') return [];

        let str = input.trim();
        if (!str) return [];

        // 3. Handle stringified JSON (starts with [ or { or quoted [)
        if (str.startsWith('[') || str.startsWith('"[')) {
            try {
                // Remove wrapping quotes if they exist (e.g. "\"[...]\"")
                let jsonStr = str;
                if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
                    jsonStr = jsonStr.slice(1, -1);
                }
                const parsed = JSON.parse(jsonStr);
                return extractUrls(parsed);
            } catch (e) {
                // If JSON parse fails, fall through to regex/split
            }
        }

        // 4. Handle comma-separated strings (common in some exports)
        if (str.includes(',') && !str.startsWith('http')) {
            return str.split(',').flatMap(s => extractUrls(s.trim()));
        }

        // 5. Final cleaning of a single string
        // Remove trailing/leading quotes or brackets that might have leaked
        let cleaned = str.replace(/^["'\[]+|["'\]]+$/g, '').trim();

        if (cleaned.startsWith('http') || cleaned.startsWith('/')) {
            return [cleaned];
        }

        return [];
    };

    // Filter and clean images
    const validImages = Array.from(new Set(extractUrls(images)));

    // Debug logging for the user to report what's happening
    useEffect(() => {
        if (images.length > 0 && validImages.length === 0) {
            console.warn(`[ImageGallery] Input had ${images.length} items but validImages is empty. Input:`, images);
        }
    }, [images, validImages]);

    const hasMultipleImages = validImages.length > 1;

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    const onInit = useCallback((emblaApi: any) => {
        setScrollSnaps(emblaApi.scrollSnapList());
    }, []);

    const onSelect = useCallback((emblaApi: any) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;

        onInit(emblaApi);
        onSelect(emblaApi);
        emblaApi.on("reInit", onInit);
        emblaApi.on("reInit", onSelect);
        emblaApi.on("select", onSelect);
    }, [emblaApi, onInit, onSelect]);

    // Aspect Ratio styles
    const aspectRatioClass = {
        video: "aspect-video",
        square: "aspect-square",
        wide: "aspect-[21/9]",
    }[aspectRatio];

    if (validImages.length === 0) {
        return (
            <div className={cn("relative bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden", aspectRatioClass, className)}>
                <Image
                    src="/images/placeholder-hotel.jpg"
                    alt={alt}
                    fill
                    className="object-cover"
                />
            </div>
        );
    }

    return (
        <div className={cn("relative group overflow-hidden", aspectRatioClass, className)}>
            <div className="overflow-hidden h-full" ref={emblaRef}>
                <div className="flex h-full touch-pan-y">
                    {validImages.map((src, index) => (
                        <div className="relative flex-[0_0_100%] min-w-0" key={`${src}-${index}`}>
                            <Image
                                src={src}
                                alt={`${alt} - Image ${index + 1}`}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {hasMultipleImages && showControls && (
                <>
                    {/* Navigation Buttons - More visible on mobile and default */}
                    <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 text-white border-none pointer-events-auto backdrop-blur-md opacity-0 md:group-hover:opacity-100 transition-opacity"
                            onClick={scrollPrev}
                        >
                            <ChevronLeft className="h-5 w-5" />
                            <span className="sr-only">Previous slide</span>
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 text-white border-none pointer-events-auto backdrop-blur-md opacity-0 md:group-hover:opacity-100 transition-opacity"
                            onClick={scrollNext}
                        >
                            <ChevronRight className="h-5 w-5" />
                            <span className="sr-only">Next slide</span>
                        </Button>
                    </div>

                    {/* Image Counter */}
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-medium">
                        {selectedIndex + 1} / {validImages.length}
                    </div>

                    {/* Dots Indicator - ALWAYS VISIBLE */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4">
                        <div className="flex gap-1.5 bg-black/20 backdrop-blur-sm p-1.5 rounded-full">
                            {scrollSnaps.map((_, index) => (
                                <button
                                    key={index}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        index === selectedIndex
                                            ? "bg-white w-5"
                                            : "bg-white/40 w-1.5 hover:bg-white/70"
                                    )}
                                    onClick={() => scrollTo(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
