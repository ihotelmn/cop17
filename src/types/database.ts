export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'super_admin' | 'admin' | 'liaison' | 'vip' | 'guest'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'paid' | 'blocked'
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'
export type GroupRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type DocumentType = 'passport' | 'visa' | 'accreditation'
export type DocumentStatus = 'pending' | 'verified' | 'rejected'

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: UserRole
                    organization: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: UserRole
                    organization?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: UserRole
                    organization?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            hotels: {
                Row: {
                    id: string
                    owner_id: string | null
                    name: string
                    name_en: string | null
                    description: string | null
                    description_en: string | null
                    address: string | null
                    address_en: string | null
                    stars: number
                    amenities: string[] | null
                    images: string[] | null
                    created_at: string
                    // Enhanced features
                    latitude: number | null
                    longitude: number | null
                    hotel_type: string | null
                    contact_phone: string | null
                    contact_email: string | null
                    website: string | null
                    check_in_time: string | null
                    check_out_time: string | null
                    // Enrichment fields
                    slug: string | null
                    star_rating: number | null
                    district_id: number | null
                    // Cached distance/travel data
                    cached_distance_km: number | null
                    cached_drive_time_text: string | null
                    cached_drive_time_value: number | null
                    cached_walk_time_text: string | null
                    cached_walk_time_value: number | null
                    // Google Reviews
                    google_place_id: string | null
                    cached_rating: number | null
                    cached_review_count: number | null
                    // Flags
                    is_published: boolean
                    is_official_partner: boolean
                    is_recommended: boolean
                    has_shuttle_service: boolean
                }
            }
            rooms: {
                Row: {
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
                    size_sqm: number | null
                    bed_config: string | null
                    max_adults: number | null
                    max_children: number | null
                }
                Insert: {
                    id?: string
                    hotel_id: string
                    name: string
                    description?: string | null
                    type: string
                    price_per_night: number
                    capacity?: number
                    total_inventory?: number
                    amenities?: string[] | null
                    images?: string[] | null
                    size?: number | null
                }
            }
            bookings: {
                Row: {
                    id: string
                    user_id: string
                    room_id: string
                    check_in_date: string
                    check_out_date: string
                    status: BookingStatus
                    total_price: number
                    guest_passport_encrypted: string | null
                    guest_phone_encrypted: string | null
                    special_requests_encrypted: string | null
                    created_at: string
                    // Additional fields
                    is_vip: boolean
                    group_request_id: string | null
                    group_id: string | null
                    guest_name: string | null
                    guest_email: string | null
                    cancelled_at: string | null
                    cancellation_reason: string | null
                    cancellation_penalty_percent: number | null
                    cancellation_penalty_amount: number | null
                    modification_requested_at: string | null
                    modification_request_message: string | null
                    modification_request_status: string | null
                    modification_reviewed_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    room_id: string
                    check_in_date: string
                    check_out_date: string
                    status?: BookingStatus
                    total_price: number
                    guest_passport_encrypted?: string | null
                    guest_phone_encrypted?: string | null
                    special_requests_encrypted?: string | null
                    created_at?: string
                    is_vip?: boolean
                    group_request_id?: string | null
                    group_id?: string | null
                    guest_name?: string | null
                    guest_email?: string | null
                    cancelled_at?: string | null
                    cancellation_reason?: string | null
                    cancellation_penalty_percent?: number | null
                    cancellation_penalty_amount?: number | null
                    modification_requested_at?: string | null
                    modification_request_message?: string | null
                    modification_request_status?: string | null
                    modification_reviewed_at?: string | null
                }
            }
            audit_logs: {
                Row: {
                    id: string
                    table_name: string
                    record_id: string
                    action: AuditAction
                    old_data: Json | null
                    new_data: Json | null
                    changed_by: string | null
                    created_at: string
                }
            }
            group_requests: {
                Row: {
                    id: string
                    created_at: string
                    organization_name: string
                    contact_name: string
                    contact_email: string
                    contact_phone: string
                    guest_count: number
                    check_in_date: string
                    check_out_date: string
                    preferred_hotel: string | null
                    budget_range: string | null
                    special_requirements: string | null
                    status: GroupRequestStatus
                    assigned_liaison_id: string | null
                    notes: string | null
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    link: string | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type?: string
                    link?: string | null
                    is_read?: boolean
                    created_at?: string
                }
            }
            documents: {
                Row: {
                    id: string
                    created_at: string
                    booking_id: string | null
                    guest_id: string | null
                    type: DocumentType
                    file_path: string
                    status: DocumentStatus
                    verified_at: string | null
                    verified_by: string | null
                    notes: string | null
                }
            }
            amenities: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
            }
        }
    }
}
