"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkUpdateHotelPublishedStatus, submitDeleteHotel } from "@/app/actions/admin";
import { HotelPublishToggle } from "@/components/admin/hotel-publish-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, getHotelImageUrl } from "@/lib/utils";
import { Pencil, Plus, SearchX, Trash } from "lucide-react";

export interface AdminHotelRow {
    id: string;
    displayName: string;
    displayAddress: string;
    image?: string | null;
    stars: number;
    isPublished: boolean;
    roomCount: number;
    pricedRoomCount: number;
    completenessScore: number;
    needsAttention: string[];
    duplicateLabel?: string | null;
}

export function HotelsAdminTable({
    hotels,
    query,
}: {
    hotels: AdminHotelRow[];
    query: string;
}) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    const allSelected = hotels.length > 0 && selectedIds.length === hotels.length;
    const someSelected = selectedIds.length > 0 && !allSelected;

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    function toggleSelection(hotelId: string, checked: boolean) {
        setSelectedIds((current) => {
            if (checked) {
                return Array.from(new Set([...current, hotelId]));
            }
            return current.filter((id) => id !== hotelId);
        });
    }

    function toggleAll(checked: boolean) {
        setSelectedIds(checked ? hotels.map((hotel) => hotel.id) : []);
    }

    function runBulkStatusUpdate(isPublished: boolean) {
        if (selectedIds.length === 0) {
            toast.error("Select at least one hotel first.");
            return;
        }

        startTransition(async () => {
            const result = await bulkUpdateHotelPublishedStatus(selectedIds, isPublished);
            if (result?.error) {
                toast.error(result.error);
                return;
            }

            toast.success(
                `${result?.updatedCount || selectedIds.length} hotel${selectedIds.length === 1 ? "" : "s"} ${isPublished ? "published" : "unpublished"}.`
            );
            setSelectedIds([]);
            router.refresh();
        });
    }

    return (
        <div className="space-y-4">
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-zinc-900">
                            {selectedIds.length} hotel{selectedIds.length === 1 ? "" : "s"} selected
                        </p>
                        <p className="text-xs text-zinc-500">
                            Apply a bulk publish action, or clear your selection.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => runBulkStatusUpdate(true)}
                            className="border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50"
                        >
                            Publish Selected
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => runBulkStatusUpdate(false)}
                            className="border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50"
                        >
                            Unpublish Selected
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => setSelectedIds([])}
                            className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        >
                            Clear Selection
                        </Button>
                    </div>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow className="border-zinc-200 hover:bg-zinc-50">
                        <TableHead className="w-12 text-zinc-500">
                            <Checkbox
                                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                                onCheckedChange={(value) => toggleAll(value === true)}
                                aria-label="Select all hotels"
                            />
                        </TableHead>
                        <TableHead className="text-zinc-500">Name</TableHead>
                        <TableHead className="text-zinc-500">Data Quality</TableHead>
                        <TableHead className="text-zinc-500">Status</TableHead>
                        <TableHead className="text-right text-zinc-500">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {hotels.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-28 text-center text-zinc-500">
                                <div className="flex flex-col items-center gap-2">
                                    <SearchX className="h-5 w-5 text-zinc-400" />
                                    <span>{query ? "No hotels matched that search or filter set." : "No hotels found. Add one to get started."}</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        hotels.map((hotel) => (
                            <TableRow key={hotel.id} className="border-zinc-200 hover:bg-zinc-50">
                                <TableCell className="py-4">
                                    <Checkbox
                                        checked={selectedSet.has(hotel.id)}
                                        onCheckedChange={(value) => toggleSelection(hotel.id, value === true)}
                                        aria-label={`Select ${hotel.displayName}`}
                                    />
                                </TableCell>
                                <TableCell className="py-4 align-top">
                                    <div className="flex items-start gap-3">
                                        <div className="relative h-14 w-20 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                                            <Image
                                                src={getHotelImageUrl(hotel.image)}
                                                alt={hotel.displayName}
                                                fill
                                                sizes="80px"
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="min-w-0 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium text-zinc-950">{hotel.displayName}</span>
                                                {hotel.duplicateLabel ? (
                                                    <Badge className="border border-amber-200 bg-amber-50 text-amber-700">
                                                        {hotel.duplicateLabel}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <p className="line-clamp-2 text-sm text-zinc-500">{hotel.displayAddress}</p>
                                            <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                                                <span>{hotel.stars > 0 ? `${hotel.stars} stars` : "No stars"}</span>
                                                <span>{hotel.roomCount} room type{hotel.roomCount === 1 ? "" : "s"}</span>
                                                <span>{hotel.pricedRoomCount} priced</span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 align-top">
                                    <div className="max-w-sm space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Badge className={cn(
                                                "border px-2.5 py-1 text-xs font-semibold",
                                                hotel.completenessScore >= 85
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : hotel.completenessScore >= 65
                                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                                        : "border-red-200 bg-red-50 text-red-700"
                                            )}>
                                                {hotel.completenessScore}% complete
                                            </Badge>
                                            <div className="h-1.5 flex-1 rounded-full bg-zinc-200">
                                                <div
                                                    className={cn(
                                                        "h-1.5 rounded-full transition-all",
                                                        hotel.completenessScore >= 85
                                                            ? "bg-emerald-500"
                                                            : hotel.completenessScore >= 65
                                                                ? "bg-amber-500"
                                                                : "bg-red-500"
                                                    )}
                                                    style={{ width: `${hotel.completenessScore}%` }}
                                                />
                                            </div>
                                        </div>

                                        {hotel.needsAttention.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {hotel.needsAttention.slice(0, 2).map((issue) => (
                                                    <Badge key={issue} className="border border-zinc-200 bg-zinc-100 text-zinc-700">
                                                        {issue}
                                                    </Badge>
                                                ))}
                                                {hotel.needsAttention.length > 2 ? (
                                                    <Badge className="border border-zinc-200 bg-zinc-100 text-zinc-500">
                                                        +{hotel.needsAttention.length - 2} more
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                                                Ready
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 align-top">
                                    <HotelPublishToggle
                                        hotelId={hotel.id}
                                        hotelName={hotel.displayName}
                                        initialPublished={hotel.isPublished}
                                    />
                                </TableCell>
                                <TableCell className="py-4 align-top text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                                            asChild
                                        >
                                            <Link href={`/admin/hotels/${hotel.id}/edit`}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                            asChild
                                            title="Manage Rooms"
                                        >
                                            <Link href={`/admin/hotels/${hotel.id}`}>
                                                <Plus className="h-4 w-4" />
                                                <span className="sr-only">Manage Rooms</span>
                                            </Link>
                                        </Button>
                                        <form action={submitDeleteHotel.bind(null, hotel.id)}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                type="submit"
                                            >
                                                <Trash className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </form>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
