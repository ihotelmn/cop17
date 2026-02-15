"use client";

export const dynamic = "force-dynamic";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, AuthState } from "@/app/actions/auth";

const initialState: AuthState = { error: undefined, success: undefined };

export default function LoginPage() {
    // usage of useActionState (React 19)
    const [state, formAction, isPending] = useActionState(loginAction, initialState);

    // We can use isPending directly instead of separate state
    const isLoading = isPending;

    // Simple wrapper if needed, or just pass formAction to form
    const handleSubmit = (payload: FormData) => {
        formAction(payload);
    };
    // Force refresh if user is already logged in (handles "Ghost Session" case)
    React.useEffect(() => {
        const checkSession = async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                // If we are on login page but have a user, it means middleware/RSC is stale.
                // Force a hard refresh to sync state.
                window.location.href = "/dashboard";
            }
        };
        checkSession();
    }, []);


    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[400px] mx-auto"
        >
            <div className="flex flex-col space-y-2 text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Welcome Back
                </h1>
                <p className="text-sm text-muted-foreground">
                    Sign in to access the COP17 administration portal
                </p>
            </div>

            <div className={cn("grid gap-6 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800")}>
                <form action={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="font-semibold text-zinc-700 dark:text-zinc-300">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                placeholder="admin@cop17.mn"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isLoading}
                                required
                                className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" className="font-semibold text-zinc-700 dark:text-zinc-300">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                type="password"
                                autoCapitalize="none"
                                disabled={isLoading}
                                required
                                className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-blue-500"
                            />
                        </div>

                        {state?.error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900">
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                    {state.error}
                                </p>
                            </div>
                        )}

                        <Button disabled={isLoading} variant={"premium" as any} className="h-12 rounded-xl text-base font-bold shadow-lg shadow-blue-500/20 mt-2">
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Sign In
                        </Button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-zinc-900 px-2 text-muted-foreground font-medium">
                            Or
                        </span>
                    </div>
                </div>

                <Button variant={"outline" as any} asChild className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                    <Link href="/signup">
                        Create Guest Account
                    </Link>
                </Button>
            </div>

            <p className="px-8 text-center text-xs text-muted-foreground mt-8">
                By signing in, you agree to our{" "}
                <Link
                    href="/terms"
                    className="underline underline-offset-4 hover:text-blue-500 transition-colors"
                >
                    Terms
                </Link>{" "}
                and{" "}
                <Link
                    href="/privacy"
                    className="underline underline-offset-4 hover:text-blue-500 transition-colors"
                >
                    Privacy Policy
                </Link>
                .
            </p>
        </motion.div>
    );
}
