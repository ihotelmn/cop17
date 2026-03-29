import { normalizeEnvValue } from "@/lib/env";

export const DEFAULT_APP_URL = "https://hotel.unccdcop17.org";

const LEGACY_APP_HOSTS = new Set([
    "cop17.ihotel.mn",
    "www.cop17.ihotel.mn",
]);

function stripTrailingSlash(value: string) {
    return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeHost(host?: string | null) {
    return (host || "").trim().toLowerCase().replace(/:\d+$/, "");
}

function getCanonicalBaseUrl() {
    return new URL(`${getPublicAppUrl()}/`);
}

export function getPublicAppUrl(override?: string | null) {
    return stripTrailingSlash(
        normalizeEnvValue(override) ||
        normalizeEnvValue(process.env.NEXT_PUBLIC_APP_URL) ||
        DEFAULT_APP_URL
    );
}

export function isLegacyAppHost(host?: string | null) {
    return LEGACY_APP_HOSTS.has(normalizeHost(host));
}

export function getCanonicalUrl(pathOrUrl?: string | URL | null) {
    const base = getCanonicalBaseUrl();

    if (!pathOrUrl) {
        return new URL(base.toString());
    }

    const resolved = pathOrUrl instanceof URL
        ? new URL(pathOrUrl.toString())
        : new URL(pathOrUrl, base);

    if (isLegacyAppHost(resolved.hostname)) {
        resolved.protocol = base.protocol;
        resolved.host = base.host;
    }

    return resolved;
}

export function getCanonicalAppHost() {
    return getCanonicalUrl().hostname;
}

export function getPublicSupportEmail() {
    return normalizeEnvValue(process.env.NEXT_PUBLIC_SUPPORT_EMAIL) || `support@${getCanonicalAppHost()}`;
}

export function getPublicSupportMailto() {
    return `mailto:${getPublicSupportEmail()}`;
}

export function getTransactionalFromEmail() {
    return normalizeEnvValue(process.env.EMAIL_FROM) || `COP17 Mongolia <noreply@${getCanonicalAppHost()}>`;
}
