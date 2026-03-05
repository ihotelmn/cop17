import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    const productionUrl = 'https://cop17.ihotel.mn';
    const origin = process.env.NEXT_PUBLIC_APP_URL || productionUrl;

    if (code) {
        const supabase = await createClient();
        console.log("Exchanging code for session on origin:", origin);
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
