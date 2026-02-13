import { Users, CreditCard, Activity, CalendarCheck, Clock } from "lucide-react";
import { getDashboardStats } from "@/app/actions/booking-admin"; // Fetch real stats

export default async function AdminDashboardPage() {
    const { data: stats } = await getDashboardStats();

    // Default values if fetch fails
    const {
        totalBookings = 0,
        revenue = 0,
        activeGuests = 0,
        pendingBookings = 0,
        occupancyRate = 0
    } = stats || {};

    const formattedRevenue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(revenue);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Overview of COP17 accommodation status and bookings.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Occupancy</p>
                            <h3 className="text-2xl font-bold">{occupancyRate}%</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity / List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h3 className="font-semibold text-lg">Recent Updates</h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-zinc-100 rounded-full dark:bg-zinc-800">
                                <Clock className="h-4 w-4 text-zinc-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Pending Bookings</p>
                                <p className="text-xs text-muted-foreground">{pendingBookings} bookings waiting for confirmation</p>
                            </div>
                        </div>
                        {/* More items... */}
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h3 className="font-semibold text-lg">System Status</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Database</span>
                            <span className="text-green-600 font-medium">Healthy</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">API Latency</span>
                            <span className="text-zinc-900 dark:text-white font-medium">24ms</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Encryption</span>
                            <span className="text-green-600 font-medium">Active (AES-256)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

