"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/actions/super-admin";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Shield, User, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
    { value: "super_admin", label: "Super Admin", icon: <ShieldAlert className="h-3 w-3 mr-1" />, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
    { value: "admin", label: "Hotel Admin", icon: <Shield className="h-3 w-3 mr-1" />, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { value: "liaison", label: "Liaison", icon: <Users className="h-3 w-3 mr-1" />, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
    { value: "vip", label: "VIP guest", icon: <Shield className="h-3 w-3 mr-1" />, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { value: "guest", label: "Regular Guest", icon: <User className="h-3 w-3 mr-1" />, color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20" },
];

export function UserRoleSelector({ userId, currentRole }: { userId: string; currentRole: string }) {
    const [isPending, startTransition] = useTransition();
    const [val, setVal] = useState(currentRole);

    const handleUpdate = (newRole: string) => {
        setVal(newRole);
        startTransition(async () => {
            const res = await updateUserRole(userId, newRole);
            if (res.success) {
                toast.success("User role updated successfully");
            } else {
                toast.error(res.error || "Failed to update role");
                setVal(currentRole); // Revert
            }
        });
    };

    const currentRoleData = roles.find(r => r.value === val) || roles[roles.length - 1];

    return (
        <Select value={val} onValueChange={handleUpdate} disabled={isPending}>
            <SelectTrigger className={cn("w-[160px] h-8 bg-transparent border-none p-0 focus:ring-0", isPending && "opacity-50")}>
                <Badge variant="outline" className={cn("font-bold px-2 py-0.5", currentRoleData.color)}>
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : currentRoleData.icon}
                    <SelectValue />
                </Badge>
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800">
                {roles.map((r) => (
                    <SelectItem
                        key={r.value}
                        value={r.value}
                        className="text-zinc-400 focus:bg-zinc-900 focus:text-white"
                    >
                        <div className="flex items-center gap-2">
                            {r.label}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
