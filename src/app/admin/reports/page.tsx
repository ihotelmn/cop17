import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";

export default async function ReportsPage() {
    const supabase = await createClient();

    // 1. Get User & Role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div className="text-red-500">Unauthorized</div>;

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile) return <div className="text-red-500">Profile not found</div>;

    // 2. Build Query
    let query = supabase
        .from("bookings")
        .select("*, rooms!inner(name, hotel_id, hotels!inner(name, owner_id))")
        .order("created_at", { ascending: false });

    // Filter for Tour Companies (non-super-admin)
    if (profile.role !== 'super_admin') {
        query = query.eq('rooms.hotels.owner_id', user.id);
    }

    const { data: bookings, error } = await query;

    if (error) {
        console.error("Error fetching reports:", error);
        return <div className="text-red-500">Failed to load reports.</div>;
    }

    // Calculate Stats
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === "confirmed" || b.status === "paid");
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    const pendingBookings = bookings.filter(b => b.status === "pending").length;

    // Recent Bookings (Last 5)
    const recentBookings = bookings.slice(0, 10);

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight text-white">Reports & Analytics</h2>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-zinc-500">Confirmed bookings only</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalBookings}</div>
                        <p className="text-xs text-zinc-500">{pendingBookings} pending payment</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Pending</CardTitle>
                        <Users className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{pendingBookings}</div>
                        <p className="text-xs text-zinc-500">Awaiting payment</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Avg. Booking Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            ${confirmedBookings.length > 0 ? (totalRevenue / confirmedBookings.length).toFixed(0) : 0}
                        </div>
                        <p className="text-xs text-zinc-500">Per confirmed transaction</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions Table */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Recent Transactions</CardTitle>
                    <CardDescription>Latest booking attempts and their status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableHead className="text-zinc-400">Date</TableHead>
                                <TableHead className="text-zinc-400">Hotel / Room</TableHead>
                                <TableHead className="text-zinc-400">Guest</TableHead>
                                <TableHead className="text-zinc-400">Amount</TableHead>
                                <TableHead className="text-zinc-400">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentBookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No bookings found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentBookings.map((booking) => (
                                    <TableRow key={booking.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                        <TableCell className="text-zinc-300">
                                            {format(new Date(booking.created_at), "MMM d, HH:mm")}
                                        </TableCell>
                                        <TableCell className="text-zinc-300">
                                            <div className="font-medium text-white">{booking.rooms?.hotels?.name}</div>
                                            <div className="text-xs text-zinc-500">{booking.rooms?.name}</div>
                                        </TableCell>
                                        <TableCell className="text-zinc-300">
                                            <span className="font-mono text-xs bg-zinc-800 px-1 rounded text-zinc-400">
                                                HIDDEN (PII)
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-zinc-300">
                                            ${booking.total_price}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={booking.status} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function StatusBadge({ status }: { status: string | null }) {
    if (!status) return null;

    const styles = {
        confirmed: "bg-emerald-900/30 text-emerald-400 border-emerald-900/50",
        paid: "bg-emerald-900/30 text-emerald-400 border-emerald-900/50",
        pending: "bg-amber-900/30 text-amber-400 border-amber-900/50",
        cancelled: "bg-red-900/30 text-red-400 border-red-900/50",
    };

    const className = styles[status as keyof typeof styles] || "bg-zinc-800 text-zinc-400";

    return (
        <span className={`px-2 py-1 rounded-full text-xs border ${className} capitalize`}>
            {status}
        </span>
    );
}
