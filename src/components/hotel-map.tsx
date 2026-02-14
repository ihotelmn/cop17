"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Hotel } from "@/app/actions/public";
import Link from "next/link";
import { Star, MapPin, Building2 } from "lucide-react";

// Fix for missing marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon.src,
    iconRetinaUrl: markerIcon2x.src,
    shadowUrl: markerShadow.src,
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
                    attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                />

                {hotelsWithCoords.map((hotel) => (
                    <Marker
                        key={hotel.id}
                        position={[hotel.latitude!, hotel.longitude!]}
                        icon={L.divIcon({
                            className: "bg-transparent",
                            html: `<div class="bg-white text-zinc-900 font-bold px-3 py-1.5 rounded-full shadow-md border-2 border-white hover:border-zinc-900 hover:z-50 transition-all text-sm whitespace-nowrap flex items-center gap-1">
                                      $${hotel.minPrice}
                                   </div>`,
                            iconSize: [60, 30], // Approximate size
                            iconAnchor: [30, 15] // Center
                        })}
                    >
                        <Popup className="hotel-popup" offset={[0, -10]}>
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
                                {hotel.distanceToVenue != null && (
                                    <div className="mt-2 text-xs text-center bg-blue-50 text-blue-700 py-1 rounded font-medium border border-blue-100">
                                        {hotel.distanceToVenue} km to Venue
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <MapResizer hotels={hotels} />
            </MapContainer>
        </div>
    );
}
