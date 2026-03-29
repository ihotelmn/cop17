import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/site-config";

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

export default function sitemap(): MetadataRoute.Sitemap {
    const appUrl = getPublicAppUrl();
    const now = new Date();

    return PUBLIC_ROUTES.map((path) => ({
        url: `${appUrl}${path}`,
        lastModified: now,
        changeFrequency: path === "" || path === "/hotels" ? "daily" : "weekly",
        priority: path === "" ? 1 : path === "/hotels" ? 0.9 : 0.7,
    }));
}
