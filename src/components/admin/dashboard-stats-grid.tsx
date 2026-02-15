import { RevenueTrendChart, StatusDistributionChart, TopHotelsChart } from "./dashboard-charts";
import { Users, CreditCard, Activity, CalendarCheck, Clock } from "lucide-react";

interface DashboardStats {
    totalBookings: number;
    revenue: number;
    activeGuests: number;
    pendingBookings: number;
    occupancyRate: number;
    revenueTrends: any[];
    statusDistribution: any[];
    topHotels: any[];
}

interface DashboardStatsGridProps {
    stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
    const {
        totalBookings = 0,
        revenue = 0,
        activeGuests = 0,
        pendingBookings = 0,
        occupancyRate = 0,
        revenueTrends = [],
        statusDistribution = [],
        topHotels = []
    } = stats;

    const formattedRevenue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(revenue);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Intelligence</h1>
                <p className="text-muted-foreground mt-2">
                    Real-time analytics and performance metrics for COP17 accommodations.
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-green-600 font-medium uppercase tracking-wider">Live Analytics Active</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <CalendarCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                            <h3 className="text-2xl font-bold">{totalBookings}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                            <h3 className="text-2xl font-bold">{formattedRevenue}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Checked-In</p>
                            <h3 className="text-2xl font-bold">{activeGuests}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
                            <h3 className="text-2xl font-bold">{occupancyRate}%</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="font-semibold text-lg mb-6">Revenue Trends (Last 7 Days)</h3>
                    <RevenueTrendChart data={revenueTrends} />
                </div>
                <div className="col-span-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="font-semibold text-lg mb-6">Booking Status</h3>
                    <StatusDistributionChart data={statusDistribution} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="font-semibold text-lg mb-6">Top Performing Hotels</h3>
                    <TopHotelsChart data={topHotels} />
                </div>
                <div className="col-span-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-lg">System Health</h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                            Operational
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Database</span>
                                <span className="font-medium">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">API Latency</span>
                                <span className="font-medium">24ms</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Encryption</span>
                                <span className="font-medium text-green-600">Active</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Pending Actions</span>
                                <span className={pendingBookings > 0 ? "text-amber-600 font-bold" : "text-zinc-400"}>
                                    {pendingBookings}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Real-time Node</span>
                                <span className="font-medium">Mongolia-East-1</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Last Sync</span>
                                <span className="font-medium">Just now</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

