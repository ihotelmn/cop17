import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Chainable Supabase-like mock. Every method returns `this` so any order of
 * `.from().insert().select().maybeSingle()`, `.update().eq().eq().select().maybeSingle()`,
 * `.select().eq().eq().order().limit().maybeSingle()` resolves correctly.
 */
function makeChain(result: { data: unknown; error: unknown }) {
    const chain: any = {};
    const methods = ["select", "insert", "update", "delete", "eq", "order", "limit", "in"];
    for (const m of methods) chain[m] = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(() => Promise.resolve(result));
    chain.single = vi.fn(() => Promise.resolve(result));
    chain.then = undefined;
    return chain;
}

function makeClient(result: { data: unknown; error: unknown }) {
    const from = vi.fn(() => makeChain(result));
    return { from };
}

let currentResult: { data: unknown; error: unknown } = { data: null, error: null };
const sharedClient = {
    from: vi.fn((..._args: unknown[]) => makeChain(currentResult)),
};

vi.mock("@/lib/supabase/admin", () => ({
    getSupabaseAdmin: vi.fn(() => sharedClient),
}));

async function freshModule() {
    vi.resetModules();
    return await import("./payment-attempts");
}

describe("payment-attempts — happy path", () => {
    beforeEach(() => {
        currentResult = { data: null, error: null };
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetModules();
    });

    it("createPaymentAttempt returns the inserted record", async () => {
        currentResult = { data: { id: "pa-1", transaction_id: "tx-1" }, error: null };
        const mod = await freshModule();
        const result = await mod.createPaymentAttempt({
            groupId: "g1",
            transactionId: "tx-1",
            invoiceId: "INV-1",
            amount: 100,
            redirectUrl: "/mock",
        });
        expect(result).toEqual({ id: "pa-1", transaction_id: "tx-1" });
    });

    it("getPaymentAttemptByTransactionId returns the row", async () => {
        currentResult = { data: { id: "pa-2", transaction_id: "tx-2" }, error: null };
        const mod = await freshModule();
        const r = await mod.getPaymentAttemptByTransactionId("tx-2");
        expect(r).toEqual({ id: "pa-2", transaction_id: "tx-2" });
    });
});

describe("payment-attempts — resilient to missing table (42P01)", () => {
    const tableMissing = { data: null, error: { code: "42P01", message: 'relation "payment_attempts" does not exist' } };

    beforeEach(() => {
        currentResult = tableMissing;
        vi.clearAllMocks();
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it("createPaymentAttempt returns null without throwing", async () => {
        const mod = await freshModule();
        const r = await mod.createPaymentAttempt({
            groupId: "g1",
            transactionId: "tx-1",
            invoiceId: "INV-1",
            amount: 100,
            redirectUrl: "/mock",
        });
        expect(r).toBeNull();
    });

    it("getPaymentAttemptByTransactionId returns null", async () => {
        const mod = await freshModule();
        expect(await mod.getPaymentAttemptByTransactionId("tx-404")).toBeNull();
    });

    it("getPaymentAttemptByGroupId returns null", async () => {
        const mod = await freshModule();
        expect(await mod.getPaymentAttemptByGroupId("g-404")).toBeNull();
    });

    it("markPaymentAttemptFailed does not throw", async () => {
        const mod = await freshModule();
        await expect(
            mod.markPaymentAttemptFailed({
                transactionId: "tx-2",
                error: "provider down",
                rawCallback: {},
            })
        ).resolves.not.toThrow();
    });

    it("markPaymentAttemptPaid does not throw", async () => {
        const mod = await freshModule();
        await expect(
            mod.markPaymentAttemptPaid({
                transactionId: "tx-3",
                providerReference: "ref-1",
                rawCallback: {},
            })
        ).resolves.not.toThrow();
    });
});
