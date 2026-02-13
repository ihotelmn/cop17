"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center space-y-6">
            <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Authentication Error</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    There was a problem confirming your email address. The link might be expired or already used.
                </p>
            </div>

            <div className="flex gap-4">
                <Button asChild variant="default">
                    <Link href="/login">Return to Sign In</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        </div>
    );
}
