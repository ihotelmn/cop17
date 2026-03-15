import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type PaymentAttemptStatus =
    | "pending"
    | "redirected"
    | "paid"
    | "failed"
    | "cancelled";

export interface PaymentAttemptRecord {
    id: string;
    group_id: string;
    provider: string;
    transaction_id: string;
    invoice_id: string | null;
    amount: number;
    currency: string;
    status: PaymentAttemptStatus;
    redirect_url: string | null;
    callback_signature: string | null;
    provider_reference: string | null;
    verification_error: string | null;
    raw_request: unknown;
    raw_callback: unknown;
    last_verified_at: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
}

function isMissingPaymentAttemptsTable(error: unknown) {
    if (!(typeof error === "object" && error !== null)) {
        return false;
    }

    const code = "code" in error ? (error as { code?: unknown }).code : undefined;
    const message = "message" in error ? (error as { message?: unknown }).message : undefined;

    return code === "42P01" || (typeof message === "string" && message.includes("payment_attempts"));
}

function logTableUnavailable(error: unknown) {
    if (isMissingPaymentAttemptsTable(error)) {
        console.warn("payment_attempts table is not available yet. Falling back to booking-only payment flow.");
        return;
    }

    console.error("Payment attempts operation failed:", error);
}

export async function createPaymentAttempt(input: {
    groupId: string;
    transactionId: string;
    invoiceId: string;
    amount: number;
    redirectUrl: string;
    callbackSignature?: string | null;
    rawRequest?: unknown;
}) {
    const adminSupabase = getSupabaseAdmin();
    const { data, error } = await adminSupabase
        .from("payment_attempts")
        .insert({
            group_id: input.groupId,
            provider: "golomt",
            transaction_id: input.transactionId,
            invoice_id: input.invoiceId,
            amount: input.amount,
            currency: "USD",
            status: "pending",
            redirect_url: input.redirectUrl,
            callback_signature: input.callbackSignature ?? null,
            raw_request: input.rawRequest ?? null,
        })
        .select("*")
        .maybeSingle();

    if (error) {
        logTableUnavailable(error);
        return null;
    }

    return data as PaymentAttemptRecord | null;
}

export async function getPaymentAttemptByTransactionId(transactionId: string) {
    const adminSupabase = getSupabaseAdmin();
    const { data, error } = await adminSupabase
        .from("payment_attempts")
        .select("*")
        .eq("provider", "golomt")
        .eq("transaction_id", transactionId)
        .maybeSingle();

    if (error) {
        logTableUnavailable(error);
        return null;
    }

    return data as PaymentAttemptRecord | null;
}

export async function getPaymentAttemptByGroupId(groupId: string) {
    const adminSupabase = getSupabaseAdmin();
    const { data, error } = await adminSupabase
        .from("payment_attempts")
        .select("*")
        .eq("provider", "golomt")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        logTableUnavailable(error);
        return null;
    }

    return data as PaymentAttemptRecord | null;
}

export async function updatePaymentAttempt(
    transactionId: string,
    updates: Record<string, unknown>
) {
    const adminSupabase = getSupabaseAdmin();
    const { data, error } = await adminSupabase
        .from("payment_attempts")
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq("provider", "golomt")
        .eq("transaction_id", transactionId)
        .select("*")
        .maybeSingle();

    if (error) {
        logTableUnavailable(error);
        return null;
    }

    return data as PaymentAttemptRecord | null;
}

export async function markPaymentAttemptPaid(input: {
    transactionId: string;
    providerReference?: string | null;
    rawCallback?: unknown;
}) {
    return updatePaymentAttempt(input.transactionId, {
        status: "paid",
        provider_reference: input.providerReference ?? null,
        raw_callback: input.rawCallback ?? null,
        paid_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
        verification_error: null,
    });
}

export async function markPaymentAttemptFailed(input: {
    transactionId: string;
    error: string;
    rawCallback?: unknown;
}) {
    return updatePaymentAttempt(input.transactionId, {
        status: "failed",
        raw_callback: input.rawCallback ?? null,
        last_verified_at: new Date().toISOString(),
        verification_error: input.error,
    });
}
