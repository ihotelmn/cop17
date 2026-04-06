"use client";

import { updateRoom, getRoom } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFormStatus } from "react-dom";
import { useActionState, useState, use, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { AmenitiesSelector } from "@/components/admin/amenities-selector";
import { sanitizeRichTextToPlainText } from "@/lib/safe-rich-text";

const initialState = { error: "", fieldErrors: {} };

export default function EditRoomPage({ params }: { params: Promise<{ id: string, roomId: string }> }) {
    const { id: hotelId, roomId } = use(params);
    const updateRoomWithIds = updateRoom.bind(null, hotelId, roomId);
    const [state, formAction] = useActionState(updateRoomWithIds, initialState);

    const [room, setRoom] = useState<any>(null);
    const [images, setImages] = useState<string[]>([]);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRoom = async () => {
            const data = await getRoom(roomId);
            if (data) {
                setRoom(data);
                setImages(data.images || []);
                setAmenities(data.amenities || []);
            }
            setIsLoading(false);
        };
        fetchRoom();
    }, [roomId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!room) {
        return <div className="text-zinc-900 text-center py-20">Room not found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/hotels/${hotelId}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Edit Room Type</h2>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                <form action={formAction} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-zinc-700">Room Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={room.name}
                                placeholder="e.g. Deluxe Ocean View"
                                required
                                className="bg-white border-zinc-200 text-zinc-950"
                            />
                            {state?.fieldErrors?.name && <p className="text-red-500 text-sm">{state.fieldErrors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-zinc-700">Room Category</Label>
                            <Select name="type" defaultValue={room.type || "Standard"}>
                                <SelectTrigger className="bg-white border-zinc-200 text-zinc-950">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Standard">Standard</SelectItem>
                                    <SelectItem value="Deluxe">Deluxe</SelectItem>
                                    <SelectItem value="Suite">Suite</SelectItem>
                                    <SelectItem value="Family">Family</SelectItem>
                                    <SelectItem value="Penthouse">Penthouse</SelectItem>
                                </SelectContent>
                            </Select>
                            {state?.fieldErrors?.type && <p className="text-red-500 text-sm">{state.fieldErrors.type}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-zinc-700">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={sanitizeRichTextToPlainText(room.description)}
                            placeholder="Example: 55 m2, one king bed, work desk, bathtub and shower."
                            className="bg-white border-zinc-200 text-zinc-950 min-h-[100px]"
                        />
                        <p className="text-xs text-zinc-500">Normal text is enough. Old HTML tags like &lt;ul&gt; or &lt;li&gt; are cleaned automatically.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="price_per_night" className="text-zinc-700">Price per Night ($)</Label>
                            <Input
                                id="price_per_night"
                                name="price_per_night"
                                type="number"
                                defaultValue={room.price_per_night}
                                min="0"
                                step="0.01"
                                required
                                className="bg-white border-zinc-200 text-zinc-950"
                            />
                            {state?.fieldErrors?.price_per_night && <p className="text-red-500 text-sm">{state.fieldErrors.price_per_night}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity" className="text-zinc-700">Max Guests</Label>
                            <Input
                                id="capacity"
                                name="capacity"
                                type="number"
                                defaultValue={room.capacity}
                                min="1"
                                className="bg-white border-zinc-200 text-zinc-950"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="total_inventory" className="text-zinc-700">Total Inventory</Label>
                            <Input
                                id="total_inventory"
                                name="total_inventory"
                                type="number"
                                defaultValue={room.total_inventory}
                                min="0"
                                className="bg-white border-zinc-200 text-zinc-950"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-700">Room Amenities</Label>
                        <AmenitiesSelector value={amenities} onChange={setAmenities} />
                        <input type="hidden" name="amenities" value={JSON.stringify(amenities)} />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-700">Room Images</Label>
                        <ImageUpload value={images} onChange={setImages} maxFiles={10} />
                        <input type="hidden" name="images" value={JSON.stringify(images)} />
                    </div>

                    {state?.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                            {state.error}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-4 border-t border-zinc-200">
                        <Button variant="outline" asChild className="border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                            <Link href={`/admin/hotels/${hotelId}`}>Cancel</Link>
                        </Button>
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
        </Button>
    );
}
