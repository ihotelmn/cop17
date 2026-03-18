"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type GoogleAuthButtonProps = {
    label: string;
    next?: string;
    className?: string;
};

function GoogleIcon() {
    return (
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
            <path
                d="M21.35 11.1H12v2.98h5.35c-.23 1.52-1.87 4.45-5.35 4.45-3.22 0-5.85-2.67-5.85-5.96s2.63-5.96 5.85-5.96c1.84 0 3.07.79 3.78 1.46l2.58-2.5C16.72 4.03 14.6 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.64-3.65 8.64-8.8 0-.59-.06-1.04-.14-1.5Z"
                fill="#FFC107"
            />
            <path
                d="M4.04 7.82 6.5 9.63C7.17 7.98 8.47 6.61 12 6.61c1.84 0 3.07.79 3.78 1.46l2.58-2.5C16.72 4.03 14.6 3 12 3 8.55 3 5.57 4.97 4.04 7.82Z"
                fill="#FF3D00"
            />
            <path
                d="M12 21c2.53 0 4.65-.83 6.2-2.25l-2.86-2.35c-.76.53-1.78.9-3.34.9-3.47 0-5.09-2.93-5.35-4.44l-2.44 1.88C5.72 18.02 8.63 21 12 21Z"
                fill="#4CAF50"
            />
            <path
                d="M21.35 11.1H12v2.98h5.35c-.11.74-.56 1.82-1.37 2.37l2.86 2.35c1.66-1.54 2.51-3.81 2.51-6.3 0-.59-.06-1.04-.14-1.5Z"
                fill="#1976D2"
            />
        </svg>
    );
}

function normalizeNextPath(next?: string) {
    if (!next || !next.startsWith("/") || next.startsWith("//")) {
        return "/";
    }

    return next;
}

export function GoogleAuthButton({ label, next = "/", className }: GoogleAuthButtonProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const redirectNext = normalizeNextPath(next);
            const supabase = createClient();
            const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectNext)}`;

            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo,
                    queryParams: {
                        prompt: "select_account",
                    },
                },
            });

            if (oauthError) {
                setError("Google sign-in could not start. Please try again.");
                setIsLoading(false);
            }
        } catch {
            setError("Google sign-in could not start. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Button
                type="button"
                variant="outline"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className={className}
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <GoogleIcon />
                )}
                <span className="ml-2">{label}</span>
            </Button>
            {error ? (
                <p className="text-xs font-medium text-red-500">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
