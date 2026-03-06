import { Skeleton } from "@/components/ui/skeleton";
import { Search, Hotel, Filter } from "lucide-react";

export default function HomeLoading() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-zinc-950">
            {/* Hero Skeleton */}
            <div className="relative z-10 max-w-5xl w-full text-center pt-32 pb-40 space-y-8">
                <div className="flex justify-center">
                    <Skeleton className="h-14 w-64 rounded-2xl bg-white/10" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-20 w-3/4 mx-auto rounded-2xl bg-white/10" />
                    <Skeleton className="h-20 w-1/2 mx-auto rounded-2xl bg-white/10" />
                </div>
                <Skeleton className="h-8 w-2/3 mx-auto rounded-lg bg-white/10" />
            </div>

            {/* Content Section Skeleton */}
            <div className="w-full bg-zinc-50 dark:bg-zinc-950 py-16 -mt-10 relative z-20 rounded-t-[3rem] shadow-2xl">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Search Bar Skeleton */}
                    <div className="-mt-32 mb-16 relative z-30">
                        <Skeleton className="h-24 w-full rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl" />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-10">
                        {/* Sidebar Skeleton */}
                        <aside className="hidden lg:block w-[280px] shrink-0 space-y-6">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800" />
                            ))}
                        </aside>

                        {/* Hotel List Skeleton */}
                        <div className="flex-1 space-y-6">
                            <div className="flex justify-between items-center mb-8">
                                <Skeleton className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                                    <Skeleton className="h-10 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                                </div>
                            </div>

                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col md:flex-row gap-6 animate-pulse">
                                    <div className="w-full md:w-72 h-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl shrink-0" />
                                    <div className="flex-1 space-y-4 py-2">
                                        <div className="h-8 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                                        <div className="h-4 w-1/2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="h-12 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl" />
                                            <div className="h-12 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
