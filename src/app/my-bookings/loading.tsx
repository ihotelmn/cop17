export default function MyBookingsLoading() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 pt-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mt-8 mb-12">
                    <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                    <div className="h-5 w-72 bg-zinc-100 dark:bg-zinc-800/50 rounded mt-3 animate-pulse" />
                </div>
                <div className="grid gap-8">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col md:flex-row animate-pulse">
                            <div className="w-full md:w-64 h-56 md:h-auto bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                            <div className="flex-1 p-8 space-y-6">
                                <div className="flex justify-between">
                                    <div className="space-y-2">
                                        <div className="h-7 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                        <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                                    </div>
                                    <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                </div>
                                <div className="grid grid-cols-2 gap-6 mt-4">
                                    <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                                    <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                                </div>
                                <div className="flex gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="h-11 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                                    <div className="h-11 w-40 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
