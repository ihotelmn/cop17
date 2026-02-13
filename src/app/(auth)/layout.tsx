import Link from "next/link";
import { Snowflake } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549637642-90187f64f420?q=80&w=2948')] bg-cover bg-center opacity-50 contrast-125 saturate-0" />
                <Link href="/" className="relative z-20 flex items-center text-lg font-medium">
                    <Snowflake className="mr-2 h-6 w-6" />
                    COP17 Mongolia
                </Link>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;The land of the eternal blue sky welcomes the world's leaders.&rdquo;
                        </p>
                        <footer className="text-sm">Ulaanbaatar Organizers</footer>
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
