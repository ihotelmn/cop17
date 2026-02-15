export const COP17_VENUE = {
    name: "UG Arena (Main Convention Center)",
    latitude: 47.9044,
    longitude: 106.8837,
    address: "Dundgol Street, Ulaanbaatar"
};

// Haversine formula to calculate distance in km
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Number(d.toFixed(1));
}

// Simple travel time estimation based on distance
export function estimateTravelTime(distanceKm: number, mode: 'walking' | 'driving' = 'driving'): string {
    if (mode === 'walking') {
        const mins = Math.round(distanceKm * 12); // ~5km/h
        return `${mins} min walk`;
    } else {
        // Average city speed 30km/h including traffic
        const mins = Math.max(2, Math.round(distanceKm * 4));
        return `${mins} min drive`;
    }
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}
