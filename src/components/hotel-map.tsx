"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Hotel } from "@/app/actions/public";
import Link from "next/link";
import { Star, MapPin, Building2 } from "lucide-react";

// Fix Leaflet icons
const icon = L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Helper to auto-fit map to markers
function MapResizer({ hotels }: { hotels: (Hotel & { minPrice: number })[] }) {
    const map = useMap();

    useEffect(() => {
        if (hotels.length > 0) {
            const bounds = L.latLngBounds(hotels
                .filter(h => h.latitude && h.longitude)
                .map(h => [h.latitude!, h.longitude!]) as L.LatLngExpression[]
            );
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [hotels, map]);

    return null;
}

export default function HotelMap({ hotels }: { hotels: (Hotel & { minPrice: number })[] }) {
    const [mounted, setMounted] = useState(false);
    const defaultCenter: L.LatLngExpression = [47.9188, 106.9176]; // Ulaanbaatar

    useEffect(() => {
        setMounted(true);
        // Fix icon prototype issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });
    }, []);

    if (!mounted) return <div className="h-[600px] w-full bg-zinc-100 animate-pulse rounded-xl" />;

    const hotelsWithCoords = hotels.filter(h => h.latitude && h.longitude);

    return (
        <div className="h-[600px] w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg relative z-10">
            <MapContainer
                center={defaultCenter}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {hotelsWithCoords.map((hotel) => (
                    <Marker
                        key={hotel.id}
                        position={[hotel.latitude!, hotel.longitude!]}
                    >
                        <Popup className="hotel-popup">
                            <div className="w-64 p-1">
                                {hotel.images?.[0] && (
                                    <div className="h-32 w-full mb-3 rounded-md overflow-hidden bg-zinc-100">
                                        <img
                                            src={hotel.images[0]}
                                            alt={hotel.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <h3 className="font-bold text-base leading-tight">{hotel.name}</h3>
                                <div className="flex items-center gap-1 mt-1 mb-2">
                                    {Array.from({ length: hotel.stars }).map((_, i) => (
                                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
                                    {hotel.address}
                                </p>
                                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                                    <div>
                                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Starting at</p>
                                        <p className="font-bold text-blue-600">${hotel.minPrice}/night</p>
                                    </div>
                                    <Link
                                        href={`/hotels/${hotel.id}`}
                                        className="bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-colors"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <MapResizer hotels={hotels} />
            </MapContainer>
        </div>
    );
}
