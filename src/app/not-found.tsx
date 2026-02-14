import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4 text-center">
            <div className="space-y-6 max-w-md">
                {/* Large 404 Typography */}
                <h1 className="text-9xl font-black text-zinc-900 drop-shadow-[0_2px_2px_rgba(255,255,255,0.1)] select-none">
                    404
                </h1>

                <h2 className="text-3xl font-bold tracking-tight">
                    Lost in the Steppes?
                </h2>

                <p className="text-zinc-400 text-lg">
                    The page you are looking for seems to have wandered off. Let's get you back to the main camp.
                </p>

                <div className="pt-8">
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                            Return Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
