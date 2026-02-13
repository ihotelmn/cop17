"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BookingSuccessPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
            <div className="text-center space-y-6 max-w-md">
                <div className="mx-auto h-24 w-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Payment Successful!
                </h1>

                <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                    Your booking has been confirmed. A receipt and itinerary have been sent to your email.
                </p>

                <div className="pt-8 space-y-3">
                    <Button asChild className="w-full h-12" size="lg">
                        <Link href="/">
                            Return to Home
                        </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full h-12" size="lg">
                        <Link href="/hotels">
                            Book Another Room
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
