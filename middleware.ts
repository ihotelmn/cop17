import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getCanonicalUrl, isLegacyAppHost } from "@/lib/site-config";

function getLegacyDomainRedirect(request: NextRequest) {
    if (!isLegacyAppHost(request.nextUrl.hostname)) {
        return null;
    }

    if (request.nextUrl.pathname.startsWith("/api/")) {
        return null;
    }

    return getCanonicalUrl(`${request.nextUrl.pathname}${request.nextUrl.search}`);
}

export async function middleware(request: NextRequest) {
    const redirectUrl = getLegacyDomainRedirect(request);

    if (redirectUrl) {
        return NextResponse.redirect(redirectUrl, 308);
    }

    return updateSession(request);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
