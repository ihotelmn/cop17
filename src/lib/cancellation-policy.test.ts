import { describe, expect, it } from "vitest";
import { calculateBookingPolicyState, formatPolicyWindow, normalizeHotelBookingPolicy } from "./cancellation-policy";

describe("cancellation policy helpers", () => {
    it("applies free cancellation when check-in is outside the free window", () => {
        const state = calculateBookingPolicyState(
            {
                free_cancellation_window_hours: 168,
                partial_cancellation_window_hours: 48,
                partial_cancellation_penalty_percent: 50,
                late_cancellation_penalty_percent: 100,
                modification_cutoff_hours: 24,
            },
            "2026-06-20T12:00:00.000Z",
            400,
            new Date("2026-06-10T12:00:00.000Z")
        );

        expect(state.stage).toBe("free");
        expect(state.penaltyPercent).toBe(0);
        expect(state.refundAmount).toBe(400);
        expect(state.canRequestModification).toBe(true);
    });

    it("applies the configured partial penalty inside the middle window", () => {
        const state = calculateBookingPolicyState(
            {
                free_cancellation_window_hours: 168,
                partial_cancellation_window_hours: 48,
                partial_cancellation_penalty_percent: 35,
                late_cancellation_penalty_percent: 100,
                modification_cutoff_hours: 24,
            },
            "2026-06-20T12:00:00.000Z",
            400,
            new Date("2026-06-18T00:00:00.000Z")
        );

        expect(state.stage).toBe("partial");
        expect(state.penaltyPercent).toBe(35);
        expect(state.penaltyAmount).toBe(140);
        expect(state.refundAmount).toBe(260);
    });

    it("closes online modification after the cutoff and applies late penalty", () => {
        const state = calculateBookingPolicyState(
            {
                free_cancellation_window_hours: 168,
                partial_cancellation_window_hours: 48,
                partial_cancellation_penalty_percent: 50,
                late_cancellation_penalty_percent: 80,
                modification_cutoff_hours: 24,
            },
            "2026-06-20T12:00:00.000Z",
            500,
            new Date("2026-06-19T18:00:00.000Z")
        );

        expect(state.stage).toBe("late");
        expect(state.penaltyPercent).toBe(80);
        expect(state.canRequestModification).toBe(false);
    });

    it("normalizes inconsistent admin input safely", () => {
        const policy = normalizeHotelBookingPolicy({
            free_cancellation_window_hours: 24,
            partial_cancellation_window_hours: 48,
            partial_cancellation_penalty_percent: 140,
            late_cancellation_penalty_percent: -10,
        });

        expect(policy.partialCancellationWindowHours).toBe(24);
        expect(policy.partialCancellationPenaltyPercent).toBe(100);
        expect(policy.lateCancellationPenaltyPercent).toBe(0);
    });

    it("formats friendly policy windows", () => {
        expect(formatPolicyWindow(168)).toBe("7 days");
        expect(formatPolicyWindow(24)).toBe("1 day");
        expect(formatPolicyWindow(12)).toBe("12 hours");
    });
});
