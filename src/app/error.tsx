"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4 text-center">
            <div className="space-y-6 max-w-md">
                <h1 className="text-9xl font-black text-red-900/20 select-none">
                    500
                </h1>

                <h2 className="text-3xl font-bold tracking-tight text-red-500">
                    Something went wrong!
                </h2>

                <p className="text-zinc-400 text-lg">
                    Our system encountered an unexpected error. We've been notified and are looking into it.
                </p>

                <div className="pt-8">
                    <Button
                        onClick={() => reset()}
                        size="lg"
                        variant="outline"
                        className="gap-2 border-red-900/50 hover:bg-red-950/30 text-red-400 hover:text-red-300"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
}
