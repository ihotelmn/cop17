import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "crypto";

// Keep a clean env snapshot so tests don't leak secrets into one another.
const ORIGINAL_ENV = { ...process.env };

function resetEnv(partial: Record<string, string | undefined>) {
    for (const k of Object.keys(process.env)) {
        if (k.startsWith("GOLOMT_")) delete process.env[k];
    }
    Object.assign(process.env, partial);
}

async function importFresh() {
    // Re-import the module so the top-level constants pick up the new env.
    vi.resetModules();
    const mod = await import("./golomt");
    return mod.GolomtService;
}

describe("GolomtService.verifyCallback — signature verification", () => {
    beforeEach(() => {
        resetEnv({
            GOLOMT_MODE: "mock",
            GOLOMT_CALLBACK_SECRET: "test-callback-secret-1234",
            GOLOMT_SECRET_TOKEN: "test-merchant-secret",
            GOLOMT_MERCHANT_ID: "TEST_MERCHANT",
            NODE_ENV: "test",
        });
    });

    afterEach(() => {
        for (const k of Object.keys(process.env)) {
            if (k.startsWith("GOLOMT_")) delete process.env[k];
        }
        Object.assign(process.env, ORIGINAL_ENV);
    });

    function signedCallback(txn: string, invoice: string, amount: number, status = "PAID") {
        const secret = process.env.GOLOMT_CALLBACK_SECRET!;
        const normalized = [txn, invoice, amount.toFixed(2), status.toUpperCase()].join("|");
        return crypto.createHmac("sha256", secret).update(normalized).digest("hex");
    }

    it("accepts a valid signature", async () => {
        const Golomt = await importFresh();
        const sig = signedCallback("txn-1", "INV-001", 100, "PAID");
        const result = await Golomt.verifyCallback(
            { transactionId: "txn-1", invoiceId: "INV-001", amount: 100, status: "PAID", signature: sig },
            { transactionId: "txn-1", invoiceId: "INV-001", amount: 100 }
        );
        expect(result.success).toBe(true);
        expect(result.status).toBe("PAID");
    });

    it("rejects a tampered amount", async () => {
        const Golomt = await importFresh();
        const sig = signedCallback("txn-2", "INV-002", 100, "PAID");
        const result = await Golomt.verifyCallback(
            { transactionId: "txn-2", invoiceId: "INV-002", amount: 50, status: "PAID", signature: sig },
            { transactionId: "txn-2", invoiceId: "INV-002", amount: 50 }
        );
        expect(result.success).toBe(false);
    });

    it("rejects a tampered status", async () => {
        const Golomt = await importFresh();
        const sig = signedCallback("txn-3", "INV-003", 200, "PAID");
        const result = await Golomt.verifyCallback(
            { transactionId: "txn-3", invoiceId: "INV-003", amount: 200, status: "FAILED", signature: sig },
            { transactionId: "txn-3", invoiceId: "INV-003", amount: 200 }
        );
        // Either the signature check fails, or the status maps to FAILED — both are non-success.
        expect(result.status).not.toBe("PAID");
    });

    it("rejects a completely wrong signature", async () => {
        const Golomt = await importFresh();
        const result = await Golomt.verifyCallback(
            { transactionId: "txn-4", invoiceId: "INV-004", amount: 75, status: "PAID", signature: "deadbeef".repeat(8) },
            { transactionId: "txn-4", invoiceId: "INV-004", amount: 75 }
        );
        expect(result.success).toBe(false);
    });

    it("rejects when expected amount does not match payload amount", async () => {
        const Golomt = await importFresh();
        const sig = signedCallback("txn-5", "INV-005", 300, "PAID");
        const result = await Golomt.verifyCallback(
            { transactionId: "txn-5", invoiceId: "INV-005", amount: 300, status: "PAID", signature: sig },
            { transactionId: "txn-5", invoiceId: "INV-005", amount: 999 }
        );
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/amount mismatch/i);
    });
});

describe("GolomtService.extractCallbackPayload", () => {
    beforeEach(() => {
        resetEnv({
            GOLOMT_MODE: "mock",
            GOLOMT_CALLBACK_SECRET: "x",
            GOLOMT_SECRET_TOKEN: "x",
            GOLOMT_MERCHANT_ID: "TEST_MERCHANT",
            NODE_ENV: "test",
        });
    });

    afterEach(() => {
        Object.assign(process.env, ORIGINAL_ENV);
    });

    it("reads modern camelCase field names", async () => {
        const Golomt = await importFresh();
        const p = Golomt.extractCallbackPayload({
            transactionId: "txn-abc",
            invoiceId: "INV-XYZ",
            amount: "42.50",
            status: "PAID",
            signature: "abc",
        });
        expect(p.transactionId).toBe("txn-abc");
        expect(p.invoiceId).toBe("INV-XYZ");
        expect(p.amount).toBe(42.5);
    });

    it("falls back to snake_case aliases (transaction_id, invoice_id)", async () => {
        const Golomt = await importFresh();
        const p = Golomt.extractCallbackPayload({
            transaction_id: "txn-xy",
            invoice_id: "INV-II",
            totalAmount: 30,
            paymentStatus: "SUCCESS",
        });
        expect(p.transactionId).toBe("txn-xy");
        expect(p.invoiceId).toBe("INV-II");
        expect(p.amount).toBe(30);
        expect(p.status).toBe("SUCCESS");
    });
});

describe("GolomtService.getMode — production safety", () => {
    afterEach(() => {
        for (const k of Object.keys(process.env)) {
            if (k.startsWith("GOLOMT_")) delete process.env[k];
        }
        Object.assign(process.env, ORIGINAL_ENV);
    });

    it("throws when production + placeholder creds (prevents silent free-booking mode)", async () => {
        resetEnv({
            GOLOMT_MERCHANT_ID: "YOUR_MERCHANT_ID",
            GOLOMT_SECRET_TOKEN: "YOUR_SECRET_TOKEN",
            NODE_ENV: "production",
        });
        const Golomt = await importFresh();
        expect(() => Golomt.getMode()).toThrow(/production|live/i);
    });

    it("permits mock mode outside production", async () => {
        resetEnv({
            GOLOMT_MODE: "mock",
            GOLOMT_CALLBACK_SECRET: "x",
            NODE_ENV: "development",
        });
        const Golomt = await importFresh();
        expect(Golomt.getMode()).toBe("mock");
    });
});
