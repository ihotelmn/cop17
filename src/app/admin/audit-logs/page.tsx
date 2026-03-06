import { createClient as createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Activity } from "lucide-react";
import { AuditLogDetails } from "./audit-log-details";

export default async function AuditLogsPage() {
    // 1. Verify User Role using standard client (secure)
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
        redirect("/");
    }

    // 2. Fetch logs with limit
    const { data: logs, error } = await supabaseAdmin
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching audit logs:", error);
        return <div className="text-red-500">Failed to load audit logs.</div>;
    }

    // Build user map for display
    const userIds = Array.from(new Set(logs.map((log: any) => log.changed_by).filter(Boolean))) as string[];
    let userMap = new Map<string, string>();

    if (userIds.length > 0) {
        const { data: users } = await supabaseAdmin
            .from("profiles")
            .select("id, email")
            .in("id", userIds);

        if (users) {
            userMap = new Map(users.map((u: any) => [u.id, u.email]));
        }
    }

    // Sanitize PII from log data before sending to client
    const SENSITIVE_FIELDS = [
        "guest_email", "guest_name", "guest_passport_encrypted",
        "guest_phone_encrypted", "special_requests_encrypted", "email"
    ];

    function sanitizeData(data: any): any {
        if (!data || typeof data !== "object") return data;
        const sanitized = { ...data };
        for (const field of SENSITIVE_FIELDS) {
            if (field in sanitized) {
                sanitized[field] = "[REDACTED]";
            }
        }
        return sanitized;
    }

    // De-duplicate consecutive identical action+table entries
    const processedLogs = logs.map((log: any) => ({
        ...log,
        new_data: sanitizeData(log.new_data),
        old_data: sanitizeData(log.old_data),
        changed_by_display: userMap.get(log.changed_by) || "System",
    }));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">System Audit Logs</h2>
                    <p className="text-zinc-500 mt-1">Track all critical system changes. PII fields are automatically redacted.</p>
                </div>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded-lg font-mono">
                    Showing latest {processedLogs.length} entries
                </span>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Recent Activity
                    </CardTitle>
                    <CardDescription>Sensitive fields (email, passport, phone) are automatically redacted.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableHead className="text-zinc-400 w-[140px]">Time</TableHead>
                                <TableHead className="text-zinc-400 w-[90px]">Action</TableHead>
                                <TableHead className="text-zinc-400 w-[150px]">Table / Record</TableHead>
                                <TableHead className="text-zinc-400 w-[140px]">Changed By</TableHead>
                                <TableHead className="text-zinc-400">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No activity recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                processedLogs.map((log: any) => (
                                    <TableRow key={log.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                        <TableCell className="text-zinc-300 whitespace-nowrap text-xs">
                                            {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${log.action === "INSERT" ? "bg-green-900/30 text-green-400" :
                                                log.action === "DELETE" ? "bg-red-900/30 text-red-400" :
                                                    "bg-blue-900/30 text-blue-400"
                                                }`}>
                                                {log.action}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-zinc-300">
                                            <div className="font-mono text-xs">{log.table_name}</div>
                                            <div className="text-xs text-zinc-500">{log.record_id?.slice(0, 8)}...</div>
                                        </TableCell>
                                        <TableCell className="text-zinc-300 text-xs">
                                            {log.changed_by_display}
                                        </TableCell>
                                        <TableCell>
                                            <AuditLogDetails data={log.new_data} />
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
