"use client";

import { DEFAULT_HOTEL_BOOKING_POLICY } from "@/lib/cancellation-policy";
import type { Hotel } from "@/types/hotel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function HotelPolicyFields({ hotel }: { hotel?: Partial<Hotel> }) {
    return (
        <section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
            <div>
                <h3 className="text-lg font-semibold text-white">Guest Policy</h3>
                <p className="mt-1 text-sm text-zinc-400">
                    Define when guests can cancel for free, when a penalty applies, and until when they can request changes.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="free_cancellation_window_hours" className="text-zinc-300">
                        Free Cancellation Until
                    </Label>
                    <Input
                        id="free_cancellation_window_hours"
                        name="free_cancellation_window_hours"
                        type="number"
                        min="0"
                        defaultValue={hotel?.free_cancellation_window_hours ?? DEFAULT_HOTEL_BOOKING_POLICY.freeCancellationWindowHours}
                        className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <p className="text-xs text-zinc-500">Hours before check-in for a full refund. Example: `168` = 7 days.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="partial_cancellation_window_hours" className="text-zinc-300">
                        Standard Penalty Window Until
                    </Label>
                    <Input
                        id="partial_cancellation_window_hours"
                        name="partial_cancellation_window_hours"
                        type="number"
                        min="0"
                        defaultValue={hotel?.partial_cancellation_window_hours ?? DEFAULT_HOTEL_BOOKING_POLICY.partialCancellationWindowHours}
                        className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <p className="text-xs text-zinc-500">Hours before check-in where the standard penalty still applies. Example: `48`.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="partial_cancellation_penalty_percent" className="text-zinc-300">
                        Standard Penalty
                    </Label>
                    <Input
                        id="partial_cancellation_penalty_percent"
                        name="partial_cancellation_penalty_percent"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={hotel?.partial_cancellation_penalty_percent ?? DEFAULT_HOTEL_BOOKING_POLICY.partialCancellationPenaltyPercent}
                        className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <p className="text-xs text-zinc-500">Penalty percentage charged between the free and late windows.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="late_cancellation_penalty_percent" className="text-zinc-300">
                        Late Cancellation Penalty
                    </Label>
                    <Input
                        id="late_cancellation_penalty_percent"
                        name="late_cancellation_penalty_percent"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={hotel?.late_cancellation_penalty_percent ?? DEFAULT_HOTEL_BOOKING_POLICY.lateCancellationPenaltyPercent}
                        className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <p className="text-xs text-zinc-500">Penalty percentage charged inside the final cutoff window.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="modification_cutoff_hours" className="text-zinc-300">
                        Modification Requests Allowed Until
                    </Label>
                    <Input
                        id="modification_cutoff_hours"
                        name="modification_cutoff_hours"
                        type="number"
                        min="0"
                        defaultValue={hotel?.modification_cutoff_hours ?? DEFAULT_HOTEL_BOOKING_POLICY.modificationCutoffHours}
                        className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <p className="text-xs text-zinc-500">Hours before check-in after which online change requests are disabled.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cancellation_policy_notes" className="text-zinc-300">
                        Policy Notes
                    </Label>
                    <Textarea
                        id="cancellation_policy_notes"
                        name="cancellation_policy_notes"
                        defaultValue={hotel?.cancellation_policy_notes || ""}
                        placeholder="Optional notes shown to guests, e.g. refunds are processed within 7 business days."
                        className="min-h-[96px] border-zinc-700 bg-zinc-800 text-white"
                    />
                </div>
            </div>
        </section>
    );
}
