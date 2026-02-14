"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { Hotel } from "@/app/actions/public";
import Link from "next/link";
import { Star, X, MapPin, Navigation } from "lucide-react";
import { Button } from "./ui/button";
import { COP17_VENUE } from "@/lib/venue";

const containerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: COP17_VENUE.latitude,
    lng: COP17_VENUE.longitude, // Center on Venue initially
};

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
        // ... (Keep existing styles or simplify to allow POIs in English)
        {
            "featureType": "transit",
            "elementType": "all",
            "stylers": [{ "visibility": "simplified" }]
        }
    ]
};

export default function HotelMap({ hotels }: { hotels: (Hotel & { minPrice: number })[] }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        language: 'en', // FORCE ENGLISH
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedHotel, setSelectedHotel] = useState<(Hotel & { minPrice: number }) | null>(null);
    const [showVenueInfo, setShowVenueInfo] = useState(false);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
        const bounds = new window.google.maps.LatLngBounds();

        // Always include Venue in bounds
        bounds.extend({ lat: COP17_VENUE.latitude, lng: COP17_VENUE.longitude });

        if (hotels.length > 0) {
            hotels.forEach(hotel => {
                if (hotel.latitude && hotel.longitude) {
                    bounds.extend({ lat: hotel.latitude, lng: hotel.longitude });
                }
            });
            map.fitBounds(bounds);
        } else {
            map.setCenter(defaultCenter);
            map.setZoom(14);
        }
    }, [hotels]);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    // Re-fit bounds when hotels change
    useEffect(() => {
        if (map) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend({ lat: COP17_VENUE.latitude, lng: COP17_VENUE.longitude });

            let hasHotels = false;
            hotels.forEach(hotel => {
                if (hotel.latitude && hotel.longitude) {
                    bounds.extend({ lat: hotel.latitude, lng: hotel.longitude });
                    hasHotels = true;
                }
            });

            if (hasHotels) {
                map.fitBounds(bounds);
            }
        }
    }, [map, hotels]);


    if (!isLoaded) return <div className="h-[600px] w-full bg-zinc-100 animate-pulse rounded-xl" />;

    return (
        <div className="h-[600px] w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg relative z-10">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={14}
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
                            className="bg-red-600 text-white p-2 rounded-full shadow-2xl border-2 border-white animate-bounce-subtle"
                        >
                            <MapPin className="h-6 w-6 fill-white text-red-600" />
                        </button>

                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap uppercase tracking-tighter shadow-lg">
                            COP17 VENUE
                        </div>

                        {showVenueInfo && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-zinc-900 text-white rounded-lg shadow-2xl p-3 z-[110]">
                                <p className="font-bold text-xs uppercase tracking-wider text-red-400 mb-1">Event Center</p>
                                <p className="text-sm font-semibold leading-tight">{COP17_VENUE.name}</p>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 rotate-45"></div>
                            </div>
                        )}
                    </div>
                </OverlayView>

                {/* 2. Hotel Markers */}
                {hotels.map((hotel) => (
                    hotel.latitude && hotel.longitude && (
                        <OverlayView
                            key={hotel.id}
                            position={{ lat: hotel.latitude, lng: hotel.longitude }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedHotel(hotel);
                                        setShowVenueInfo(false);
                                    }}
                                    className={`
                                        bg-white text-zinc-900 font-bold px-3 py-1.5 rounded-full shadow-md border-2 
                                        transition-all text-sm whitespace-nowrap flex items-center gap-1 hover:scale-110 hover:z-50
                                        ${selectedHotel?.id === hotel.id ? "border-zinc-900 z-50 scale-110" : "border-white"}
                                    `}
                                >
                                    ${hotel.minPrice}
                                </button>

                                {/* Info Window / Popup */}
                                {selectedHotel?.id === hotel.id && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-white rounded-lg shadow-xl p-3 z-[100] animate-in fade-in zoom-in-95 duration-200">
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-sm"></div>

                                        <div className="relative z-10">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedHotel(null);
                                                }}
                                                className="absolute -top-1 -right-1 p-1 hover:bg-zinc-100 rounded-full"
                                            >
                                                <X className="h-4 w-4 text-zinc-400" />
                                            </button>

                                            {hotel.images?.[0] && (
                                                <div className="h-32 w-full mb-3 rounded-md overflow-hidden bg-zinc-100 relative">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={hotel.images[0]}
                                                        alt={hotel.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}

                                            <h3 className="font-bold text-base leading-tight pr-4">{hotel.name}</h3>
                                            <div className="flex items-center gap-1 mt-1 mb-2">
                                                {Array.from({ length: hotel.stars }).map((_, i) => (
                                                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                ))}
                                            </div>

                                            <div className="flex flex-col gap-2 mb-3">
                                                <p className="text-xs text-zinc-500 line-clamp-1">
                                                    {hotel.address || "Ulaanbaatar, Mongolia"}
                                                </p>

                                                {hotel.distanceToVenue != null && (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 w-fit">
                                                        <Navigation className="h-3 w-3" />
                                                        {hotel.distanceToVenue} km to Venue
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 gap-2">
                                                <Button asChild variant="outline" size="sm" className="h-9 flex-1 text-xs">
                                                    <a
                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-1"
                                                    >
                                                        Directions
                                                    </a>
                                                </Button>
                                                <Button asChild size="sm" className="h-9 flex-1 text-xs">
                                                    <Link href={`/hotels/${hotel.id}`}>
                                                        Book Now
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </OverlayView>
                    )
                ))}
            </GoogleMap>

            {/* Legend / Key */}
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
        </div>
    );
}
