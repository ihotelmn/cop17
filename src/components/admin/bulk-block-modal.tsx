"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Loader2 } from "lucide-react";
import { bulkBlockRooms } from "@/app/actions/bulk-admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BulkBlockModalProps {
    rooms: any[];
}

export function BulkBlockModal({ rooms }: BulkBlockModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("Administrative Block");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRooms.length === 0) {
            toast.error("Please select at least one room");
            return;
        }
        if (!startDate || !endDate) {
            toast.error("Please select both start and end dates");
            return;
        }

        setLoading(true);
        const res = await bulkBlockRooms(selectedRooms, startDate, endDate, reason);
        setLoading(false);

        if (res.success) {
            toast.success("Rooms blocked successfully");
            setOpen(false);
            router.refresh();
        } else {
            toast.error(res.error || "Failed to block rooms");
        }
    };

    const toggleRoom = (id: string) => {
        setSelectedRooms(prev =>
            prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50 bg-white dark:bg-zinc-900 dark:border-amber-900/50 dark:hover:bg-amber-900/20">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Bulk Block Rooms
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Bulk Occupancy Management</DialogTitle>
                        <DialogDescription>
                            Mark multiple rooms as blocked for a specific period. This will reduce availability.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label>Select Rooms to Block</Label>
                            <div className="max-h-[150px] overflow-y-auto border rounded-md p-3 space-y-2 bg-zinc-50 dark:bg-zinc-900/50">
                                {rooms.map(room => (
                                    <div key={room.roomId} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`room-${room.roomId}`}
                                            checked={selectedRooms.includes(room.roomId)}
                                            onChange={() => toggleRoom(room.roomId)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                        <label htmlFor={`room-${room.roomId}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {room.roomName} <span className="text-xs text-muted-foreground">({room.hotelName})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start">Start Date</Label>
                                <Input
                                    id="start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end">End Date</Label>
                                <Input
                                    id="end"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reason">Reason (Internal Note)</Label>
                            <Input
                                id="reason"
                                placeholder="e.g. Renovation, Reservation Hold"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply Block
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
