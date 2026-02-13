import { getHotel, getRooms, deleteRoom } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash, ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function HotelDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const hotel = await getHotel(id);
    const rooms = await getRooms(id);

    if (!hotel) {
        notFound();
    }

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
                        <h2 className="text-3xl font-bold tracking-tight text-white">{hotel.name}</h2>
                        <p className="text-muted-foreground">{hotel.address} • {hotel.stars} Stars</p>
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
                    <h3 className="text-xl font-semibold text-white">Room Types & Inventory</h3>
                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                        <Link href={`/admin/hotels/${hotel.id}/rooms/new`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Room Type
                        </Link>
                    </Button>
                </div>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardDescription>Manage room types, pricing, and blocked inventory for this hotel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                    <TableHead className="text-zinc-400">Type Name</TableHead>
                                    <TableHead className="text-zinc-400">Category</TableHead>
                                    <TableHead className="text-zinc-400">Price/Night</TableHead>
                                    <TableHead className="text-zinc-400">Total Allocation</TableHead>
                                    <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rooms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No rooms added yet. Define room types and allocation.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rooms.map((room) => (
                                        <TableRow key={room.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                            <TableCell className="font-medium text-white">
                                                {room.name}
                                            </TableCell>
                                            <TableCell className="text-zinc-300">{room.type}</TableCell>
                                            <TableCell className="text-zinc-300">${room.price_per_night}</TableCell>
                                            <TableCell className="text-white font-bold text-center">
                                                <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded border border-blue-900/50">
                                                    {room.total_inventory}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 hover:text-white"
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
