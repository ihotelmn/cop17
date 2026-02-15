"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { Hotel } from "@/app/actions/public";
import Link from "next/link";
import { Star, X, MapPin, Navigation, Hotel as HotelIcon, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { COP17_VENUE, estimateTravelTime } from "@/lib/venue";

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
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 bg-zinc-900 text-white rounded-lg shadow-2xl p-4 z-[110] border border-red-500/30">
                                <p className="font-bold text-[10px] uppercase tracking-wider text-red-500 mb-1">Official Convention Center</p>
                                <p className="text-sm font-bold leading-tight mb-2">{COP17_VENUE.name}</p>
                                <p className="text-[10px] text-zinc-400 leading-tight">{COP17_VENUE.address}</p>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 rotate-45 border-r border-b border-red-500/30"></div>
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
                            <div className="relative -translate-x-1/2 -translate-y-1/2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedHotel(hotel);
                                        setShowVenueInfo(false);
                                    }}
                                    className={`
                                        relative flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-xl border-2 transition-all duration-300
                                        ${selectedHotel?.id === hotel.id
                                            ? "bg-zinc-900 border-amber-400 text-white scale-125 z-50 ring-4 ring-amber-400/20"
                                            : "bg-blue-600 border-white text-white hover:bg-blue-700 hover:scale-110 z-10"
                                        }
                                    `}
                                >
                                    <Building2 className={`h-3.5 w-3.5 ${selectedHotel?.id === hotel.id ? "text-amber-400" : "text-white/90"}`} />
                                    <span className="text-sm font-black tracking-tight">${hotel.minPrice}</span>

                                    {/* Small arrow/beak at bottom */}
                                    <div className={`
                                        absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 border-r-2 border-b-2
                                        ${selectedHotel?.id === hotel.id ? "bg-zinc-900 border-amber-400" : "bg-blue-600 border-white"}
                                    `}></div>
                                </button>

                                {/* Info Window / Popup */}
                                {selectedHotel?.id === hotel.id && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-bottom-2 duration-300 border border-zinc-200 dark:border-zinc-800">
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedHotel(null);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full z-20 transition-colors"
                                            >
                                                <X className="h-4 w-4 text-white" />
                                            </button>

                                            {hotel.images?.[0] && (
                                                <div className="h-40 w-full bg-zinc-100 relative">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={hotel.images[0]}
                                                        alt={hotel.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                    <div className="absolute bottom-3 left-4">
                                                        <div className="flex items-center gap-0.5 mb-1">
                                                            {Array.from({ length: hotel.stars }).map((_, i) => (
                                                                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                            ))}
                                                        </div>
                                                        <h3 className="font-bold text-lg text-white leading-tight">{hotel.name}</h3>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="p-4">
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs">
                                                        <MapPin className="h-3 w-3 shrink-0" />
                                                        <p className="line-clamp-1">{hotel.address || "Ulaanbaatar, Mongolia"}</p>
                                                    </div>

                                                    {hotel.distanceToVenue != null && (
                                                        <div className="flex flex-col gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                                                    <Navigation className="h-3 w-3" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Distance to Venue</span>
                                                                </div>
                                                                <span className="text-xs font-black text-blue-700 dark:text-blue-300">{hotel.distanceToVenue} km</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[10px] text-blue-600/80 dark:text-blue-400/80 font-medium">
                                                                <span>Est. Travel Time:</span>
                                                                <div className="flex gap-2">
                                                                    <span className="bg-white/50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">{estimateTravelTime(hotel.distanceToVenue, 'driving')}</span>
                                                                    <span className="bg-white/50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">{estimateTravelTime(hotel.distanceToVenue, 'walking')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 gap-3">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">From</p>
                                                        <p className="text-xl font-black text-zinc-900 dark:text-white">${hotel.minPrice}<span className="text-xs font-medium text-zinc-500">/nt</span></p>
                                                    </div>
                                                    <Button asChild size="lg" className="h-11 rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20">
                                                        <Link href={`/hotels/${hotel.id}`}>
                                                            Details
                                                        </Link>
                                                    </Button>
                                                </div>

                                                <Button asChild variant="ghost" size="sm" className="w-full mt-2 h-8 text-zinc-400 hover:text-blue-600 transition-colors">
                                                    <a
                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] font-bold uppercase tracking-widest"
                                                    >
                                                        Get Directions in Google Maps
                                                    </a>
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
