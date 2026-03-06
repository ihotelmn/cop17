/**
 * Shared Hotel & Room types used across the application.
 * Single source of truth — do not duplicate in individual action files.
 */

export interface Hotel {
    id: string
    name: string
    description: string | null
    address: string | null
    stars: number
    amenities: string[] | null
    images: string[] | null
    created_at: string
    // Location
    latitude?: number | null
    longitude?: number | null
    // Details
    hotel_type?: string | null
    contact_phone?: string | null
    contact_email?: string | null
    website?: string | null
    check_in_time?: string | null
    check_out_time?: string | null
    // Enrichment
    slug?: string | null
    star_rating?: number | null
    // Distance & Travel
    cached_distance_km?: number | null
    cached_drive_time_text?: string | null
    cached_drive_time_value?: number | null
    cached_walk_time_text?: string | null
    cached_walk_time_value?: number | null
    // Google Reviews
    google_place_id?: string | null
    cached_rating?: number | null
    cached_review_count?: number | null
    // Flags
    is_published?: boolean
    is_official_partner?: boolean
    is_recommended?: boolean
    has_shuttle_service?: boolean
    // Ownership
    owner_id?: string | null
    // Temporary/Computed for FE
    distanceToVenue?: number | null
}

export interface Room {
    id: string
    hotel_id: string
    name: string
    description: string | null
    type: string
    price_per_night: number
    capacity: number
    total_inventory: number
    amenities: string[] | null
    images: string[] | null
    size: number | null
    created_at: string
    // Enrichment
    size_sqm?: number | null
    bed_config?: string | null
    max_adults?: number | null
    max_children?: number | null
}

export interface HotelSearchParams {
    query?: string
    stars?: string
    amenities?: string
    sortBy?: string
    minPrice?: string
    maxPrice?: string
    adults?: string
    children?: string
    rooms?: string
    from?: string
    to?: string
}

/** Hotel with computed fields for public listing */
export interface HotelWithDistance extends Hotel {
    min_price?: number | null
    room_count?: number
    distance_km?: number
}
