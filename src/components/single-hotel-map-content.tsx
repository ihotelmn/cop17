"use client";

import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { MapPin, Navigation } from "lucide-react";
import { COP17_VENUE } from "@/lib/venue";

const containerStyle = {
    width: "100%",
    height: "100%",
};

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    scrollwheel: false,
    draggable: false,
    styles: [
        {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [{ "visibility": "off" }]
        }
    ]
};

export default function SingleHotelMapContent({
    latitude,
    longitude,
    hotelName
}: {
    latitude: number;
    longitude: number;
    hotelName: string;
}) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        language: 'en',
    });

    if (!isLoaded) return <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />;

    const center = { lat: latitude, lng: longitude };

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner relative group cursor-pointer" onClick={() => {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
        }}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={15}
                options={mapOptions}
            >
                {/* Hotel Marker */}
                <OverlayView
                    position={center}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                    <div className="relative -translate-x-1/2 -translate-y-full mb-1">
                        <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                            <MapPin className="h-4 w-4 fill-white text-blue-600" />
                        </div>
                    </div>
                </OverlayView>
            </GoogleMap>

            {/* Click overlay hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-zinc-200 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
                        <Navigation className="w-3 h-3 text-blue-600" />
                        Get Directions
                    </p>
                </div>
            </div>
        </div>
    );
}
