"use client";

import { useState } from "react";
import { assignLiaisonAction } from "@/app/actions/liaison-actions";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

interface Liaison {
    id: string;
    full_name: string;
    email: string;
}

export function AssignLiaisonForm({
    requestId,
    liaisons,
    currentLiaisonId
}: {
    requestId: string;
    liaisons: Liaison[];
    currentLiaisonId?: string;
}) {
    const [selectedLiaison, setSelectedLiaison] = useState(currentLiaisonId || "");
    const [isPending, setIsPending] = useState(false);

    async function handleAssign() {
        if (!selectedLiaison) {
            toast.error("Please select a liaison first");
            return;
        }

        setIsPending(true);
        const result = await assignLiaisonAction(requestId, selectedLiaison);
        setIsPending(false);

        if (result.success) {
            toast.success("Liaison assigned successfully");
        } else {
            toast.error(result.error || "Failed to assign liaison");
        }
    }

    return (
        <div className="flex flex-col gap-4 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 text-white font-bold">
                <UserPlus className="h-5 w-5 text-blue-500" />
                Assign Liaison
            </div>

            <div className="flex gap-2">
                <Select value={selectedLiaison} onValueChange={setSelectedLiaison}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-11">
                        <SelectValue placeholder="Select a liaison..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {liaisons.map((liaison) => (
                            <SelectItem key={liaison.id} value={liaison.id}>
                                {liaison.full_name} ({liaison.email})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    onClick={handleAssign}
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isPending ? "Assigning..." : "Assign"}
                </Button>
            </div>

            <p className="text-xs text-zinc-500 italic">
                The assigned liaison will be notified and will manage this group's requirements.
            </p>
        </div>
    );
}
