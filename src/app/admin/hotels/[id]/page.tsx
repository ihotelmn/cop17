import { getHotel, getRooms, deleteRoom, quickUpdateRoom, updateRoomActiveStatus } from "@/app/actions/admin";
import { RoomImagePreviewDialog } from "@/components/admin/room-image-preview-dialog";
import { FallbackImage } from "@/components/ui/fallback-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPreferredHotelAddress, getPreferredHotelName } from "@/lib/hotel-display";
import { sanitizeRichTextToPlainText } from "@/lib/safe-rich-text";
import type { Room } from "@/types/hotel";
import { Plus, Trash, ArrowLeft, Pencil, Save, Check, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function HotelDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const hotel = await getHotel(id);
    const rooms = await getRooms(id);

    if (!hotel) {
        notFound();
    }

    const displayName = getPreferredHotelName(hotel);
    const displayAddress = getPreferredHotelAddress(hotel) ?? "Ulaanbaatar, Mongolia";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/hotels">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">{displayName}</h2>
                        <p className="text-muted-foreground">{displayAddress} • {hotel.stars} Stars</p>
                    </div>
                </div>
                <Button asChild variant="outline">
                    <Link href={`/admin/hotels/${hotel.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Hotel
                    </Link>
                </Button>
            </div>

            {/* Rooms Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-zinc-900">Room Types & Inventory</h3>
                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                        <Link href={`/admin/hotels/${hotel.id}/rooms/new`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Room Type
                        </Link>
                    </Button>
                </div>

                <Card className="bg-white border-zinc-200">
                    <CardHeader>
                        <CardDescription>Manage room types, pricing, and blocked inventory for this hotel.</CardDescription>
                        <CardDescription>Price, max guests, and allocation can be updated directly from this list. Use the green save icon on each row to apply changes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-200 hover:bg-zinc-50">
                                    <TableHead className="text-zinc-500">Room Type</TableHead>
                                    <TableHead className="text-zinc-500">Category</TableHead>
                                    <TableHead className="text-zinc-500">Guests</TableHead>
                                    <TableHead className="text-zinc-500">Price/Night</TableHead>
                                    <TableHead className="text-zinc-500">Total Allocation</TableHead>
                                    <TableHead className="text-zinc-500 text-center">Active</TableHead>
                                    <TableHead className="text-zinc-500">Data</TableHead>
                                    <TableHead className="text-zinc-500 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rooms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No rooms added yet. Define room types and allocation.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rooms.map((room) => {
                                        const formId = `room-quick-edit-${room.id}`;

                                        return (
                                        <TableRow key={room.id} className="border-zinc-200 hover:bg-zinc-50">
                                            <TableCell className="min-w-[360px]">
                                                <form
                                                    id={formId}
                                                    action={async (formData) => {
                                                        "use server";
                                                        await quickUpdateRoom(room.id, hotel.id, formData);
                                                    }}
                                                />
                                                <div className="flex items-start gap-3">
                                                    <div className="relative h-16 w-24 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
                                                        <FallbackImage
                                                            src={room.images?.[0] ?? null}
                                                            alt={room.name}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-zinc-900">{room.name}</div>
                                                        {getRoomPlainDescription(room) ? (
                                                            <p className="max-w-md line-clamp-2 text-sm text-zinc-400">
                                                                {getRoomPlainDescription(room)}
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-zinc-500">No description added yet.</p>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                                            <span>{getImageCount(room)} image{getImageCount(room) === 1 ? "" : "s"}</span>
                                                            <span>{getAmenityCount(room)} amenit{getAmenityCount(room) === 1 ? "y" : "ies"}</span>
                                                            <RoomImagePreviewDialog roomName={room.name} images={room.images} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-zinc-700">{room.type}</TableCell>
                                            <TableCell className="text-zinc-700 dark:text-zinc-300">
                                                <Input
                                                    form={formId}
                                                    name="capacity"
                                                    type="number"
                                                    min="1"
                                                    defaultValue={room.capacity}
                                                    className="h-9 w-24 border-zinc-200 bg-zinc-100 text-zinc-900"
                                                />
                                            </TableCell>
                                            <TableCell className="text-zinc-700 dark:text-zinc-300">
                                                <Input
                                                    form={formId}
                                                    name="price_per_night"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    defaultValue={room.price_per_night}
                                                    className="h-9 w-32 border-zinc-200 bg-zinc-100 text-zinc-900"
                                                />
                                            </TableCell>
                                            <TableCell className="text-zinc-900 dark:text-white font-bold text-center">
                                                <Input
                                                    form={formId}
                                                    name="total_inventory"
                                                    type="number"
                                                    min="0"
                                                    defaultValue={room.total_inventory}
                                                    className="mx-auto h-9 w-24 border-zinc-200 bg-zinc-100 text-center text-zinc-900"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    <form action={async () => {
                                                        "use server";
                                                        await updateRoomActiveStatus(room.id, hotel.id, !room.is_active);
                                                    }}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            type="submit"
                                                            className={cn(
                                                                "h-8 px-2 transition-colors",
                                                                room.is_active !== false 
                                                                    ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20" 
                                                                    : "text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/50"
                                                            )}
                                                        >
                                                            {room.is_active !== false ? (
                                                                <Check className="h-4 w-4 mr-1" />
                                                            ) : (
                                                                <X className="h-4 w-4 mr-1" />
                                                            )}
                                                            <span className="text-xs font-medium">
                                                                {room.is_active !== false ? "Active" : "Inactive"}
                                                            </span>
                                                        </Button>
                                                    </form>
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-[220px]">
                                                <div className="flex flex-wrap gap-2">
                                                    {getVisibleRoomIssues(room).length === 0 ? (
                                                        <Badge className="border-emerald-800 bg-emerald-950/40 text-emerald-300">
                                                            Ready
                                                        </Badge>
                                                    ) : (
                                                        <>
                                                            {getVisibleRoomIssues(room).map((issue) => (
                                                                <Badge
                                                                    key={issue}
                                                                    variant="outline"
                                                                    className="border-amber-800 bg-amber-950/30 text-amber-300"
                                                                >
                                                                    {issue}
                                                                </Badge>
                                                            ))}
                                                            {getHiddenIssueCount(room) > 0 ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-zinc-700 bg-zinc-900 text-zinc-300"
                                                                >
                                                                    +{getHiddenIssueCount(room)} more
                                                                </Badge>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-2">
                                                <Button
                                                    type="submit"
                                                    form={formId}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    <span className="sr-only">Save quick changes</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                                                    asChild
                                                >
                                                    <Link href={`/admin/hotels/${hotel.id}/rooms/${room.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Link>
                                                </Button>
                                                <form action={async () => {
                                                    "use server";
                                                    await deleteRoom(room.id);
                                                }}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                        type="submit"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </form>
                                            </TableCell>
                                        </TableRow>
                                    )})
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function getRoomIssues(room: Room): string[] {
    const issues: string[] = [];
    const plainDescription = getRoomPlainDescription(room);

    if (!room.images || room.images.length === 0) issues.push("No images");
    if (!plainDescription) issues.push("No description");
    if (!room.amenities || room.amenities.length === 0) issues.push("No amenities");
    if (!room.capacity || room.capacity < 1) issues.push("No capacity");
    if (!room.total_inventory || room.total_inventory < 1) issues.push("No inventory");
    if (room.price_per_night == null || Number(room.price_per_night) <= 0) issues.push("No pricing");

    return issues;
}

function getVisibleRoomIssues(room: Room): string[] {
    return getRoomIssues(room).slice(0, 2);
}

function getHiddenIssueCount(room: Room): number {
    return Math.max(getRoomIssues(room).length - 2, 0);
}

function getImageCount(room: Room): number {
    return room.images?.length ?? 0;
}

function getAmenityCount(room: Room): number {
    return room.amenities?.length ?? 0;
}

function getRoomPlainDescription(room: Room): string {
    return sanitizeRichTextToPlainText(room.description);
}
