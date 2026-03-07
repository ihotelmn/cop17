export interface HotelBookingPolicyInput {
    free_cancellation_window_hours?: number | null;
    partial_cancellation_window_hours?: number | null;
    partial_cancellation_penalty_percent?: number | null;
    late_cancellation_penalty_percent?: number | null;
    modification_cutoff_hours?: number | null;
    cancellation_policy_notes?: string | null;
}

export interface HotelBookingPolicy {
    freeCancellationWindowHours: number;
    partialCancellationWindowHours: number;
    partialCancellationPenaltyPercent: number;
    lateCancellationPenaltyPercent: number;
    modificationCutoffHours: number;
    cancellationPolicyNotes: string | null;
}

export const DEFAULT_HOTEL_BOOKING_POLICY: HotelBookingPolicy = {
    freeCancellationWindowHours: 168,
    partialCancellationWindowHours: 48,
    partialCancellationPenaltyPercent: 50,
    lateCancellationPenaltyPercent: 100,
    modificationCutoffHours: 24,
    cancellationPolicyNotes: null,
};

function normalizeWholeNumber(value: number | null | undefined, fallback: number) {
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
        return fallback;
    }

    return Math.floor(value);
}

function clampPercent(value: number | null | undefined, fallback: number) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return fallback;
    }

    return Math.max(0, Math.min(100, Math.round(value)));
}

function roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
}

function resolveCheckInDateTime(checkInDate: string | Date, checkInTime?: string | null) {
    const resolvedDate = checkInDate instanceof Date ? new Date(checkInDate) : new Date(checkInDate);

    if (!checkInTime) {
        return resolvedDate;
    }

    const [hours, minutes] = checkInTime.split(":").map(Number);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return resolvedDate;
    }

    const withTime = new Date(resolvedDate);
    withTime.setHours(hours, minutes, 0, 0);
    return withTime;
}

export function normalizeHotelBookingPolicy(input?: HotelBookingPolicyInput | null): HotelBookingPolicy {
    const freeCancellationWindowHours = normalizeWholeNumber(
        input?.free_cancellation_window_hours,
        DEFAULT_HOTEL_BOOKING_POLICY.freeCancellationWindowHours
    );

    const partialCancellationWindowHours = Math.min(
        freeCancellationWindowHours,
        normalizeWholeNumber(
            input?.partial_cancellation_window_hours,
            DEFAULT_HOTEL_BOOKING_POLICY.partialCancellationWindowHours
        )
    );

    return {
        freeCancellationWindowHours,
        partialCancellationWindowHours,
        partialCancellationPenaltyPercent: clampPercent(
            input?.partial_cancellation_penalty_percent,
            DEFAULT_HOTEL_BOOKING_POLICY.partialCancellationPenaltyPercent
        ),
        lateCancellationPenaltyPercent: clampPercent(
            input?.late_cancellation_penalty_percent,
            DEFAULT_HOTEL_BOOKING_POLICY.lateCancellationPenaltyPercent
        ),
        modificationCutoffHours: normalizeWholeNumber(
            input?.modification_cutoff_hours,
            DEFAULT_HOTEL_BOOKING_POLICY.modificationCutoffHours
        ),
        cancellationPolicyNotes: input?.cancellation_policy_notes?.trim() || null,
    };
}

export function formatPolicyWindow(hours: number) {
    if (hours === 0) {
        return "any time before check-in";
    }

    if (hours % 24 === 0) {
        const days = hours / 24;
        return `${days} day${days === 1 ? "" : "s"}`;
    }

    return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function calculateBookingPolicyState(
    policyInput: HotelBookingPolicyInput | null | undefined,
    checkInDate: string | Date,
    totalPrice: number,
    now: Date = new Date(),
    checkInTime?: string | null
) {
    const policy = normalizeHotelBookingPolicy(policyInput);
    const checkIn = resolveCheckInDateTime(checkInDate, checkInTime);
    const msUntilCheckIn = checkIn.getTime() - now.getTime();
    const hoursUntilCheckIn = msUntilCheckIn / (1000 * 60 * 60);
    const hasStayStarted = msUntilCheckIn <= 0;

    let stage: "free" | "partial" | "late" | "closed" = "late";
    let penaltyPercent = policy.lateCancellationPenaltyPercent;

    if (hasStayStarted) {
        stage = "closed";
        penaltyPercent = 100;
    } else if (hoursUntilCheckIn >= policy.freeCancellationWindowHours) {
        stage = "free";
        penaltyPercent = 0;
    } else if (hoursUntilCheckIn >= policy.partialCancellationWindowHours) {
        stage = "partial";
        penaltyPercent = policy.partialCancellationPenaltyPercent;
    }

    const normalizedTotalPrice = Number.isFinite(totalPrice) ? totalPrice : 0;
    const penaltyAmount = roundCurrency((normalizedTotalPrice * penaltyPercent) / 100);
    const refundAmount = roundCurrency(Math.max(0, normalizedTotalPrice - penaltyAmount));

    return {
        policy,
        stage,
        hoursUntilCheckIn,
        canCancelOnline: !hasStayStarted,
        canRequestModification: !hasStayStarted && hoursUntilCheckIn >= policy.modificationCutoffHours,
        penaltyPercent,
        penaltyAmount,
        refundAmount,
        freeCancellationDeadline: new Date(checkIn.getTime() - policy.freeCancellationWindowHours * 60 * 60 * 1000),
        partialCancellationDeadline: new Date(checkIn.getTime() - policy.partialCancellationWindowHours * 60 * 60 * 1000),
        modificationDeadline: new Date(checkIn.getTime() - policy.modificationCutoffHours * 60 * 60 * 1000),
    };
}
