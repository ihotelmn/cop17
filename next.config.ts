import type { NextConfig } from "next";

/**
 * Baseline security headers. CSP is intentionally omitted for now because
 * Google Maps + Leaflet + Supabase Realtime each require a careful allowlist
 * that would need a per-deploy audit. Track CSP as follow-up work.
 *
 * What we set:
 *   - Strict-Transport-Security: force HTTPS for 2y + preload eligible
 *   - X-Frame-Options: prevent clickjacking against /admin and checkout
 *   - X-Content-Type-Options: disable MIME sniffing
 *   - Referrer-Policy: don't leak full URL when delegates click outbound links
 *   - Permissions-Policy: explicitly deny sensitive browser APIs we don't use
 */
const SECURITY_HEADERS = [
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Permissions-Policy",
        value:
            "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), accelerometer=()",
    },
];

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "ybwylibmckofuvktvihs.supabase.co" },
            { protocol: "https", hostname: "*.supabase.co" },
            { protocol: "https", hostname: "images.unsplash.com" },
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
            { protocol: "https", hostname: "maps.googleapis.com" },
        ],
    },
    async headers() {
        return [
            {
                // Apply security headers to every route except Next static assets (which Next auto-handles).
                source: "/:path*",
                headers: SECURITY_HEADERS,
            },
        ];
    },
};

export default nextConfig;
