"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { ImgHTMLAttributes } from "react";
import { cn, getHotelImageUrl, HOTEL_IMAGE_PLACEHOLDER } from "@/lib/utils";

type FallbackImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
    src?: string | null;
    alt: string;
    fallbackSrc?: string;
};

export function FallbackImage({
    src,
    alt,
    className,
    fallbackSrc = HOTEL_IMAGE_PLACEHOLDER,
    onError,
    ...props
}: FallbackImageProps) {
    const resolvedSrc = getHotelImageUrl(src);
    const [currentSrc, setCurrentSrc] = useState(resolvedSrc);

    useEffect(() => {
        setCurrentSrc(resolvedSrc);
    }, [resolvedSrc]);

    return (
        <img
            {...props}
            src={currentSrc}
            alt={alt}
            className={cn(className)}
            onError={(event) => {
                onError?.(event);

                if (currentSrc !== fallbackSrc) {
                    setCurrentSrc(fallbackSrc);
                }
            }}
        />
    );
}
