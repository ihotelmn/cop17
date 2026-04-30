/**
 * Sync hotel/room prices, inventory, amenities, and cancellation policies from the
 * spreadsheet data snapshot in scripts/data/xlsx-sync-2026-04-16.json.
 *
 * Two modes:
 *   npx tsx scripts/sync-hotels-from-xlsx.ts --dry-run   (default — writes match-report.md + proposed-updates.json)
 *   npx tsx scripts/sync-hotels-from-xlsx.ts --apply     (reads proposed-updates.json and applies)
 *
 * Uses @supabase/supabase-js with SUPABASE_SERVICE_ROLE_KEY because direct Postgres
 * (db.*.supabase.co) DNS is disabled from this network.
 */

import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

// ---------- Types ----------

type XlsxRow = {
    rowIndex: number;
    hotelName: string;
    roomName: string | null;
    inventoryRaw: number | string | null;
    price: number | null;
    cancellationPolicy: string | null;
    amenitiesRaw: string | null;
};

type DbHotel = {
    id: string;
    name: string;
    name_en: string | null;
    is_published: boolean;
    amenities: string[] | null;
    cancellation_policy_notes: string | null;
};

type DbRoom = {
    id: string;
    hotel_id: string;
    name: string;
    type: string | null;
    price_per_night: number;
    total_inventory: number;
};

type HotelMatch = {
    xlsxName: string;
    dbHotel: DbHotel | null;
    status: "MATCHED" | "NO_MATCH" | "SKIPPED_ABSENT";
    note?: string;
};

type RowResult = {
    xlsxRow: XlsxRow;
    hotelMatch: HotelMatch;
    roomMatch: {
        status: "MATCHED" | "NO_ROOM" | "NO_ROOM_MATCH" | "AMBIGUOUS" | "SHADOWED" | "HOTEL_SKIPPED";
        dbRoom: DbRoom | null;
        candidates?: DbRoom[];
    };
    changes: {
        price?: { from: number; to: number };
        inventory?: { from: number; to: number };
        inventoryTextSkipped?: string;
    };
};

type Update = {
    table: "rooms" | "hotels";
    id: string;
    label: string; // human-readable description of the target (for logging)
    fields: Record<string, unknown>;
    diff: Record<string, [unknown, unknown]>;
};

// ---------- Normalization ----------

function stripDiacritics(s: string): string {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Extract just the English side of bilingual "Mongolian | English" names.
// Also handles DB names that have no pipe.
function englishSide(name: string): string {
    const parts = name.split("|").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return "";
    // Choose the part with the most ASCII letters (English heuristic)
    let best = parts[0];
    let bestScore = -1;
    for (const p of parts) {
        const asciiLetters = (p.match(/[A-Za-z]/g) || []).length;
        if (asciiLetters > bestScore) {
            best = p;
            bestScore = asciiLetters;
        }
    }
    return best;
}

function normHotelName(raw: string | null | undefined): string {
    if (!raw) return "";
    let s = englishSide(raw);
    s = stripDiacritics(s).toLowerCase();
    // Collapse "millenium" <-> "millennium"
    s = s.replace(/millenn?ium/g, "millenium");
    // Common punctuation cleanup
    s = s.replace(/[.,\-()/]/g, " ");
    // Remove only truly-noise filler words. Keep distinguishing tokens
    // ("convention", "centre", "plaza", "tower", "inn", "mountain", "khaan", etc.).
    s = s.replace(/\b(the|hotel|and|&|ulaanbaatar|ub|citycenter)\b/g, " ");
    // Normalize spelling variants
    s = s.replace(/\bcentre\b/g, "center");
    s = s.replace(/\s+/g, " ").trim();
    return s;
}

const ROOM_TOKEN_WORDS = new Set([
    "standard",
    "single",
    "double",
    "twin",
    "triple",
    "king",
    "suite",
    "deluxe",
    "executive",
    "superior",
    "semi",
    "junior",
    "presidential",
    "president",
    "vip",
    "accessible",
    "economy",
    "horizon",
    "apartment",
    "corner",
    "big",
    "queen",
    "family",
]);

function normRoomName(raw: string | null | undefined): { normalized: string; tokens: Set<string> } {
    if (!raw) return { normalized: "", tokens: new Set() };
    let s = stripDiacritics(raw).toLowerCase();
    // Map Cyrillic room words to English equivalents for tokenization
    s = s
        .replace(/хагас\s*люкс/gi, "semi deluxe")
        .replace(/бүтэн\s*люкс/gi, "deluxe")
        .replace(/люкс/gi, "suite")
        .replace(/өрөө/gi, "")
        .replace(/ортой/gi, "")
        .replace(/гэр бүлийн/gi, "family")
        .replace(/ерөнхийлөгчийн/gi, "presidential")
        .replace(/бизнес/gi, "business");
    // "standart" typo -> "standard"
    s = s.replace(/\bstandart\b/g, "standard");
    s = s.replace(/[.,\-()/]/g, " ");
    s = s.replace(/\broom(s)?\b/g, "");
    s = s.replace(/\s+/g, " ").trim();
    const allTokens = s.split(/\s+/).filter(Boolean);
    const tokens = new Set(allTokens.filter((t) => ROOM_TOKEN_WORDS.has(t)));
    return { normalized: s, tokens };
}

function setEq<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
}

// ---------- Matching ----------

function matchHotel(xlsxName: string, hotels: DbHotel[]): HotelMatch {
    const target = normHotelName(xlsxName);
    if (!target) {
        return { xlsxName, dbHotel: null, status: "NO_MATCH", note: "empty name" };
    }

    const candidates: { hotel: DbHotel; score: number }[] = [];
    for (const h of hotels) {
        const nameEn = normHotelName(h.name_en);
        const nameMain = normHotelName(h.name);
        let score = 0;
        if (nameEn && nameEn === target) score = 3;
        else if (nameMain && nameMain === target) score = 3;
        else if (nameEn && (nameEn.includes(target) || target.includes(nameEn))) score = 2;
        else if (nameMain && (nameMain.includes(target) || target.includes(nameMain))) score = 2;
        if (score > 0) candidates.push({ hotel: h, score });
    }

    if (candidates.length === 0) {
        return { xlsxName, dbHotel: null, status: "NO_MATCH" };
    }

    // Prefer exact matches (score 3); if multiple exact, ambiguous; otherwise take highest score
    const maxScore = Math.max(...candidates.map((c) => c.score));
    const best = candidates.filter((c) => c.score === maxScore);
    if (best.length === 1) {
        return { xlsxName, dbHotel: best[0].hotel, status: "MATCHED" };
    }
    // Break ties with published-first
    const published = best.filter((c) => c.hotel.is_published);
    if (published.length === 1) {
        return { xlsxName, dbHotel: published[0].hotel, status: "MATCHED", note: `tie broken by is_published (${best.length} candidates)` };
    }
    return { xlsxName, dbHotel: null, status: "NO_MATCH", note: `ambiguous: ${best.map((c) => c.hotel.name_en || c.hotel.name).join(" | ")}` };
}

function matchRoom(xlsxRow: XlsxRow, rooms: DbRoom[]): { status: RowResult["roomMatch"]["status"]; dbRoom: DbRoom | null; candidates?: DbRoom[] } {
    if (!xlsxRow.roomName) {
        return { status: "NO_ROOM", dbRoom: null };
    }
    if (rooms.length === 0) {
        return { status: "NO_ROOM_MATCH", dbRoom: null };
    }

    const xNorm = normRoomName(xlsxRow.roomName);

    // Pass 1: exact normalized-name match
    const exact = rooms.filter((r) => {
        const n = normRoomName(r.name);
        return n.normalized === xNorm.normalized && n.normalized.length > 0;
    });
    if (exact.length === 1) return { status: "MATCHED", dbRoom: exact[0] };
    if (exact.length > 1) {
        // Use price tiebreaker
        const winner = priceWinner(exact, xlsxRow.price);
        if (winner) return { status: "MATCHED", dbRoom: winner };
        return { status: "AMBIGUOUS", dbRoom: null, candidates: exact };
    }

    // Pass 2: keyword-set equality
    const tokenMatches = rooms.filter((r) => {
        const n = normRoomName(r.name);
        return n.tokens.size > 0 && setEq(n.tokens, xNorm.tokens);
    });
    if (tokenMatches.length === 1) return { status: "MATCHED", dbRoom: tokenMatches[0] };
    if (tokenMatches.length > 1) {
        const winner = priceWinner(tokenMatches, xlsxRow.price);
        if (winner) return { status: "MATCHED", dbRoom: winner };
        return { status: "AMBIGUOUS", dbRoom: null, candidates: tokenMatches };
    }

    // Pass 3a: DB tokens strict-subset of xlsx tokens (xlsx is MORE specific than DB name,
    // e.g. xlsx "Standard Twin" {standard, twin} matches DB "Twin Room" {twin}). Trust these.
    const dbStrictSubset = rooms.filter((r) => {
        const n = normRoomName(r.name);
        if (n.tokens.size === 0 || xNorm.tokens.size === 0) return false;
        for (const t of n.tokens) if (!xNorm.tokens.has(t)) return false;
        return n.tokens.size < xNorm.tokens.size;
    });
    if (dbStrictSubset.length === 1) return { status: "MATCHED", dbRoom: dbStrictSubset[0] };
    if (dbStrictSubset.length > 1) {
        const winner = priceWinner(dbStrictSubset, xlsxRow.price);
        if (winner) return { status: "MATCHED", dbRoom: winner };
        return { status: "AMBIGUOUS", dbRoom: null, candidates: dbStrictSubset };
    }

    // Pass 3b: xlsx tokens strict-subset of DB tokens (xlsx is LESS specific, e.g.
    // xlsx "Single" {single} vs DB "Standard Single Room" {standard, single}).
    // Accept only when the match is unambiguous OR price agrees.
    const xlsxStrictSubset = rooms.filter((r) => {
        const n = normRoomName(r.name);
        if (n.tokens.size === 0 || xNorm.tokens.size === 0) return false;
        for (const t of xNorm.tokens) if (!n.tokens.has(t)) return false;
        return xNorm.tokens.size < n.tokens.size;
    });
    if (xlsxStrictSubset.length === 1) {
        const only = xlsxStrictSubset[0];
        if (xlsxRow.price == null || Math.abs(Number(only.price_per_night) - xlsxRow.price) < 1) {
            return { status: "MATCHED", dbRoom: only };
        }
        return { status: "NO_ROOM_MATCH", dbRoom: null };
    }
    if (xlsxStrictSubset.length > 1) {
        const winner = priceWinner(xlsxStrictSubset, xlsxRow.price);
        if (winner) return { status: "MATCHED", dbRoom: winner };
        return { status: "AMBIGUOUS", dbRoom: null, candidates: xlsxStrictSubset };
    }

    return { status: "NO_ROOM_MATCH", dbRoom: null };
}

function priceWinner(candidates: DbRoom[], xlsxPrice: number | null): DbRoom | null {
    if (xlsxPrice == null) return null;
    const close = candidates.filter((r) => Math.abs(Number(r.price_per_night) - xlsxPrice) < 1);
    if (close.length === 1) return close[0];
    return null;
}

// ---------- Value parsing ----------

function parseInventory(raw: number | string | null | undefined): { numeric: number | null; textNote: string | null } {
    if (raw == null) return { numeric: null, textNote: null };
    if (typeof raw === "number") {
        if (!Number.isFinite(raw)) return { numeric: null, textNote: String(raw) };
        return { numeric: Math.round(raw), textNote: null };
    }
    const s = String(raw).trim();
    if (s === "") return { numeric: null, textNote: null };
    // If it's a pure integer string
    if (/^\d+$/.test(s)) return { numeric: parseInt(s, 10), textNote: null };
    return { numeric: null, textNote: s };
}

function parseAmenities(raw: string | null): string[] | null {
    if (!raw) return null;
    const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim().replace(/^["']|["']$/g, "").trim())
        .filter(Boolean)
        .filter((l) => l.toLowerCase() !== "popular amenities");
    return lines.length > 0 ? lines : null;
}

// ---------- Main ----------

async function main() {
    const argv = process.argv.slice(2);
    const apply = argv.includes("--apply");
    const dryRun = !apply;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const outDir = path.resolve(process.cwd(), "scripts/out");
    fs.mkdirSync(outDir, { recursive: true });
    const proposedUpdatesPath = path.join(outDir, "proposed-updates.json");

    if (apply) {
        await runApply(supabase, proposedUpdatesPath);
        return;
    }

    // DRY-RUN
    const dataPath = path.resolve(process.cwd(), "scripts/data/xlsx-sync-2026-04-16.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as { rows: XlsxRow[] };

    console.log(`Loaded ${data.rows.length} rows from spreadsheet`);

    // Fetch all hotels
    const { data: hotels, error: he } = await supabase
        .from("hotels")
        .select("id,name,name_en,is_published,amenities,cancellation_policy_notes");
    if (he) throw he;
    const allHotels = (hotels || []) as DbHotel[];
    console.log(`Fetched ${allHotels.length} hotels from DB`);

    // Match hotels — one pass over distinct xlsx hotel names
    const distinctXlsxHotelNames = Array.from(new Set(data.rows.map((r) => r.hotelName)));
    const hotelMatchByXlsxName = new Map<string, HotelMatch>();
    const confirmedSkipList = new Set(["munkh khustai hotel", "peace hotel"]);
    for (const xn of distinctXlsxHotelNames) {
        const normed = normHotelName(xn);
        if (confirmedSkipList.has(normHotelName(xn.toLowerCase()).replace(/\s+/g, " ")) ||
            ["munkh khustai", "peace"].some((s) => normed === s)) {
            hotelMatchByXlsxName.set(xn, { xlsxName: xn, dbHotel: null, status: "SKIPPED_ABSENT", note: "user-confirmed skip" });
            continue;
        }
        hotelMatchByXlsxName.set(xn, matchHotel(xn, allHotels));
    }

    // Fetch rooms for matched hotels
    const matchedHotelIds = Array.from(
        new Set(
            Array.from(hotelMatchByXlsxName.values())
                .filter((m) => m.status === "MATCHED" && m.dbHotel)
                .map((m) => m.dbHotel!.id)
        )
    );
    const { data: rooms, error: re } = await supabase
        .from("rooms")
        .select("id,hotel_id,name,type,price_per_night,total_inventory")
        .in("hotel_id", matchedHotelIds.length > 0 ? matchedHotelIds : ["00000000-0000-0000-0000-000000000000"]);
    if (re) throw re;
    const roomsByHotel = new Map<string, DbRoom[]>();
    for (const r of (rooms || []) as DbRoom[]) {
        const list = roomsByHotel.get(r.hotel_id) || [];
        list.push({ ...r, price_per_night: Number(r.price_per_night) });
        roomsByHotel.set(r.hotel_id, list);
    }
    console.log(`Fetched ${rooms?.length || 0} rooms across ${matchedHotelIds.length} matched hotels`);

    // Process rows
    const rowResults: RowResult[] = [];
    // Track which (hotel, roomId) already had a row — for SHADOWED detection
    const roomUsage = new Map<string, RowResult[]>(); // key = roomId

    for (const row of data.rows) {
        const hm = hotelMatchByXlsxName.get(row.hotelName)!;
        if (hm.status !== "MATCHED" || !hm.dbHotel) {
            rowResults.push({ xlsxRow: row, hotelMatch: hm, roomMatch: { status: "HOTEL_SKIPPED", dbRoom: null }, changes: {} });
            continue;
        }
        const rooms = roomsByHotel.get(hm.dbHotel.id) || [];
        const rm = matchRoom(row, rooms);

        // Compute diffs
        const changes: RowResult["changes"] = {};
        if (rm.status === "MATCHED" && rm.dbRoom) {
            // Price
            if (row.price != null && typeof row.price === "number") {
                if (Math.abs(rm.dbRoom.price_per_night - row.price) >= 0.01) {
                    changes.price = { from: rm.dbRoom.price_per_night, to: row.price };
                }
            }
            // Inventory
            const inv = parseInventory(row.inventoryRaw);
            if (inv.numeric != null) {
                if (rm.dbRoom.total_inventory !== inv.numeric) {
                    changes.inventory = { from: rm.dbRoom.total_inventory, to: inv.numeric };
                }
            } else if (inv.textNote) {
                changes.inventoryTextSkipped = inv.textNote;
            }
        }

        const result: RowResult = { xlsxRow: row, hotelMatch: hm, roomMatch: rm, changes };
        rowResults.push(result);
        if (rm.dbRoom) {
            const list = roomUsage.get(rm.dbRoom.id) || [];
            list.push(result);
            roomUsage.set(rm.dbRoom.id, list);
        }
    }

    // Mark SHADOWED: earlier rows that share a matched room with a later row
    for (const [roomId, list] of roomUsage) {
        if (list.length <= 1) continue;
        // Keep the LAST one as MATCHED, mark earlier ones as SHADOWED
        for (let i = 0; i < list.length - 1; i++) {
            list[i].roomMatch.status = "SHADOWED";
            // Reset its changes so we don't try to apply them
            list[i].changes = {};
        }
        void roomId;
    }

    // Build Update list
    const updates: Update[] = [];

    // Room updates (price, inventory)
    for (const r of rowResults) {
        if (r.roomMatch.status !== "MATCHED" || !r.roomMatch.dbRoom) continue;
        const fields: Record<string, unknown> = {};
        const diff: Record<string, [unknown, unknown]> = {};
        if (r.changes.price) {
            fields.price_per_night = r.changes.price.to;
            diff.price_per_night = [r.changes.price.from, r.changes.price.to];
        }
        if (r.changes.inventory) {
            fields.total_inventory = r.changes.inventory.to;
            diff.total_inventory = [r.changes.inventory.from, r.changes.inventory.to];
        }
        if (Object.keys(fields).length === 0) continue;
        updates.push({
            table: "rooms",
            id: r.roomMatch.dbRoom.id,
            label: `${r.hotelMatch.dbHotel!.name_en || r.hotelMatch.dbHotel!.name} / ${r.roomMatch.dbRoom.name}`,
            fields,
            diff,
        });
    }

    // Hotel updates (amenities, cancellation_policy_notes) — aggregate one per hotel
    const hotelUpdates = new Map<string, { hotel: DbHotel; firstPolicyRow?: XlsxRow; firstAmenitiesRow?: XlsxRow }>();
    for (const r of rowResults) {
        if (r.hotelMatch.status !== "MATCHED" || !r.hotelMatch.dbHotel) continue;
        // Only aggregate from rows that are NOT HOTEL_SKIPPED (they all pass this) — include even NO_ROOM rows for hotel-level data
        const h = r.hotelMatch.dbHotel;
        let rec = hotelUpdates.get(h.id);
        if (!rec) {
            rec = { hotel: h };
            hotelUpdates.set(h.id, rec);
        }
        if (!rec.firstPolicyRow && r.xlsxRow.cancellationPolicy) rec.firstPolicyRow = r.xlsxRow;
        if (!rec.firstAmenitiesRow && r.xlsxRow.amenitiesRaw) rec.firstAmenitiesRow = r.xlsxRow;
    }
    for (const { hotel, firstPolicyRow, firstAmenitiesRow } of hotelUpdates.values()) {
        const fields: Record<string, unknown> = {};
        const diff: Record<string, [unknown, unknown]> = {};
        if (firstPolicyRow?.cancellationPolicy) {
            const newVal = firstPolicyRow.cancellationPolicy;
            if ((hotel.cancellation_policy_notes || "") !== newVal) {
                fields.cancellation_policy_notes = newVal;
                diff.cancellation_policy_notes = [hotel.cancellation_policy_notes, newVal];
            }
        }
        if (firstAmenitiesRow?.amenitiesRaw) {
            const newAm = parseAmenities(firstAmenitiesRow.amenitiesRaw);
            if (newAm && JSON.stringify(hotel.amenities || []) !== JSON.stringify(newAm)) {
                fields.amenities = newAm;
                diff.amenities = [hotel.amenities, newAm];
            }
        }
        if (Object.keys(fields).length === 0) continue;
        updates.push({
            table: "hotels",
            id: hotel.id,
            label: hotel.name_en || hotel.name,
            fields,
            diff,
        });
    }

    // Write artefacts
    fs.writeFileSync(proposedUpdatesPath, JSON.stringify(updates, null, 2));
    const reportPath = path.join(outDir, "match-report.md");
    fs.writeFileSync(reportPath, renderReport(rowResults, hotelUpdates, updates));

    // Console summary
    const counts = {
        rows: rowResults.length,
        matchedRoom: rowResults.filter((r) => r.roomMatch.status === "MATCHED").length,
        shadowed: rowResults.filter((r) => r.roomMatch.status === "SHADOWED").length,
        ambiguous: rowResults.filter((r) => r.roomMatch.status === "AMBIGUOUS").length,
        noRoomMatch: rowResults.filter((r) => r.roomMatch.status === "NO_ROOM_MATCH").length,
        noRoom: rowResults.filter((r) => r.roomMatch.status === "NO_ROOM").length,
        hotelSkipped: rowResults.filter((r) => r.roomMatch.status === "HOTEL_SKIPPED").length,
        roomUpdates: updates.filter((u) => u.table === "rooms").length,
        hotelUpdates: updates.filter((u) => u.table === "hotels").length,
    };
    console.log("\n--- Summary ---");
    console.log(counts);
    console.log(`\nReport:    ${reportPath}`);
    console.log(`Updates:   ${proposedUpdatesPath}`);
    if (dryRun) console.log("\n(Dry-run — no changes made. Pass --apply to execute.)");
}

// ---------- Report rendering ----------

function fmtInv(n: number) {
    return Number.isFinite(n) ? String(n) : "—";
}
function fmtPrice(n: number) {
    if (!Number.isFinite(n)) return "—";
    return n.toFixed(2).replace(/\.00$/, "");
}

function renderReport(
    rowResults: RowResult[],
    hotelUpdates: Map<string, { hotel: DbHotel; firstPolicyRow?: XlsxRow; firstAmenitiesRow?: XlsxRow }>,
    updates: Update[]
): string {
    const lines: string[] = [];
    lines.push("# Hotel/Room sync — match report");
    lines.push("");
    lines.push(`Source: \`scripts/data/xlsx-sync-2026-04-16.json\`  Target: Supabase production DB (write nothing yet — dry run)`);
    lines.push("");

    // Summary
    const byStatus = (s: string) => rowResults.filter((r) => r.roomMatch.status === s).length;
    lines.push("## Summary");
    lines.push("");
    lines.push(`- Rows processed: **${rowResults.length}**`);
    lines.push(`- Room matched: **${byStatus("MATCHED")}**`);
    lines.push(`- Shadowed (earlier row overridden by later row for same DB room): **${byStatus("SHADOWED")}**`);
    lines.push(`- Ambiguous (multiple DB candidates, need your call): **${byStatus("AMBIGUOUS")}**`);
    lines.push(`- No room match (DB has no matching room): **${byStatus("NO_ROOM_MATCH")}**`);
    lines.push(`- Row has no room (hotel-level data only): **${byStatus("NO_ROOM")}**`);
    lines.push(`- Hotel skipped (not in DB): **${byStatus("HOTEL_SKIPPED")}**`);
    lines.push("");
    lines.push(`- Planned room updates: **${updates.filter((u) => u.table === "rooms").length}**`);
    lines.push(`- Planned hotel updates (policy/amenities): **${updates.filter((u) => u.table === "hotels").length}**`);
    lines.push("");

    // Per-hotel sections
    lines.push("## Per-hotel detail");
    lines.push("");
    const byHotelName = new Map<string, RowResult[]>();
    for (const r of rowResults) {
        const key = r.xlsxRow.hotelName;
        const list = byHotelName.get(key) || [];
        list.push(r);
        byHotelName.set(key, list);
    }
    for (const [xName, list] of byHotelName) {
        const hm = list[0].hotelMatch;
        const dbHotel = hm.dbHotel;
        const hotelLabel = dbHotel ? `${dbHotel.name_en || dbHotel.name}${dbHotel.is_published ? "" : " (unpublished)"}` : "—";
        lines.push(`### ${xName}`);
        lines.push("");
        lines.push(`- Hotel match: **${hm.status}**${hm.note ? ` — ${hm.note}` : ""}`);
        lines.push(`- DB hotel: ${hotelLabel}${dbHotel ? ` (\`${dbHotel.id}\`)` : ""}`);
        if (dbHotel) {
            const hu = hotelUpdates.get(dbHotel.id);
            const willUpdatePolicy = hu?.firstPolicyRow && (dbHotel.cancellation_policy_notes || "") !== hu.firstPolicyRow.cancellationPolicy;
            const willUpdateAmenities =
                hu?.firstAmenitiesRow &&
                JSON.stringify(dbHotel.amenities || []) !==
                    JSON.stringify(parseAmenities(hu.firstAmenitiesRow.amenitiesRaw) || []);
            lines.push(`- Hotel-level update: policy=**${willUpdatePolicy ? "YES" : "no"}**, amenities=**${willUpdateAmenities ? "YES" : "no"}**`);
        }
        lines.push("");
        lines.push("| xlsx row | xlsx room | status | db room | current (price, inv) | proposed (price, inv) | changes |");
        lines.push("|---|---|---|---|---|---|---|");
        for (const r of list) {
            const x = r.xlsxRow;
            const rm = r.roomMatch;
            const db = rm.dbRoom;
            const current = db ? `${fmtPrice(db.price_per_night)}, ${fmtInv(db.total_inventory)}` : "—";
            const inv = parseInventory(x.inventoryRaw);
            const proposedInv = inv.numeric != null ? String(inv.numeric) : inv.textNote ? `\`${inv.textNote}\` (text — skip)` : "—";
            const proposedPrice = typeof x.price === "number" ? fmtPrice(x.price) : "—";
            const proposed = `${proposedPrice}, ${proposedInv}`;
            const changesParts: string[] = [];
            if (r.changes.price) changesParts.push(`price ${fmtPrice(r.changes.price.from)}→${fmtPrice(r.changes.price.to)}`);
            if (r.changes.inventory) changesParts.push(`inv ${r.changes.inventory.from}→${r.changes.inventory.to}`);
            if (r.changes.inventoryTextSkipped) changesParts.push(`inv text skipped`);
            const changesStr = changesParts.length ? changesParts.join(", ") : "—";
            let candStr = "";
            if (rm.status === "AMBIGUOUS" && rm.candidates?.length) {
                candStr = `<br/>candidates: ${rm.candidates.map((c) => `${c.name} ($${fmtPrice(c.price_per_night)}, inv=${c.total_inventory})`).join("; ")}`;
            }
            lines.push(
                `| ${x.rowIndex} | ${escapePipe(x.roomName || "—")} | **${rm.status}** | ${db ? escapePipe(db.name) : "—"}${candStr} | ${current} | ${proposed} | ${changesStr} |`
            );
        }
        lines.push("");
    }

    // Planned updates detail
    lines.push("## Planned updates (proposed-updates.json)");
    lines.push("");
    for (const u of updates) {
        lines.push(`- \`${u.table}\` \`${u.id}\` — **${u.label}**`);
        for (const [col, [from, to]] of Object.entries(u.diff)) {
            const fromStr = typeof from === "string" && from.length > 80 ? from.slice(0, 80) + "…" : JSON.stringify(from);
            const toStr = typeof to === "string" && to.length > 80 ? to.slice(0, 80) + "…" : JSON.stringify(to);
            lines.push(`  - ${col}: ${fromStr} → ${toStr}`);
        }
    }
    lines.push("");
    return lines.join("\n");
}

function escapePipe(s: string): string {
    return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

// ---------- Apply ----------

async function runApply(
    supabase: ReturnType<typeof createClient>,
    proposedPath: string
): Promise<void> {
    if (!fs.existsSync(proposedPath)) {
        console.error(`Missing ${proposedPath}. Run --dry-run first.`);
        process.exit(1);
    }
    const updates = JSON.parse(fs.readFileSync(proposedPath, "utf-8")) as Update[];
    console.log(`Applying ${updates.length} updates...`);
    let ok = 0;
    for (let i = 0; i < updates.length; i++) {
        const u = updates[i];
        const { error } = await supabase.from(u.table).update(u.fields).eq("id", u.id);
        if (error) {
            console.error(`[${i + 1}/${updates.length}] FAILED ${u.table} ${u.id} (${u.label}):`, error.message);
            console.error(`Remaining ${updates.length - i - 1} updates NOT applied. Fix and re-run.`);
            process.exit(2);
        }
        ok++;
        const cols = Object.keys(u.fields).join(",");
        console.log(`[${i + 1}/${updates.length}] OK  ${u.table}  ${u.label}  (${cols})`);
    }
    console.log(`\n✅ Applied ${ok}/${updates.length} updates.`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
