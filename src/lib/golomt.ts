import crypto from "crypto";
import { normalizeEnvValue } from "@/lib/env";
import { getCanonicalUrl } from "@/lib/site-config";

type GolomtMode = "mock" | "live";
type NormalizedPaymentStatus = "PAID" | "PENDING" | "FAILED" | "NOT_FOUND";

export interface CreateInvoiceRequest {
    transactionId: string;
    amount: number;
    returnUrl: string;
    appBaseUrl?: string;
}

export interface CreateInvoiceResponse {
    success: boolean;
    invoiceId?: string;
    redirectUrl?: string;
    callbackUrl?: string;
    error?: string;
    checksum?: string;
    transactionId?: string;
    mode?: GolomtMode;
}

export interface CheckStatusResponse {
    success: boolean;
    status: NormalizedPaymentStatus;
    amount?: number;
    error?: string;
}

export interface GolomtCallbackPayload {
    transactionId?: string;
    invoiceId?: string;
    amount?: number;
    status?: string;
    signature?: string;
    checksum?: string;
    providerReference?: string;
    raw?: Record<string, unknown>;
}

interface VerifyCallbackResult {
    success: boolean;
    status: NormalizedPaymentStatus;
    transactionId?: string;
    invoiceId?: string;
    amount?: number;
    providerReference?: string;
    error?: string;
}

const GOLOMT_ENDPOINT = normalizeEnvValue(process.env.GOLOMT_ENDPOINT);
const GOLOMT_CHECKOUT_URL = normalizeEnvValue(process.env.GOLOMT_CHECKOUT_URL) || GOLOMT_ENDPOINT;
const GOLOMT_STATUS_URL = normalizeEnvValue(process.env.GOLOMT_STATUS_URL);
const MERCHANT_ID = normalizeEnvValue(process.env.GOLOMT_MERCHANT_ID);
const SECRET_KEY = normalizeEnvValue(process.env.GOLOMT_SECRET_TOKEN);
const CALLBACK_SECRET = normalizeEnvValue(process.env.GOLOMT_CALLBACK_SECRET) || SECRET_KEY;

function isPlaceholder(value?: string) {
    return !value || value.startsWith("YOUR_") || value.startsWith("TEST_");
}

function requireCallbackSecret(): string {
    if (!CALLBACK_SECRET) {
        throw new Error(
            "GOLOMT_CALLBACK_SECRET (or GOLOMT_SECRET_TOKEN) is required for payment signature verification."
        );
    }
    return CALLBACK_SECRET;
}

function getMode(): GolomtMode {
    const envMode = normalizeEnvValue(process.env.GOLOMT_MODE)?.toLowerCase();
    if (envMode === "live") return "live";
    if (envMode === "mock") {
        // Explicit mock is only permitted outside production. Prevents a misconfigured
        // prod deploy from silently serving free bookings via /mock-payment.
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                "GOLOMT_MODE=mock is not permitted in production. Set GOLOMT_MODE=live with real Golomt credentials."
            );
        }
        return "mock";
    }

    // Auto-detect: live only when all creds are real and non-placeholder; otherwise mock.
    const autoLive =
        !isPlaceholder(MERCHANT_ID) &&
        !isPlaceholder(SECRET_KEY) &&
        Boolean(GOLOMT_CHECKOUT_URL);

    if (autoLive) return "live";

    if (process.env.NODE_ENV === "production") {
        throw new Error(
            "Golomt credentials missing in production. Set GOLOMT_MODE=live, GOLOMT_MERCHANT_ID, GOLOMT_SECRET_TOKEN, GOLOMT_CALLBACK_SECRET, and GOLOMT_CHECKOUT_URL."
        );
    }
    return "mock";
}

function getAppBaseUrl(override?: string | null) {
    return getCanonicalUrl(override || undefined).toString().replace(/\/$/, "");
}

function normalizeAmount(amount: number) {
    return amount.toFixed(2);
}

function buildChecksum(transactionId: string, amount: string) {
    const data = `${transactionId}${amount}${SECRET_KEY || ""}`;
    return crypto.createHash("sha256").update(data).digest("hex");
}

function buildCallbackSignature(params: {
    transactionId: string;
    invoiceId: string;
    amount: number;
    status: string;
}) {
    const signer = crypto.createHmac("sha256", requireCallbackSecret());
    const normalized = [
        params.transactionId,
        params.invoiceId,
        normalizeAmount(params.amount),
        params.status.toUpperCase(),
    ].join("|");

    return signer.update(normalized).digest("hex");
}

function verifyCallbackSignature(params: {
    transactionId: string;
    invoiceId: string;
    amount: number;
    status: string;
    signature: string;
}) {
    const expected = buildCallbackSignature(params);
    const provided = params.signature.toLowerCase();

    if (expected.length !== provided.length) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function buildInvoiceId(transactionId: string) {
    return `INV-${transactionId.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
}

function buildCallbackUrl(params: {
    transactionId: string;
    invoiceId: string;
    amount: number;
    status?: string;
    appBaseUrl?: string;
}) {
    const status = (params.status || "PAID").toUpperCase();
    const signature = buildCallbackSignature({
        transactionId: params.transactionId,
        invoiceId: params.invoiceId,
        amount: params.amount,
        status,
    });
    const callbackParams = new URLSearchParams({
        transactionId: params.transactionId,
        invoiceId: params.invoiceId,
        amount: normalizeAmount(params.amount),
        status,
        signature,
    });

    return `${getAppBaseUrl(params.appBaseUrl)}/api/payments/golomt/callback?${callbackParams.toString()}`;
}

function normalizeProviderStatus(value?: string | null): NormalizedPaymentStatus {
    const normalized = String(value || "").trim().toUpperCase();

    if (["PAID", "SUCCESS", "COMPLETED", "APPROVED"].includes(normalized)) {
        return "PAID";
    }

    if (["FAILED", "DECLINED", "ERROR", "CANCELLED"].includes(normalized)) {
        return "FAILED";
    }

    if (["NOT_FOUND", "NOTFOUND"].includes(normalized)) {
        return "NOT_FOUND";
    }

    return "PENDING";
}

export const GolomtService = {
    getMode,
    getAppBaseUrl,
    generateChecksum: buildChecksum,
    buildCallbackUrl,

    createInvoice: async (req: CreateInvoiceRequest): Promise<CreateInvoiceResponse> => {
        const mode = getMode();
        const appBaseUrl = getAppBaseUrl(req.appBaseUrl);
        const invoiceId = buildInvoiceId(req.transactionId);
        const checksum = buildChecksum(req.transactionId, normalizeAmount(req.amount));
        const callbackUrl = buildCallbackUrl({
            transactionId: req.transactionId,
            invoiceId,
            amount: req.amount,
            status: "PAID",
            appBaseUrl,
        });

        if (mode === "live" && GOLOMT_CHECKOUT_URL && MERCHANT_ID && SECRET_KEY) {
            const params = new URLSearchParams({
                merchantId: MERCHANT_ID,
                transactionId: req.transactionId,
                invoiceId,
                amount: normalizeAmount(req.amount),
                returnUrl: `${appBaseUrl}${req.returnUrl}`,
                callbackUrl,
                checksum,
            });

            return {
                success: true,
                invoiceId,
                transactionId: req.transactionId,
                checksum,
                callbackUrl,
                mode,
                redirectUrl: `${GOLOMT_CHECKOUT_URL}?${params.toString()}`,
            };
        }

        const mockRedirectParams = new URLSearchParams({
            invoiceId,
            amount: normalizeAmount(req.amount),
            txnId: req.transactionId,
            callbackUrl,
            returnUrl: `${appBaseUrl}${req.returnUrl}`,
        });

        return {
            success: true,
            invoiceId,
            transactionId: req.transactionId,
            checksum,
            callbackUrl,
            mode: "mock",
            redirectUrl: `/mock-payment?${mockRedirectParams.toString()}`,
        };
    },

    checkPaymentStatus: async (
        transactionId: string,
        invoiceId: string,
        amount?: number
    ): Promise<CheckStatusResponse> => {
        if (getMode() === "mock") {
            return {
                success: true,
                status: "PAID",
                amount,
            };
        }

        if (!GOLOMT_STATUS_URL || !MERCHANT_ID || !SECRET_KEY) {
            return {
                success: false,
                status: "PENDING",
                error: "Golomt status verification endpoint is not configured.",
            };
        }

        try {
            const body = {
                merchantId: MERCHANT_ID,
                transactionId,
                invoiceId,
                amount: typeof amount === "number" ? normalizeAmount(amount) : undefined,
                checksum: buildChecksum(transactionId, normalizeAmount(amount || 0)),
            };

            const response = await fetch(GOLOMT_STATUS_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                cache: "no-store",
            });

            if (!response.ok) {
                return {
                    success: false,
                    status: "PENDING",
                    error: `Golomt status endpoint returned ${response.status}`,
                };
            }

            const payload = await response.json() as Record<string, unknown>;
            return {
                success: true,
                status: normalizeProviderStatus(String(payload.status || payload.paymentStatus || "")),
                amount: typeof payload.amount === "number" ? payload.amount : amount,
            };
        } catch (error) {
            return {
                success: false,
                status: "PENDING",
                error: error instanceof Error ? error.message : "Unknown Golomt status verification error",
            };
        }
    },

    extractCallbackPayload: (input: Record<string, unknown>): GolomtCallbackPayload => {
        const amountValue = input.amount ?? input.paymentAmount ?? input.totalAmount;

        return {
            transactionId: typeof input.transactionId === "string"
                ? input.transactionId
                : typeof input.txnId === "string"
                    ? input.txnId
                    : typeof input.transaction_id === "string"
                        ? input.transaction_id
                        : undefined,
            invoiceId: typeof input.invoiceId === "string"
                ? input.invoiceId
                : typeof input.invoice_id === "string"
                    ? input.invoice_id
                    : undefined,
            amount: typeof amountValue === "number"
                ? amountValue
                : typeof amountValue === "string" && amountValue.trim()
                    ? Number(amountValue)
                    : undefined,
            status: typeof input.status === "string"
                ? input.status
                : typeof input.paymentStatus === "string"
                    ? input.paymentStatus
                    : typeof input.result === "string"
                        ? input.result
                        : undefined,
            signature: typeof input.signature === "string" ? input.signature : undefined,
            checksum: typeof input.checksum === "string" ? input.checksum : undefined,
            providerReference: typeof input.providerReference === "string"
                ? input.providerReference
                : typeof input.reference === "string"
                    ? input.reference
                    : undefined,
            raw: input,
        };
    },

    verifyCallback: async (
        payload: GolomtCallbackPayload,
        expected?: {
            transactionId?: string;
            invoiceId?: string | null;
            amount?: number;
        }
    ): Promise<VerifyCallbackResult> => {
        const transactionId = payload.transactionId || expected?.transactionId;
        const invoiceId = payload.invoiceId || expected?.invoiceId || undefined;
        const amount = typeof payload.amount === "number" && Number.isFinite(payload.amount)
            ? payload.amount
            : expected?.amount;
        const status = normalizeProviderStatus(payload.status);

        if (!transactionId) {
            return {
                success: false,
                status: "FAILED",
                error: "Missing transactionId in callback payload.",
            };
        }

        if (!invoiceId) {
            return {
                success: false,
                status: "FAILED",
                error: "Missing invoiceId in callback payload.",
            };
        }

        if (typeof amount !== "number" || !Number.isFinite(amount)) {
            return {
                success: false,
                status: "FAILED",
                error: "Missing or invalid amount in callback payload.",
            };
        }

        if (expected?.amount != null && Number(expected.amount) !== Number(amount)) {
            return {
                success: false,
                status: "FAILED",
                error: "Payment amount mismatch detected during callback verification.",
            };
        }

        if (payload.signature) {
            const verified = verifyCallbackSignature({
                transactionId,
                invoiceId,
                amount,
                status,
                signature: payload.signature,
            });

            if (!verified) {
                return {
                    success: false,
                    status: "FAILED",
                    error: "Invalid signed callback payload.",
                };
            }

            return {
                success: true,
                status,
                transactionId,
                invoiceId,
                amount,
                providerReference: payload.providerReference,
            };
        }

        if (payload.checksum) {
            const expectedChecksum = buildChecksum(transactionId, normalizeAmount(amount));
            const providedChecksum = payload.checksum.toLowerCase();
            const matches = expectedChecksum.length === providedChecksum.length &&
                crypto.timingSafeEqual(Buffer.from(expectedChecksum), Buffer.from(providedChecksum));

            if (!matches) {
                return {
                    success: false,
                    status: "FAILED",
                    error: "Golomt checksum verification failed.",
                };
            }

            const verifiedStatus = await GolomtService.checkPaymentStatus(transactionId, invoiceId, amount);
            return {
                success: verifiedStatus.success && verifiedStatus.status === "PAID",
                status: verifiedStatus.status,
                transactionId,
                invoiceId,
                amount,
                providerReference: payload.providerReference,
                error: verifiedStatus.error,
            };
        }

        return {
            success: false,
            status: "FAILED",
            error: "No trusted signature or checksum was provided by the payment callback.",
        };
    },
};
