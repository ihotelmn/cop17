import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockPool = () => ({
    query: vi.fn(),
});

vi.mock("@/lib/postgres", () => {
    const state: { pool: ReturnType<typeof mockPool> } = { pool: mockPool() };
    return {
        getPostgresPool: vi.fn(() => state.pool),
        __setPool: (p: ReturnType<typeof mockPool>) => { state.pool = p; },
        __getPool: () => state.pool,
    };
});

async function freshModules() {
    vi.resetModules();
    const pg = await import("@/lib/postgres");
    const pool = mockPool();
    (pg as any).__setPool(pool);
    const mod = await import("./action-rate-limit");
    return { mod, pool };
}

describe("action-rate-limit — helpers", () => {
    it("getClientIpFromHeaders parses x-forwarded-for correctly", async () => {
        const { mod } = await freshModules();
        const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
        expect(mod.getClientIpFromHeaders(h)).toBe("1.2.3.4");
    });

    it("getClientIpFromHeaders falls back to cf-connecting-ip", async () => {
        const { mod } = await freshModules();
        const h = new Headers({ "cf-connecting-ip": "9.9.9.9" });
        expect(mod.getClientIpFromHeaders(h)).toBe("9.9.9.9");
    });

    it("getClientIpFromHeaders returns null if nothing is set", async () => {
        const { mod } = await freshModules();
        expect(mod.getClientIpFromHeaders(new Headers())).toBeNull();
    });

    it("buildActionRateLimitKey lowercases and joins parts, dropping empties", async () => {
        const { mod } = await freshModules();
        expect(mod.buildActionRateLimitKey("A", null, "B")).toBe("a::b");
        expect(mod.buildActionRateLimitKey("", "  ", null)).toBeNull();
    });
});

describe("action-rate-limit — enforceActionRateLimit", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("passes when key is nullish (no-op)", async () => {
        const { mod, pool } = await freshModules();
        await expect(
            mod.enforceActionRateLimit({ scope: "x", key: null, maxHits: 5, windowMs: 60_000 })
        ).resolves.toBeUndefined();
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("passes when hit_count <= maxHits", async () => {
        const { mod, pool } = await freshModules();
        pool.query.mockResolvedValue({
            rows: [{ hit_count: 3, window_started_at: new Date().toISOString() }],
        });
        await expect(
            mod.enforceActionRateLimit({ scope: "x", key: "k", maxHits: 5, windowMs: 60_000 })
        ).resolves.toBeUndefined();
        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it("throws ActionRateLimitError when hit_count > maxHits", async () => {
        const { mod, pool } = await freshModules();
        pool.query.mockResolvedValue({
            rows: [{ hit_count: 10, window_started_at: new Date().toISOString() }],
        });
        await expect(
            mod.enforceActionRateLimit({ scope: "x", key: "k", maxHits: 5, windowMs: 60_000 })
        ).rejects.toBeInstanceOf(mod.ActionRateLimitError);
    });

    it("sets retryAfterSeconds on the error (>= 1)", async () => {
        const { mod, pool } = await freshModules();
        pool.query.mockResolvedValue({
            rows: [{ hit_count: 10, window_started_at: new Date().toISOString() }],
        });
        await mod
            .enforceActionRateLimit({ scope: "x", key: "k", maxHits: 5, windowMs: 60_000 })
            .catch((e: Error & { retryAfterSeconds: number }) => {
                expect(e.retryAfterSeconds).toBeGreaterThanOrEqual(1);
            });
    });
});

describe("action-rate-limit — enforceActionRateLimitSafely", () => {
    it("rethrows ActionRateLimitError", async () => {
        const { mod, pool } = await freshModules();
        pool.query.mockResolvedValue({
            rows: [{ hit_count: 100, window_started_at: new Date().toISOString() }],
        });
        await expect(
            mod.enforceActionRateLimitSafely(
                { scope: "x", key: "k", maxHits: 1, windowMs: 1000 },
                "ctx"
            )
        ).rejects.toBeInstanceOf(mod.ActionRateLimitError);
    });

    it("fails open on generic DB errors (returns undefined)", async () => {
        const { mod, pool } = await freshModules();
        pool.query.mockRejectedValue(new Error("DB down"));
        const spyErr = vi.spyOn(console, "error").mockImplementation(() => {});
        await expect(
            mod.enforceActionRateLimitSafely(
                { scope: "x", key: "k", maxHits: 1, windowMs: 1000 },
                "ctx"
            )
        ).resolves.toBeUndefined();
        expect(spyErr).toHaveBeenCalled();
        spyErr.mockRestore();
    });
});
