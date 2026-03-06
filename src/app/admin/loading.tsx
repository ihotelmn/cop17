export default function AdminLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-3">
                        <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-8 w-14 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-14 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
