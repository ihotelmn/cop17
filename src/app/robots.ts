import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
    const appUrl = getPublicAppUrl();

    return {
        rules: [
            {
                userAgent: "*",
                allow: [
                    "/",
                    "/hotels",
                    "/group-reservations",
                    "/shuttle",
                    "/support",
                    "/terms",
                    "/privacy",
                    "/tours",
                ],
                disallow: [
                    "/admin",
                    "/auth",
                    "/login",
                    "/signup",
                    "/my-bookings",
                    "/mock-payment",
                ],
            },
        ],
        sitemap: `${appUrl}/sitemap.xml`,
        host: appUrl,
    };
}
