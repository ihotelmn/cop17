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

    // Helper to clean malformed URLs (e.g. stringified JSON ["url"])
    const cleanUrls = (url: string | any): string[] => {
        if (!url) return [];

        if (Array.isArray(url)) return url.filter(u => typeof u === 'string');

        let cleaned = String(url);

        // Handle ["url"] format (JSON stringified array)
        if (cleaned.startsWith('[') || cleaned.startsWith('"[')) {
            try {
                // Remove extra outer quotes if present
                let jsonStr = cleaned;
                if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
                    jsonStr = jsonStr.slice(1, -1);
                }

                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) {
                    return parsed.filter(u => typeof u === 'string');
                }
            } catch (e) {
                // Fallback: try to extract all http urls via regex if parsing fails
                const matches = cleaned.match(/https?:\/\/[^"\]]+/g);
                return matches || [];
            }
        }

        // Basic validity check
        if (!cleaned.startsWith('http') && !cleaned.startsWith('/')) {
            return [];
        }

        return [cleaned];
    };

    // Filter and clean images
    const validImages = images
        .flatMap(cleanUrls)
        .filter((img): img is string => !!img && img.length > 0);

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
                    {/* Navigation Buttons */}
                    <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/80 hover:bg-white pointer-events-auto backdrop-blur-sm"
                            onClick={scrollPrev}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous slide</span>
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/80 hover:bg-white pointer-events-auto backdrop-blur-sm"
                            onClick={scrollNext}
                        >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next slide</span>
                        </Button>
                    </div>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                        {scrollSnaps.map((_, index) => (
                            <button
                                key={index}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    index === selectedIndex
                                        ? "bg-white w-6"
                                        : "bg-white/50 w-1.5 hover:bg-white/80"
                                )}
                                onClick={() => scrollTo(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
