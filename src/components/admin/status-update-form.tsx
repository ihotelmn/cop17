"use client";

import { useState } from "react";
import { updateGroupRequestStatusAction } from "@/app/actions/liaison-actions";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle, Save, Loader2 } from "lucide-react";

export function StatusUpdateForm({
    requestId,
    currentStatus,
    currentNotes
}: {
    requestId: string;
    currentStatus: string;
    currentNotes?: string;
}) {
    const [status, setStatus] = useState(currentStatus);
    const [notes, setNotes] = useState(currentNotes || "");
    const [isPending, setIsPending] = useState(false);

    async function handleUpdate() {
        setIsPending(true);
        const result = await updateGroupRequestStatusAction(requestId, status, notes);
        setIsPending(false);

        if (result.success) {
            toast.success("Request status updated successfully");
        } else {
            toast.error(result.error || "Failed to update status");
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-black/20">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Manage Status</h3>
                    <p className="text-xs text-zinc-500">Update reservation progress and internal notes.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Request Status</label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11 rounded-xl">
                            <SelectValue placeholder="Update status..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="pending">
                                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Pending</span>
                            </SelectItem>
                            <SelectItem value="approved">
                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Approved / Assigned</span>
                            </SelectItem>
                            <SelectItem value="completed">
                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500" /> Completed</span>
                            </SelectItem>
                            <SelectItem value="rejected">
                                <span className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Rejected</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Internal Notes</label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about flight numbers, specific needs, or follow-up actions..."
                        className="bg-zinc-950 border-zinc-800 text-white rounded-xl min-h-[120px] p-4 text-sm"
                    />
                </div>

                <Button
                    onClick={handleUpdate}
                    disabled={isPending}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black h-12 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {isPending ? "Saving Changes..." : "Save Progress"}
                </Button>
            </div>
        </div>
    );
}
