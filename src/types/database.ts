export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: 'admin' | 'vip' | 'guest'
                    organization: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: 'admin' | 'vip' | 'guest'
                    organization?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: 'admin' | 'vip' | 'guest'
                    organization?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            hotels: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    address: string | null
                    stars: number
                    amenities: string[] | null
                    images: string[] | null
                    created_at: string
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
                    amenities: string[] | null
                    images: string[] | null
                    available_count: number
                    created_at: string
                }
            }
            bookings: {
                Row: {
                    id: string
                    user_id: string
                    room_id: string
                    check_in_date: string
                    check_out_date: string
                    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    total_price: number
                    guest_passport_encrypted: string | null
                    guest_phone_encrypted: string | null
                    special_requests_encrypted: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    room_id: string
                    check_in_date: string
                    check_out_date: string
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    total_price: number
                    guest_passport_encrypted?: string | null
                    guest_phone_encrypted?: string | null
                    special_requests_encrypted?: string | null
                    created_at?: string
                }
            }
            audit_logs: {
                Row: {
                    id: string
                    table_name: string
                    record_id: string
                    action: 'INSERT' | 'UPDATE' | 'DELETE'
                    old_data: Json | null
                    new_data: Json | null
                    changed_by: string | null
                    created_at: string
                }
            }
        }
    }
}
