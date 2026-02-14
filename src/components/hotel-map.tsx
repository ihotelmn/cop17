"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { Hotel } from "@/app/actions/public";
import Link from "next/link";
import { Star, X } from "lucide-react";
import { Button } from "./ui/button";

const containerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: 47.9188,
    lng: 106.9176, // Ulaanbaatar
};

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
        {
            "featureType": "all",
            "elementType": "geometry.fill",
            "stylers": [{ "weight": "2.00" }]
        },
        {
            "featureType": "all",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#9c9c9c" }]
        },
        {
            "featureType": "all",
            "elementType": "labels.text",
            "stylers": [{ "visibility": "on" }]
        },
        {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [{ "color": "#f2f2f2" }]
        },
        {
            "featureType": "landscape",
            "elementType": "geometry.fill",
            "stylers": [{ "color": "#ffffff" }]
        },
        {
            "featureType": "landscape.man_made",
            "elementType": "geometry.fill",
            "stylers": [{ "color": "#ffffff" }]
        },
        {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [{ "visibility": "off" }]
        },
        {
            "featureType": "road",
            "elementType": "all",
            "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
        },
        {
            "featureType": "road",
            "elementType": "geometry.fill",
            "stylers": [{ "color": "#eeeeee" }]
        },
        {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#7b7b7b" }]
        },
        {
            "featureType": "road",
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#ffffff" }]
        },
        {
            "featureType": "road.highway",
            "elementType": "all",
            "stylers": [{ "visibility": "simplified" }]
        },
        {
            "featureType": "road.arterial",
            "elementType": "labels.icon",
            "stylers": [{ "visibility": "off" }]
        },
        {
            "featureType": "transit",
            "elementType": "all",
            "stylers": [{ "visibility": "off" }]
        },
        {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }]
        },
        {
            "featureType": "water",
            "elementType": "geometry.fill",
            "stylers": [{ "color": "#c8d7d4" }]
        },
        {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#070707" }]
        },
        {
            "featureType": "water",
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#ffffff" }]
        }
    ]
};

export default function HotelMap({ hotels }: { hotels: (Hotel & { minPrice: number })[] }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedHotel, setSelectedHotel] = useState<(Hotel & { minPrice: number }) | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
        if (hotels.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            hotels.forEach(hotel => {
                if (hotel.latitude && hotel.longitude) {
                    bounds.extend({ lat: hotel.latitude, lng: hotel.longitude });
                }
            });
            map.fitBounds(bounds);
        }
    }, [hotels]);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    // Re-fit bounds when hotels change
    useEffect(() => {
        if (map && hotels.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            let hasValidCoords = false;
            hotels.forEach(hotel => {
                if (hotel.latitude && hotel.longitude) {
                    bounds.extend({ lat: hotel.latitude, lng: hotel.longitude });
                    hasValidCoords = true;
                }
            });
            if (hasValidCoords) {
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
                zoom={13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
                onClick={() => setSelectedHotel(null)}
            >
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
                                            <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
                                                {hotel.address || "Ulaanbaatar, Mongolia"}
                                            </p>

                                            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                                                <div className="text-left">
                                                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Starting at</p>
                                                    <p className="font-bold text-blue-600">${hotel.minPrice}/night</p>
                                                </div>
                                                <Button asChild size="sm" className="h-8">
                                                    <Link href={`/hotels/${hotel.id}`}>
                                                        View Details
                                                    </Link>
                                                </Button>
                                            </div>

                                            {hotel.distanceToVenue != null && (
                                                <div className="mt-2 text-xs text-center bg-blue-50 text-blue-700 py-1 rounded font-medium border border-blue-100">
                                                    {hotel.distanceToVenue} km to Venue
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </OverlayView>
                    )
                ))}
            </GoogleMap>
        </div>
    );
}
