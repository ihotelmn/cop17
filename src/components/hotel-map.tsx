"use client";

import { useState, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, OverlayView, InfoWindow } from "@react-google-maps/api";
import type { Hotel } from "@/types/hotel";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, Navigation, Building2, X } from "lucide-react";
import { Button } from "./ui/button";
import { COP17_VENUE, estimateTravelTime } from "@/lib/venue";
import { FallbackImage } from "./ui/fallback-image";

const containerStyle = {
    width: "100%",
    height: "100%",
};

const UB_CENTER = {
    lat: 47.9189,
    lng: 106.9176,
};

const TERELJ_CENTER = {
    lat: 47.9333,
    lng: 107.4500,
};

const defaultCenter = UB_CENTER;

function fitMapToVenueAndHotels(
    map: google.maps.Map,
    hotels: (Hotel & { minPrice: number })[],
    fallbackCenter = defaultCenter,
    options?: {
        padding?: number;
        maxZoom?: number;
    }
) {
    const padding = options?.padding ?? 72;
    const maxZoom = options?.maxZoom ?? 13;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: COP17_VENUE.latitude, lng: COP17_VENUE.longitude });

    let hasMarkers = false;

    hotels.forEach((hotel) => {
        if (hotel.latitude && hotel.longitude) {
            bounds.extend({ lat: hotel.latitude, lng: hotel.longitude });
            hasMarkers = true;
        }
    });

    if (!hasMarkers) {
        map.setCenter(fallbackCenter);
        map.setZoom(12);
        return;
    }

    map.fitBounds(bounds, padding);

    window.google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        if (map.getZoom() && map.getZoom()! > maxZoom) {
            map.setZoom(maxZoom);
        }
    });
}

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
        {
            "featureType": "poi",
            "elementType": "labels.text",
            "stylers": [{ "visibility": "on" }]
        },
        {
            "featureType": "transit",
            "elementType": "all",
            "stylers": [{ "visibility": "simplified" }]
        }
    ]
};

export default function HotelMap({ hotels, query }: { hotels: (Hotel & { minPrice: number })[], query?: string }) {
    const searchParams = useSearchParams();
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        language: 'en', // FORCE ENGLISH
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedHotel, setSelectedHotel] = useState<(Hotel & { minPrice: number }) | null>(null);
    const [showVenueInfo, setShowVenueInfo] = useState(false);
    const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const selectedHotelId = selectedHotel?.id ?? null;
    const mappableHotels = hotels.filter((hotel) => hotel.latitude && hotel.longitude);
    const nonSelectedHotels = mappableHotels.filter((hotel) => hotel.id !== selectedHotelId);
    const selectedMapHotel = selectedHotelId
        ? mappableHotels.find((hotel) => hotel.id === selectedHotelId) ?? null
        : null;
    const selectedImageUrl = selectedMapHotel?.images?.[0] ?? null;
    const hasVisibleSelectedImage = Boolean(selectedImageUrl) && failedImageUrl !== selectedImageUrl;
    const fitOptions = isMobileViewport
        ? { padding: 32, maxZoom: 14 }
        : { padding: 72, maxZoom: 13 };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const syncViewport = (event?: MediaQueryListEvent) => {
            setIsMobileViewport(event?.matches ?? mediaQuery.matches);
        };

        syncViewport();

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", syncViewport);
            return () => mediaQuery.removeEventListener("change", syncViewport);
        }

        mediaQuery.addListener(syncViewport);
        return () => mediaQuery.removeListener(syncViewport);
    }, []);

    useEffect(() => {
        setFailedImageUrl(null);
    }, [selectedImageUrl]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
        const q = (query || "").toLowerCase();

        if (q.includes("terelj") || q.includes("тэрэлж")) {
            map.setCenter(TERELJ_CENTER);
            map.setZoom(12);
            return;
        }

        if (!q || q.includes("ulaanbaatar") || q.includes("улаанбаатар") || q.includes("хот")) {
            fitMapToVenueAndHotels(map, hotels, defaultCenter, fitOptions);
            return;
        }

        // Default behavior for other searches
        fitMapToVenueAndHotels(map, hotels, defaultCenter, fitOptions);
    }, [fitOptions, hotels, query]);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    // Re-fit bounds or center when hotels/query change
    useEffect(() => {
        if (map) {
            const q = (query || "").toLowerCase();

            if (q.includes("terelj") || q.includes("тэрэлж")) {
                map.setCenter(TERELJ_CENTER);
                map.setZoom(12);
                return;
            }

            if (!q || q.includes("ulaanbaatar") || q.includes("улаанбаатар") || q.includes("хот")) {
                fitMapToVenueAndHotels(map, hotels, defaultCenter, fitOptions);
                return;
            }

            fitMapToVenueAndHotels(map, hotels, defaultCenter, fitOptions);
        }
    }, [fitOptions, map, hotels, query]);


    if (!isLoaded) {
        return <div className="h-[320px] w-full animate-pulse rounded-xl bg-zinc-100 md:h-[600px]" />;
    }

    return (
        <div className="relative z-10 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 md:h-[600px]">
            <div className={isMobileViewport ? "relative h-[320px]" : "relative h-[600px]"}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={defaultCenter}
                    zoom={12}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={mapOptions}
                    onClick={() => {
                        setSelectedHotel(null);
                        setShowVenueInfo(false);
                    }}
                >
                {/* 1. COP17 Venue Marker */}
                <OverlayView
                    position={{ lat: COP17_VENUE.latitude, lng: COP17_VENUE.longitude }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                    <div className="relative -translate-x-1/2 -translate-y-full mb-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowVenueInfo(!showVenueInfo);
                                setSelectedHotel(null);
                            }}
                            className={`rounded-full border-2 border-white bg-red-600 text-white shadow-2xl ${isMobileViewport ? "p-1.5" : "p-2"} animate-bounce-subtle`}
                        >
                            <MapPin className={`${isMobileViewport ? "h-5 w-5" : "h-6 w-6"} fill-white text-red-600`} />
                        </button>

                        {!isMobileViewport && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap uppercase tracking-tighter shadow-lg">
                                COP17 VENUE
                            </div>
                        )}
                    </div>
                </OverlayView>

                {showVenueInfo && (
                    <InfoWindow
                        position={{ lat: COP17_VENUE.latitude, lng: COP17_VENUE.longitude }}
                        onCloseClick={() => setShowVenueInfo(false)}
                        options={{
                            pixelOffset: new window.google.maps.Size(0, -24),
                            maxWidth: 260,
                        }}
                    >
                        <div className="w-[220px] rounded-2xl bg-white p-3 dark:bg-zinc-900">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-red-500">Official COP17 Venue</p>
                            <p className="text-sm font-bold leading-tight text-zinc-900 dark:text-white">{COP17_VENUE.name}</p>
                            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{COP17_VENUE.address}</p>
                        </div>
                    </InfoWindow>
                )}

                {/* 2. Hotel Markers */}
                {nonSelectedHotels.map((hotel) => (
                    <OverlayView
                        key={hotel.id}
                        position={{ lat: hotel.latitude!, lng: hotel.longitude! }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <div className="relative z-10 -translate-x-1/2 -translate-y-1/2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHotel(hotel);
                                    setShowVenueInfo(false);
                                }}
                                className={
                                    isMobileViewport
                                        ? `relative z-10 rounded-full border border-white/90 bg-white/95 px-2 py-1 text-[11px] font-black tracking-tight text-blue-700 shadow-lg transition-all duration-200 ${selectedHotelId ? "opacity-70" : "opacity-100"}`
                                        : "relative z-10 flex items-center gap-1.5 rounded-xl border-2 border-white bg-blue-600 px-3 py-2 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-blue-700"
                                }
                                aria-label={`View ${hotel.name}`}
                            >
                                {isMobileViewport ? (
                                    <span>${hotel.minPrice}</span>
                                ) : (
                                    <>
                                        <Building2 className="h-3.5 w-3.5 text-white/90" />
                                        <span className="text-sm font-black tracking-tight">${hotel.minPrice}</span>
                                        <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-white bg-blue-600"></div>
                                    </>
                                )}
                            </button>
                        </div>
                    </OverlayView>
                ))}

                {selectedMapHotel && (
                    <OverlayView
                        key={selectedMapHotel.id}
                        position={{ lat: selectedMapHotel.latitude!, lng: selectedMapHotel.longitude! }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <div className="relative z-[120] -translate-x-1/2 -translate-y-1/2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHotel(selectedMapHotel);
                                    setShowVenueInfo(false);
                                }}
                                className={
                                    isMobileViewport
                                        ? "relative z-[121] rounded-full border border-amber-300 bg-zinc-950 px-2.5 py-1 text-[11px] font-black tracking-tight text-amber-300 shadow-xl ring-4 ring-amber-400/25"
                                        : "relative z-[121] flex items-center gap-1.5 rounded-xl border-2 border-amber-400 bg-zinc-900 px-3 py-2 text-white shadow-xl ring-4 ring-amber-400/20 transition-all duration-300 scale-125"
                                }
                                aria-label={`Selected hotel ${selectedMapHotel.name}`}
                            >
                                {isMobileViewport ? (
                                    <span>${selectedMapHotel.minPrice}</span>
                                ) : (
                                    <>
                                        <Building2 className="h-3.5 w-3.5 text-amber-400" />
                                        <span className="text-sm font-black tracking-tight">${selectedMapHotel.minPrice}</span>
                                        <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-amber-400 bg-zinc-900"></div>
                                    </>
                                )}
                            </button>
                        </div>
                    </OverlayView>
                )}

                {selectedMapHotel && !isMobileViewport && (
                    <InfoWindow
                        position={{ lat: selectedMapHotel.latitude!, lng: selectedMapHotel.longitude! }}
                        onCloseClick={() => setSelectedHotel(null)}
                        options={{
                            pixelOffset: new window.google.maps.Size(0, -24),
                            maxWidth: 320,
                        }}
                    >
                        <div className="w-[280px] overflow-hidden rounded-2xl bg-white dark:bg-zinc-900">
                            {hasVisibleSelectedImage ? (
                                <div className="relative h-40 w-full bg-zinc-100">
                                    <FallbackImage
                                        src={selectedImageUrl}
                                        alt={selectedMapHotel.name}
                                        className="h-full w-full object-cover"
                                        onError={() => setFailedImageUrl(selectedImageUrl)}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 left-4">
                                        <div className="mb-1 flex items-center gap-0.5">
                                            {Array.from({ length: selectedMapHotel.stars }).map((_, i) => (
                                                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                        <h3 className="text-lg font-bold leading-tight text-white">{selectedMapHotel.name}</h3>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 px-4 py-5 text-white">
                                    <div className="mb-2 flex items-center gap-0.5">
                                        {Array.from({ length: selectedMapHotel.stars }).map((_, i) => (
                                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <h3 className="text-lg font-bold leading-tight">{selectedMapHotel.name}</h3>
                                </div>
                            )}

                            <div className="p-4">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <p className="line-clamp-1">{selectedMapHotel.address || "Ulaanbaatar, Mongolia"}</p>
                                    </div>

                                    {selectedMapHotel.distanceToVenue != null && (
                                        <div className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 dark:border-blue-800/50 dark:bg-blue-900/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                                    <Navigation className="h-3 w-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Distance to Venue</span>
                                                </div>
                                                <span className="text-xs font-black text-blue-700 dark:text-blue-300">{selectedMapHotel.distanceToVenue} km</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-medium text-blue-600/80 dark:text-blue-400/80">
                                                <span>Est. Travel Time:</span>
                                                <div className="flex gap-2">
                                                    <span className="rounded bg-white/50 px-1.5 py-0.5 dark:bg-zinc-800/50">{estimateTravelTime(selectedMapHotel.distanceToVenue, "driving")}</span>
                                                    <span className="rounded bg-white/50 px-1.5 py-0.5 dark:bg-zinc-800/50">{estimateTravelTime(selectedMapHotel.distanceToVenue, "walking")}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                    <div>
                                        <p className="mb-1 text-[10px] font-bold leading-none tracking-widest text-zinc-400 uppercase">From</p>
                                        <p className="text-xl font-black text-zinc-900 dark:text-white">${selectedMapHotel.minPrice}<span className="text-xs font-medium text-zinc-500">/nt</span></p>
                                    </div>
                                    <Button asChild size="lg" className="h-11 rounded-xl bg-blue-600 px-6 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700">
                                        <Link href={`/hotels/${selectedMapHotel.id}${searchParams && searchParams.toString() ? `?${searchParams.toString()}` : ""}`}>
                                            Details
                                        </Link>
                                    </Button>
                                </div>

                                <Button asChild variant="ghost" size="sm" className="mt-2 h-8 w-full text-zinc-400 transition-colors hover:text-blue-600">
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMapHotel.latitude},${selectedMapHotel.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        Get Directions in Google Maps
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </InfoWindow>
                )}
                {/* Legend / Key */}
                {!isMobileViewport && (
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md z-20 border border-zinc-200 pointer-events-none">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-600 border border-white"></div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Event Venue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-white border-2 border-zinc-300"></div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Hotel (Price)</span>
                            </div>
                        </div>
                    </div>
                )}
                </GoogleMap>
            </div>

            {selectedMapHotel && isMobileViewport && (
                <div className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="relative">
                            {hasVisibleSelectedImage ? (
                                <div className="relative h-28 w-full bg-zinc-100">
                                    <FallbackImage
                                        src={selectedImageUrl}
                                        alt={selectedMapHotel.name}
                                        className="h-full w-full object-cover"
                                        onError={() => setFailedImageUrl(selectedImageUrl)}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-12">
                                        <div className="mb-1 flex items-center gap-0.5">
                                            {Array.from({ length: selectedMapHotel.stars }).map((_, i) => (
                                                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                        <h3 className="line-clamp-2 text-base font-black leading-tight text-white">
                                            {selectedMapHotel.name}
                                        </h3>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 px-3 py-4 text-white">
                                    <div className="mb-2 flex items-center gap-0.5">
                                        {Array.from({ length: selectedMapHotel.stars }).map((_, i) => (
                                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <h3 className="pr-10 text-base font-black leading-tight">{selectedMapHotel.name}</h3>
                                </div>
                            )}

                            <button
                                type="button"
                                aria-label="Close hotel preview"
                                onClick={() => setSelectedHotel(null)}
                                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/92 text-zinc-700 shadow-sm transition hover:bg-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 p-3">
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <p className="line-clamp-1">{selectedMapHotel.address || "Ulaanbaatar, Mongolia"}</p>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">From</p>
                                    <p className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
                                        ${selectedMapHotel.minPrice}
                                        <span className="ml-1 text-[11px] font-semibold text-zinc-500">/nt</span>
                                    </p>
                                </div>

                                {selectedMapHotel.distanceToVenue != null && (
                                    <div className="rounded-full bg-blue-50 px-3 py-1.5 text-right text-[11px] font-bold text-blue-700">
                                        {selectedMapHotel.distanceToVenue} km to venue
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button asChild className="h-10 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700">
                                    <Link href={`/hotels/${selectedMapHotel.id}${searchParams && searchParams.toString() ? `?${searchParams.toString()}` : ""}`}>
                                        Details
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="h-10 rounded-xl border-zinc-200 px-4 text-sm font-bold dark:border-zinc-700">
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMapHotel.latitude},${selectedMapHotel.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Directions
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend / Key */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md z-20 border border-zinc-200 pointer-events-none hidden">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-600 border border-white"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Event Venue</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white border-2 border-zinc-300"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Hotel (Price)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
