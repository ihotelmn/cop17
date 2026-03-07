import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

export const BOOKING_SEARCH_STORAGE_KEY = "cop17-booking-search";

export interface BookingSearchState {
    query: string;
    from?: string;
    to?: string;
    adults: number;
    children: number;
    rooms: number;
}

type SearchParamsReader = {
    get(name: string): string | null;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_BOOKING_SEARCH_STATE: BookingSearchState = {
    query: "",
    adults: 2,
    children: 0,
    rooms: 1,
};

function cleanText(value: unknown): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}

function cleanDate(value: unknown): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    return DATE_PATTERN.test(value) ? value : undefined;
}

function cleanNumber(
    value: unknown,
    fallback: number,
    min: number,
    max: number
): number {
    const numericValue = typeof value === "number"
        ? value
        : typeof value === "string"
            ? Number.parseInt(value, 10)
            : Number.NaN;

    if (!Number.isFinite(numericValue)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, numericValue));
}

export function readPartialBookingSearchState(
    source?: SearchParamsReader | null
): Partial<BookingSearchState> {
    if (!source) {
        return {};
    }

    const state: Partial<BookingSearchState> = {};

    const query = cleanText(source.get("query"));
    const from = cleanDate(source.get("from"));
    const to = cleanDate(source.get("to"));
    const adults = source.get("adults");
    const children = source.get("children");
    const rooms = source.get("rooms");

    if (query) {
        state.query = query;
    }

    if (from) {
        state.from = from;
    }

    if (to) {
        state.to = to;
    }

    if (adults !== null) {
        state.adults = cleanNumber(adults, DEFAULT_BOOKING_SEARCH_STATE.adults, 1, 10);
    }

    if (children !== null) {
        state.children = cleanNumber(children, DEFAULT_BOOKING_SEARCH_STATE.children, 0, 10);
    }

    if (rooms !== null) {
        state.rooms = cleanNumber(rooms, DEFAULT_BOOKING_SEARCH_STATE.rooms, 1, 10);
    }

    return state;
}

export function normalizeBookingSearchState(
    state?: Partial<BookingSearchState> | null
): BookingSearchState {
    return {
        query: cleanText(state?.query) ?? DEFAULT_BOOKING_SEARCH_STATE.query,
        from: cleanDate(state?.from),
        to: cleanDate(state?.to),
        adults: cleanNumber(
            state?.adults,
            DEFAULT_BOOKING_SEARCH_STATE.adults,
            1,
            10
        ),
        children: cleanNumber(
            state?.children,
            DEFAULT_BOOKING_SEARCH_STATE.children,
            0,
            10
        ),
        rooms: cleanNumber(
            state?.rooms,
            DEFAULT_BOOKING_SEARCH_STATE.rooms,
            1,
            10
        ),
    };
}

export function mergeBookingSearchState(
    primary?: Partial<BookingSearchState> | null,
    fallback?: Partial<BookingSearchState> | null
): BookingSearchState {
    return normalizeBookingSearchState({
        ...(fallback ?? {}),
        ...(primary ?? {}),
    });
}

export function hasActiveBookingSearchState(
    state?: Partial<BookingSearchState> | null
): boolean {
    const normalized = normalizeBookingSearchState(state);

    return Boolean(
        normalized.query ||
        normalized.from ||
        normalized.to ||
        normalized.adults !== DEFAULT_BOOKING_SEARCH_STATE.adults ||
        normalized.children !== DEFAULT_BOOKING_SEARCH_STATE.children ||
        normalized.rooms !== DEFAULT_BOOKING_SEARCH_STATE.rooms
    );
}

export function applyBookingSearchStateToParams(
    params: URLSearchParams,
    state?: Partial<BookingSearchState> | null,
    options?: {
        includeDefaults?: boolean;
        preserveExisting?: boolean;
    }
): URLSearchParams {
    const normalized = normalizeBookingSearchState(state);
    const includeDefaults = options?.includeDefaults ?? true;
    const preserveExisting = options?.preserveExisting ?? false;
    const hasActiveState = hasActiveBookingSearchState(state);
    const shouldPersistCounts = includeDefaults || hasActiveState;

    const setOrDelete = (key: keyof BookingSearchState, value?: string) => {
        if (preserveExisting && params.has(key)) {
            return;
        }

        if (value) {
            params.set(key, value);
            return;
        }

        params.delete(key);
    };

    setOrDelete("query", normalized.query || undefined);
    setOrDelete("from", normalized.from);
    setOrDelete("to", normalized.to);

    if (shouldPersistCounts) {
        setOrDelete("adults", String(normalized.adults));
        setOrDelete("children", String(normalized.children));
        setOrDelete("rooms", String(normalized.rooms));
    }

    return params;
}

export function getDateRangeFromBookingSearchState(
    state?: Partial<BookingSearchState> | null
): DateRange | undefined {
    const normalized = normalizeBookingSearchState(state);

    if (!normalized.from && !normalized.to) {
        return undefined;
    }

    return {
        from: normalized.from ? new Date(`${normalized.from}T12:00:00`) : undefined,
        to: normalized.to ? new Date(`${normalized.to}T12:00:00`) : undefined,
    };
}

export function createBookingSearchState(
    values: {
        query?: string;
        date?: DateRange;
        adults?: number;
        children?: number;
        rooms?: number;
    }
): Partial<BookingSearchState> {
    const state: Partial<BookingSearchState> = {};

    if (values.query !== undefined) {
        state.query = values.query;
    }

    if (values.date) {
        state.from = values.date.from ? format(values.date.from, "yyyy-MM-dd") : undefined;
        state.to = values.date.to ? format(values.date.to, "yyyy-MM-dd") : undefined;
    }

    if (values.adults !== undefined) {
        state.adults = values.adults;
    }

    if (values.children !== undefined) {
        state.children = values.children;
    }

    if (values.rooms !== undefined) {
        state.rooms = values.rooms;
    }

    return state;
}

export function readStoredBookingSearchState(): Partial<BookingSearchState> | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(BOOKING_SEARCH_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<BookingSearchState> | null;
        if (!parsed || typeof parsed !== "object") {
            return null;
        }

        const normalized = normalizeBookingSearchState(parsed);

        return hasActiveBookingSearchState(normalized) ? normalized : null;
    } catch {
        return null;
    }
}

export function persistBookingSearchState(
    state?: Partial<BookingSearchState> | null
): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        const normalized = normalizeBookingSearchState(state);

        if (!hasActiveBookingSearchState(normalized)) {
            window.sessionStorage.removeItem(BOOKING_SEARCH_STORAGE_KEY);
            return;
        }

        window.sessionStorage.setItem(
            BOOKING_SEARCH_STORAGE_KEY,
            JSON.stringify(normalized)
        );
    } catch {
        // Ignore storage failures in constrained browsers.
    }
}

export function appendBookingSearchToHref(
    href: string,
    state?: Partial<BookingSearchState> | null
): string {
    if (!href || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href)) {
        return href;
    }

    if (!hasActiveBookingSearchState(state)) {
        return href;
    }

    const [pathWithQuery, hash = ""] = href.split("#", 2);
    const [path, query = ""] = pathWithQuery.split("?", 2);
    const params = new URLSearchParams(query);

    applyBookingSearchStateToParams(params, state, {
        includeDefaults: false,
        preserveExisting: true,
    });

    const nextQuery = params.toString();

    return `${path}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}
