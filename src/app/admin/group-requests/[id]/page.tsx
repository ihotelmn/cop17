import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { format } from "date-fns";
import {
    ChevronLeft,
    Building2,
    Users,
    Calendar,
    Phone,
    Mail,
    MessageSquare,
    DollarSign,
    ShieldCheck,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignLiaisonForm } from "@/components/admin/assign-liaison-form";
import { StatusUpdateForm } from "@/components/admin/status-update-form";
import { getLiaisonsAction } from "@/app/actions/liaison-actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default async function GroupRequestDetailPage({
    params
}: {
    params: { id: string }
}) {
    const adminSupabase = getSupabaseAdmin();
    const requestId = params.id;

    const { data: request, error } = await adminSupabase
        .from("group_requests")
        .select(`
            *,
            assigned_liaison:profiles(id, full_name, email)
        `)
        .eq("id", requestId)
        .single();

    if (error || !request) {
        if (error) console.error("Error fetching group request detail:", error);
        notFound();
    }

    const liaisons = await getLiaisonsAction();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Link
                href="/admin/group-requests"
                className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
            >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Requests
            </Link>

            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-white">{request.organization_name}</h2>
                        <StatusBadge status={request.status} />
                    </div>
                    <p className="text-zinc-400">Request submitted on {format(new Date(request.created_at), "PPP")}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                    {/* Organization Info */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-500" />
                                Organization Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoItem icon={<Users className="h-4 w-4" />} label="Guest Count" value={`${request.guest_count} Delegates`} />
                            <InfoItem icon={<Phone className="h-4 w-4" />} label="Contact Name" value={request.contact_name} />
                            <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={request.contact_email} />
                            <InfoItem icon={<Phone className="h-4 w-4" />} label="Phone" value={request.contact_phone} />
                        </CardContent>
                    </Card>

                    {/* Stay Requirements */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                Stay Requirements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-zinc-800 pb-4">
                                <div className="text-center flex-1">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Check-in</p>
                                    <p className="text-white font-bold">{format(new Date(request.check_in_date), "MMM d, yyyy")}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-zinc-700 mx-4" />
                                <div className="text-center flex-1">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Check-out</p>
                                    <p className="text-white font-bold">{format(new Date(request.check_out_date), "MMM d, yyyy")}</p>
                                </div>
                            </div>
                            <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Budget Preference" value={request.budget_range || "Not specified"} />
                            <InfoItem icon={<Building2 className="h-4 w-4" />} label="Preferred Hotel" value={request.preferred_hotel || "Any"} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    {/* Assignment Action */}
                    <AssignLiaisonForm
                        requestId={request.id}
                        liaisons={liaisons}
                        currentLiaisonId={request.assigned_liaison_id}
                    />

                    {/* Status & Notes Management */}
                    <StatusUpdateForm
                        requestId={request.id}
                        currentStatus={request.status}
                        currentNotes={request.notes}
                    />

                    {/* Additional Info */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-blue-500" />
                                Special Requirements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-400 text-sm leading-relaxed min-h-[100px]">
                                {request.special_requirements || "No additional requirements provided."}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">{label}</p>
                <p className="text-zinc-200 font-medium">{value}</p>
            </div>
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
        <Badge variant="outline" className={`${className} capitalize px-3 py-1 text-xs font-bold`}>
            {status}
        </Badge>
    );
}
