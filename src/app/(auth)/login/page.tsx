"use client";

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



    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Sign In
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your credentials to access the dashboard
                </p>
            </div>
            <div className={cn("grid gap-6")}>
                <form action={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
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
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                type="password"
                                autoCapitalize="none"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {state?.error && (
                            <p className="text-sm text-red-500 font-medium">
                                {state.error}
                            </p>
                        )}

                        <Button disabled={isLoading} variant={"premium" as any}>
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Sign In to Dashboard
                        </Button>
                    </div>
                </form>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>
                <Button variant={"outline" as any} asChild>
                    <Link href="/signup">
                        Create Guest Account
                    </Link>
                </Button>
            </div>

            <p className="px-8 text-center text-sm text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <Link
                    href="/terms"
                    className="underline underline-offset-4 hover:text-primary"
                >
                    Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                    href="/privacy"
                    className="underline underline-offset-4 hover:text-primary"
                >
                    Privacy Policy
                </Link>
                .
            </p>
        </motion.div>
    );
}
