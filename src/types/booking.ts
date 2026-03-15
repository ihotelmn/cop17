/**
 * Shared Booking types used across the application.
 * Single source of truth — do not duplicate in individual action files.
 */

import type { BookingStatus } from './database'

export interface BookingState {
    error?: string
    success?: boolean
    message?: string
    paymentRedirectUrl?: string
    fieldErrors?: {
        [key: string]: string[] | undefined
    }
}

/** Admin view of a booking with joined hotel/room/guest data */
export interface BookingAdmin {
    id: string
    guestName: string
    hotelName: string
    roomName: string
    dates: string
    status: string
    amount: number
    checkIn: string
    checkOut: string
    rawStatus: string
    createdAt: string
    cancellationReason?: string | null
    cancelledAt?: string | null
    modificationRequestedAt?: string | null
    modificationRequestMessage?: string | null
    modificationRequestStatus?: string | null
}

export interface BookingFilters {
    status?: string
    hotelId?: string
    search?: string
}

export interface BookingDetail {
    id: string
    user_id: string
    room_id: string
    check_in_date: string
    check_out_date: string
    status: BookingStatus
    total_price: number
    guest_name: string | null
    guest_email: string | null
    created_at: string
    is_vip: boolean
    group_id: string | null
    group_request_id: string | null
    // Joined
    hotel_name?: string
    room_name?: string
    room_type?: string
    hotel_address?: string
}
