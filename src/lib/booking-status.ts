export type BookingLifecycleStatus =
    | "pending"
    | "paid"
    | "confirmed"
    | "checked-in"
    | "completed"
    | "cancelled";

const ALLOWED_BOOKING_STATUS_TRANSITIONS: Record<BookingLifecycleStatus, BookingLifecycleStatus[]> = {
    pending: ["confirmed", "cancelled"],
    paid: ["confirmed", "cancelled"],
    confirmed: ["checked-in", "cancelled"],
    "checked-in": ["completed"],
    completed: [],
    cancelled: [],
};

export function normalizeBookingLifecycleStatus(value: string) {
    return value.trim().toLowerCase() as BookingLifecycleStatus;
}

export function getAllowedBookingStatusTransitions(currentStatus: string) {
    const normalized = normalizeBookingLifecycleStatus(currentStatus);
    return ALLOWED_BOOKING_STATUS_TRANSITIONS[normalized] || [];
}

export function isValidBookingStatusTransition(currentStatus: string, nextStatus: string) {
    return getAllowedBookingStatusTransitions(currentStatus).includes(
        normalizeBookingLifecycleStatus(nextStatus)
    );
}
