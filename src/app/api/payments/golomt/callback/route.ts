import { NextRequest, NextResponse } from "next/server";
import { confirmBookingAction } from "@/app/actions/booking";
import { GolomtService } from "@/lib/golomt";
import {
    getPaymentAttemptByTransactionId,
    markPaymentAttemptFailed,
    markPaymentAttemptPaid,
} from "@/lib/payment-attempts";
import type { PaymentAttemptRecord } from "@/lib/payment-attempts";
import { getCanonicalUrl } from "@/lib/site-config";
import {
    ActionRateLimitError,
    buildActionRateLimitKey,
    enforceActionRateLimitSafely,
    getClientIpFromHeaders,
} from "@/lib/action-rate-limit";

function getStoredReturnUrl(paymentAttempt?: PaymentAttemptRecord | null) {
    const rawRequest = paymentAttempt?.raw_request;

    if (!(typeof rawRequest === "object" && rawRequest !== null)) {
        return null;
    }

    const returnUrl = "returnUrl" in rawRequest ? rawRequest.returnUrl : null;

    return typeof returnUrl === "string" && returnUrl.trim()
        ? returnUrl
        : null;
}

function buildSuccessUrl(
    groupId: string,
    paymentState?: string,
    paymentAttempt?: Awaited<ReturnType<typeof getPaymentAttemptByTransactionId>>
) {
    const storedReturnUrl = getStoredReturnUrl(paymentAttempt);
    const url = storedReturnUrl
        ? getCanonicalUrl(storedReturnUrl)
        : getCanonicalUrl(`/booking/success?groupId=${encodeURIComponent(groupId)}`);

    url.searchParams.set("groupId", groupId);

    if (paymentState) {
        url.searchParams.set("payment", paymentState);
    }

    return url;
}

async function parseCallbackPayload(request: NextRequest) {
    if (request.method === "GET") {
        return Object.fromEntries(request.nextUrl.searchParams.entries());
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            return await request.json() as Record<string, unknown>;
        } catch {
            return {};
        }
    }

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        return Object.fromEntries(formData.entries());
    }

    const rawText = await request.text();
    return rawText ? { raw: rawText } : {};
}

async function handleCallback(request: NextRequest) {
    // Rate-limit by client IP — bounds brute-force against our payment endpoint.
    // 30 callbacks per IP per minute is generous for legitimate browser redirects.
    try {
        const ip = getClientIpFromHeaders(request.headers);
        const key = buildActionRateLimitKey("golomt-callback", ip);
        await enforceActionRateLimitSafely(
            { scope: "golomt-callback", key, maxHits: 30, windowMs: 60 * 1000 },
            "golomt-callback"
        );
    } catch (e) {
        if (e instanceof ActionRateLimitError) {
            return NextResponse.json({ success: false, error: "Too many callback requests." }, { status: 429 });
        }
    }

    const rawPayload = await parseCallbackPayload(request);
    const callbackPayload = GolomtService.extractCallbackPayload(rawPayload);

    if (!callbackPayload.transactionId) {
        return NextResponse.json(
            { success: false, error: "Missing transactionId in payment callback." },
            { status: 400 }
        );
    }

    const groupId = callbackPayload.transactionId;
    const paymentAttempt = await getPaymentAttemptByTransactionId(callbackPayload.transactionId);

    // Always verify signature first — even for replays of an already-paid attempt.
    // The previous "skip-if-paid" shortcut let anyone with a known transactionId
    // re-trigger the booking-confirmation codepath without a signature check.
    const verification = await GolomtService.verifyCallback(callbackPayload, {
        transactionId: paymentAttempt?.transaction_id || callbackPayload.transactionId,
        invoiceId: paymentAttempt?.invoice_id || callbackPayload.invoiceId,
        amount: paymentAttempt?.amount ?? callbackPayload.amount,
    });

    // Replay of an already-paid attempt: signature must still match. If it does,
    // treat as idempotent success without re-running booking confirmation.
    if (paymentAttempt?.status === "paid") {
        if (!verification.success || verification.status !== "PAID") {
            return NextResponse.json(
                { success: false, error: "Signature verification failed on replay of paid attempt." },
                { status: 400 }
            );
        }

        if (request.method === "GET") {
            return NextResponse.redirect(buildSuccessUrl(paymentAttempt.group_id || groupId, "confirmed", paymentAttempt));
        }

        return NextResponse.json({
            success: true,
            status: "PAID",
            groupId: paymentAttempt.group_id || groupId,
            alreadyProcessed: true,
        });
    }

    if (!verification.success || verification.status !== "PAID") {
        await markPaymentAttemptFailed({
            transactionId: callbackPayload.transactionId,
            error: verification.error || `Provider returned ${verification.status}`,
            rawCallback: rawPayload,
        });

        if (request.method === "GET") {
            return NextResponse.redirect(buildSuccessUrl(groupId, "failed", paymentAttempt));
        }

        return NextResponse.json(
            { success: false, status: verification.status, error: verification.error || "Payment verification failed." },
            { status: 400 }
        );
    }

    await markPaymentAttemptPaid({
        transactionId: callbackPayload.transactionId,
        providerReference: verification.providerReference || callbackPayload.providerReference,
        rawCallback: rawPayload,
    });

    const confirmation = await confirmBookingAction(paymentAttempt?.group_id || groupId, true);

    if (!confirmation.success) {
        return NextResponse.json(
            { success: false, error: confirmation.error || "Payment verified but booking confirmation failed." },
            { status: 500 }
        );
    }

    if (request.method === "GET") {
        return NextResponse.redirect(buildSuccessUrl(paymentAttempt?.group_id || groupId, "confirmed", paymentAttempt));
    }

    return NextResponse.json({
        success: true,
        status: "PAID",
        groupId: paymentAttempt?.group_id || groupId,
    });
}

export async function GET(request: NextRequest) {
    return handleCallback(request);
}

export async function POST(request: NextRequest) {
    return handleCallback(request);
}
