import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/site-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const PUBLIC_ROUTES = [
    "",
    "/hotels",
    "/group-reservations",
    "/shuttle",
    "/support",
    "/terms",
    "/privacy",
    "/tours",
];

// Revalidate the sitemap once an hour — hotels rarely change, and search
// engines don't need the freshest price.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const appUrl = getPublicAppUrl();
    const now = new Date();

    const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((path) => ({
        url: `${appUrl}${path}`,
        lastModified: now,
        changeFrequency: path === "" || path === "/hotels" ? "daily" : "weekly",
        priority: path === "" ? 1 : path === "/hotels" ? 0.9 : 0.7,
    }));

    // Individual hotel detail pages. SEO-critical — previously omitted.
    let hotelEntries: MetadataRoute.Sitemap = [];
    try {
        const supabase = getSupabaseAdmin();
        const { data: hotels } = await supabase
            .from("hotels")
            .select("id, created_at")
            .eq("is_published", true);

        hotelEntries = (hotels || []).map((h) => ({
            url: `${appUrl}/hotels/${h.id}`,
            lastModified: h.created_at ? new Date(h.created_at) : now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));
    } catch (e) {
        console.error("sitemap: failed to list published hotels", e);
    }

    return [...staticEntries, ...hotelEntries];
}
