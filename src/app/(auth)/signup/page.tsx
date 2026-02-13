"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction, AuthState } from "@/app/actions/auth";

const initialState: AuthState = { error: undefined, success: undefined };

export default function SignupPage() {
    const [state, formAction, isPending] = useActionState(signupAction, initialState);
    const isLoading = isPending;

    const handleSubmit = (payload: FormData) => {
        formAction(payload);
    };



    if (state?.success) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-emerald-500">Check Your Email</h1>
                <p className="text-muted-foreground w-[350px]">
                    {state.message}
                </p>
                <Link href="/login">
                    <Button variant="outline">Back to Login</Button>
                </Link>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Create an Account
                </h1>
                <p className="text-sm text-muted-foreground">
                    Register to book your stay for COP17
                </p>
            </div>
            <div className={cn("grid gap-6")}>
                <form action={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="John Doe"
                                type="text"
                                autoCapitalize="words"
                                autoComplete="name"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                placeholder="name@example.com"
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
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {state?.error && (
                            <p className="text-sm text-red-500 font-medium">
                                {state.error}
                            </p>
                        )}

                        <Button disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Sign Up
                        </Button>
                    </div>
                </form>

                <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="underline hover:text-primary">
                        Sign In
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
