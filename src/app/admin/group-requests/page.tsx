import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { format } from "date-fns";
import {
    Users,
    Calendar,
    Building2,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    XCircle,
    UserPlus
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default async function GroupRequestsPage() {
    const adminSupabase = getSupabaseAdmin();

    const { data: requests, error } = await adminSupabase
        .from("group_requests")
        .select(`
            *,
            assigned_liaison:profiles(full_name, email)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching group requests:", error);
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white">Group Requests</h2>
                    <p className="text-zinc-400">Manage high-level delegations and large group bookings.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Pending Requests"
                    value={requests?.filter(r => r.status === 'pending').length || 0}
                    icon={<Clock className="h-5 w-5 text-amber-500" />}
                />
                <StatCard
                    title="Active Assignments"
                    value={requests?.filter(r => r.status === 'approved').length || 0}
                    icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                />
                <StatCard
                    title="Total Guests"
                    value={requests?.reduce((acc, r) => acc + (r.guest_count || 0), 0) || 0}
                    icon={<Users className="h-5 w-5 text-blue-500" />}
                />
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">All Submissions</CardTitle>
                    <CardDescription>Review and assign liaisons to incoming group requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableHead className="text-zinc-400">Organization</TableHead>
                                <TableHead className="text-zinc-400">Dates</TableHead>
                                <TableHead className="text-zinc-400">Guests</TableHead>
                                <TableHead className="text-zinc-400">Status</TableHead>
                                <TableHead className="text-zinc-400">Assigned To</TableHead>
                                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!requests || requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                        No group requests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((request) => (
                                    <TableRow key={request.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    <Building2 className="h-3 w-3 text-blue-500" />
                                                    {request.organization_name}
                                                </div>
                                                <div className="text-xs text-zinc-400">{request.contact_name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-zinc-300 text-sm">
                                                <Calendar className="h-3 w-3 text-zinc-500" />
                                                {format(new Date(request.check_in_date), "MMM d")} - {format(new Date(request.check_out_date), "MMM d, yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-white font-medium">
                                            {request.guest_count} guests
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={request.status} />
                                        </TableCell>
                                        <TableCell className="text-zinc-300 text-sm">
                                            {request.assigned_liaison ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                                        {request.assigned_liaison.full_name[0]}
                                                    </div>
                                                    {request.assigned_liaison.full_name}
                                                </div>
                                            ) : (
                                                <span className="text-zinc-600 italic">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-800">
                                                        <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/group-requests/${request.id}`} className="cursor-pointer">
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/group-requests/${request.id}?assign=true`} className="cursor-pointer text-blue-400">
                                                            Assign Liaison
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                                    <DropdownMenuItem className="text-red-400 cursor-pointer">
                                                        Reject Request
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-zinc-400">{title}</p>
                    {icon}
                </div>
                <div className="text-3xl font-black text-white">{value}</div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        approved: "bg-green-500/10 text-green-500 border-green-500/20",
        rejected: "bg-red-500/10 text-red-500 border-red-500/20",
        completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };

    const className = styles[status as keyof typeof styles] || "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";

    return (
        <Badge variant="outline" className={`${className} capitalize`}>
            {status}
        </Badge>
    );
}
