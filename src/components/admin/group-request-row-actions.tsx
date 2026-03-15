"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { rejectGroupRequestAction } from "@/app/actions/liaison-actions";

interface GroupRequestRowActionsProps {
    requestId: string;
    canManageAssignments: boolean;
}

export function GroupRequestRowActions({ requestId, canManageAssignments }: GroupRequestRowActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const handleReject = () => {
        startTransition(async () => {
            const result = await rejectGroupRequestAction(requestId);

            if (result.success) {
                toast.success("Group request rejected");
                setOpen(false);
                router.refresh();
                return;
            }

            toast.error(result.error || "Failed to reject request");
        });
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-800" disabled={isPending}>
                    <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/admin/group-requests/${requestId}`} className="cursor-pointer">
                        View Details
                    </Link>
                </DropdownMenuItem>
                {canManageAssignments && (
                    <>
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/group-requests/${requestId}?assign=true`} className="cursor-pointer text-blue-400">
                                Assign Liaison
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-400 focus:text-red-300"
                            onSelect={(event) => {
                                event.preventDefault();
                                handleReject();
                            }}
                        >
                            Reject Request
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
