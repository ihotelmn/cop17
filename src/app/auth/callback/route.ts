import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeNextPath(next: string | null) {
    if (!next || !next.startsWith("/") || next.startsWith("//")) {
        return "/";
    }

    return next;
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const { searchParams } = requestUrl;
    const code = searchParams.get("code");
    const next = normalizeNextPath(searchParams.get("next"));
    const origin = requestUrl.origin;

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();

            if (user && next === "/") {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                const destination = profile?.role === "admin" || profile?.role === "super_admin" || profile?.role === "liaison"
                    ? "/admin"
                    : "/";

                return NextResponse.redirect(`${origin}${destination}`);
            }

            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error("Auth Callback Error (Exchange Code):", error.message);
            return NextResponse.redirect(`${origin}/auth/auth-code-error?message=${encodeURIComponent(error.message)}`);
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error?message=No+code+provided`);
}
