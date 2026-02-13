"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icon issue
const icon = L.icon({
    iconUrl: "/images/marker-icon.png",
    shadowUrl: "/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Helper to handle clicks
function LocationMarker({ value, onChange }: { value: { lat: number; lng: number } | null | undefined, onChange: (val: { lat: number; lng: number }) => void }) {
    const map = useMapEvents({
        click(e: L.LeafletMouseEvent) {
            onChange(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return (value && value.lat && value.lng) ? (
        <Marker position={value}></Marker>
    ) : null;
}

interface MapPickerProps {
    value?: { lat: number; lng: number } | null;
    onChange: (value: { lat: number; lng: number }) => void;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
    // Default center: Ulaanbaatar
    const defaultCenter = { lat: 47.9188, lng: 106.9176 };

    // Fix icons on mount
    useEffect(() => {
        // We can't easily rely on require in client components for some bundlers, 
        // but since we are in a client component, we can try to fix the default icon prototype once.
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });
    }, []);

    return (
        <MapContainer
            center={value || defaultCenter}
            zoom={13}
            scrollWheelZoom={false}
            className="h-full w-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker value={value} onChange={onChange} />
        </MapContainer>
    );
}
