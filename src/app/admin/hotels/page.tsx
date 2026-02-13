import { getHotels, deleteHotel } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function HotelsAdminPage() {
    const hotels = await getHotels();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Hotels</h2>
                    <p className="text-muted-foreground">Manage authorized hotels and inventory allocation.</p>
                </div>
                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                    <Link href="/admin/hotels/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Hotel
                    </Link>
                </Button>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Hotel Inventory</CardTitle>
                    <CardDescription>List of all hotels available for booking.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableHead className="text-zinc-400">Name</TableHead>
                                <TableHead className="text-zinc-400">Location</TableHead>
                                <TableHead className="text-zinc-400">Stars</TableHead>
                                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hotels.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No hotels found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                hotels.map((hotel) => (
                                    <TableRow key={hotel.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                        <TableCell className="font-medium text-white flex items-center gap-3">
                                            {hotel.images && hotel.images[0] && (
                                                <div className="relative h-10 w-16 overflow-hidden rounded">
                                                    <Image
                                                        src={hotel.images[0]}
                                                        alt={hotel.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            {hotel.name}
                                        </TableCell>
                                        <TableCell className="text-zinc-300">{hotel.address || "N/A"}</TableCell>
                                        <TableCell className="text-zinc-300">
                                            <span className="inline-flex items-center bg-amber-900/30 text-amber-500 text-xs px-2 py-1 rounded">
                                                {hotel.stars} Stars
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 hover:text-white"
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
                                                    className="h-8 w-8 text-amber-500 hover:text-amber-400 hover:bg-amber-900/20"
                                                    asChild
                                                    title="Manage Rooms"
                                                >
                                                    <Link href={`/admin/hotels/${hotel.id}`}>
                                                        <Plus className="h-4 w-4" />
                                                        <span className="sr-only">Manage Rooms</span>
                                                    </Link>
                                                </Button>
                                                <form action={async () => {
                                                    "use server";
                                                    await deleteHotel(hotel.id);
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
                                            </div>
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
