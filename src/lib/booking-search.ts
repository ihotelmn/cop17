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
    from: "2026-08-17",
    to: "2026-08-28",
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

function normalizeDateOrder(from?: string, to?: string) {
    if (!from || !to) {
        return { from, to };
    }

    if (from <= to) {
        return { from, to };
    }

    return {
        from: to,
        to: from,
    };
}

function toDayKey(date: Date) {
    return format(date, "yyyy-MM-dd");
}

export function getNextBookingDateRange(
    currentRange: DateRange | undefined,
    clickedDay: Date | undefined
): DateRange | undefined {
    if (!clickedDay) {
        return currentRange;
    }

    if (!currentRange?.from || currentRange.to) {
        return { from: clickedDay, to: undefined };
    }

    if (toDayKey(clickedDay) <= toDayKey(currentRange.from)) {
        return { from: clickedDay, to: undefined };
    }

    return {
        from: currentRange.from,
        to: clickedDay,
    };
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

    const normalizedDates = normalizeDateOrder(from, to);

    if (normalizedDates.from) {
        state.from = normalizedDates.from;
    }

    if (normalizedDates.to) {
        state.to = normalizedDates.to;
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
    const hasExplicitDateKeys = Boolean(
        state &&
        (Object.prototype.hasOwnProperty.call(state, "from") ||
            Object.prototype.hasOwnProperty.call(state, "to"))
    );

    const normalizedDates = normalizeDateOrder(
        cleanDate(state?.from) ?? (hasExplicitDateKeys ? undefined : DEFAULT_BOOKING_SEARCH_STATE.from),
        cleanDate(state?.to) ?? (hasExplicitDateKeys ? undefined : DEFAULT_BOOKING_SEARCH_STATE.to)
    );

    return {
        query: cleanText(state?.query) ?? DEFAULT_BOOKING_SEARCH_STATE.query,
        from: normalizedDates.from,
        to: normalizedDates.to,
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
    const hasExplicitAdults = state?.adults !== undefined && state?.adults !== null;
    const hasExplicitChildren = state?.children !== undefined && state?.children !== null;
    const hasExplicitRooms = state?.rooms !== undefined && state?.rooms !== null;

    const normalizedAdults = hasExplicitAdults
        ? cleanNumber(state?.adults, DEFAULT_BOOKING_SEARCH_STATE.adults, 1, 10)
        : DEFAULT_BOOKING_SEARCH_STATE.adults;
    const normalizedChildren = hasExplicitChildren
        ? cleanNumber(state?.children, DEFAULT_BOOKING_SEARCH_STATE.children, 0, 10)
        : DEFAULT_BOOKING_SEARCH_STATE.children;
    const normalizedRooms = hasExplicitRooms
        ? cleanNumber(state?.rooms, DEFAULT_BOOKING_SEARCH_STATE.rooms, 1, 10)
        : DEFAULT_BOOKING_SEARCH_STATE.rooms;

    return Boolean(
        cleanText(state?.query) ||
        cleanDate(state?.from) ||
        cleanDate(state?.to) ||
        (hasExplicitAdults && normalizedAdults !== DEFAULT_BOOKING_SEARCH_STATE.adults) ||
        (hasExplicitChildren && normalizedChildren !== DEFAULT_BOOKING_SEARCH_STATE.children) ||
        (hasExplicitRooms && normalizedRooms !== DEFAULT_BOOKING_SEARCH_STATE.rooms)
    );
}

function isDefaultOnlyBookingSearchState(
    state?: Partial<BookingSearchState> | null
): boolean {
    const normalized = normalizeBookingSearchState(state);

    return (
        normalized.query === DEFAULT_BOOKING_SEARCH_STATE.query &&
        normalized.from === DEFAULT_BOOKING_SEARCH_STATE.from &&
        normalized.to === DEFAULT_BOOKING_SEARCH_STATE.to &&
        normalized.adults === DEFAULT_BOOKING_SEARCH_STATE.adults &&
        normalized.children === DEFAULT_BOOKING_SEARCH_STATE.children &&
        normalized.rooms === DEFAULT_BOOKING_SEARCH_STATE.rooms
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

        if (isDefaultOnlyBookingSearchState(normalized)) {
            window.sessionStorage.removeItem(BOOKING_SEARCH_STORAGE_KEY);
            return null;
        }

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

        if (!hasActiveBookingSearchState(normalized) || isDefaultOnlyBookingSearchState(normalized)) {
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
