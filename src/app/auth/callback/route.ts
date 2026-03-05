import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    // Strictly use the production URL or the request origin if env is missing
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://cop17.ihotel.mn";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error("Auth Callback Error (Exchange Code):", error.message);
            return NextResponse.redirect(`${origin}/auth/auth-code-error?message=${encodeURIComponent(error.message)}`);
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error?message=No+code+provided`);
}
