import Link from "next/link";
import { Snowflake } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex border-r border-zinc-200 dark:border-zinc-800 lg:border-r-0">
                <div className="absolute inset-0 bg-zinc-900/40" />
                <div className="absolute inset-0 bg-[url('/auth-bg.png')] bg-cover bg-center brightness-75 contrast-110" />
                <Link href="/" className="relative z-20 flex items-center text-lg font-bold tracking-tight">
                    <Snowflake className="mr-2 h-6 w-6 text-blue-400" />
                    COP17 Mongolia
                </Link>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2 backdrop-blur-sm bg-black/30 p-6 rounded-2xl border border-white/10">
                        <p className="text-lg font-medium leading-relaxed">
                            &ldquo;Experience the legendary hospitality of the steppes. We welcome the world's leaders to the land of the eternal blue sky.&rdquo;
                        </p>
                        <footer className="text-sm font-bold text-blue-200">Ulaanbaatar Organizers</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8 relative h-full flex items-center justify-center bg-background">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    {children}
                </div>
            </div>
        </div>
    );
}
