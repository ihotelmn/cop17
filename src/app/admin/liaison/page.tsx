import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
    Users,
    Calendar,
    Building2,
    CheckCircle2,
    Clock,
    ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export default async function LiaisonDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const adminSupabase = getSupabaseAdmin();
    const { data: requests, error } = await adminSupabase
        .from("group_requests")
        .select("*")
        .eq("assigned_liaison_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Dashboard Error:", error);
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white">Liaison Dashboard</h2>
                    <p className="text-zinc-400">Welcome back. Manage your assigned delegations and groups.</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-3 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                        {requests?.length || 0}
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-500">Active Tasks</p>
                        <p className="text-white font-bold text-sm">Assigned Groups</p>
                    </div>
                </div>
            </div>

            {!requests || requests.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800 border-dashed py-20">
                    <CardContent className="flex flex-col items-center justify-center text-center">
                        <Users className="h-16 w-16 text-zinc-700 mb-4" />
                        <h3 className="text-xl font-bold text-zinc-400">No Assignments Found</h3>
                        <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                            You haven' t been assigned to any group requests yet.
                            Check the <Link href="/admin/group-requests" className="text-blue-500 hover:underline">main request list</Link> for new submissions.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.map((request) => (
                        <Link
                            key={request.id}
                            href={`/admin/group-requests/${request.id}`}
                            className="block group"
                        >
                            <Card className="bg-zinc-900 border-zinc-800 group-hover:bg-zinc-800/50 transition-all cursor-pointer overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row items-stretch">
                                        <div className="md:w-1 bg-blue-600" />
                                        <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold text-white tracking-tight">{request.organization_name}</h3>
                                                    <StatusBadge status={request.status} />
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                                                    <span className="flex items-center gap-1.5 border-r border-zinc-800 pr-4">
                                                        <Users className="h-4 w-4 text-blue-500" />
                                                        {request.guest_count} Delegates
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-4 w-4 text-blue-500" />
                                                        {format(new Date(request.check_in_date), "MMM d")} - {format(new Date(request.check_out_date), "MMM d")}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Last Update</p>
                                                    <p className="text-white text-sm font-medium">{format(new Date(request.created_at), "MMM d, HH:mm")}</p>
                                                </div>
                                                <div className="h-10 w-10 rounded-full border border-zinc-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors">
                                                    <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
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
