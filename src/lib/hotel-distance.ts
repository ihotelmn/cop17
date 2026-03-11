import type { Hotel } from "@/types/hotel";
import { calculateDistance, COP17_VENUE, estimateTravelTime } from "@/lib/venue";

type DistanceHotel = Pick<Hotel, "cached_distance_km" | "distanceToVenue" | "latitude" | "longitude">;

export function getHotelDisplayDistance(hotel: DistanceHotel) {
    if (hotel.cached_distance_km != null) return Number(hotel.cached_distance_km);
    if (hotel.distanceToVenue != null) return Number(hotel.distanceToVenue);

    if (hotel.latitude == null || hotel.longitude == null) {
        return null;
    }

    return calculateDistance(
        Number(hotel.latitude),
        Number(hotel.longitude),
        COP17_VENUE.latitude,
        COP17_VENUE.longitude
    );
}

export function getHotelDisplayDriveTime(hotel: DistanceHotel, cachedDriveTimeText?: string | null) {
    if (cachedDriveTimeText) return cachedDriveTimeText;

    const distance = getHotelDisplayDistance(hotel);
    if (distance == null) return null;

    return `~${estimateTravelTime(distance, "driving")}`;
}
