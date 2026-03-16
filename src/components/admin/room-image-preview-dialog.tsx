"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FallbackImage } from "@/components/ui/fallback-image";

type RoomImagePreviewDialogProps = {
    roomName: string;
    images?: string[] | null;
};

export function RoomImagePreviewDialog({ roomName, images }: RoomImagePreviewDialogProps) {
    const roomImages = images?.filter(Boolean) ?? [];

    if (roomImages.length === 0) {
        return null;
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className="h-auto p-0 text-xs font-medium text-blue-400 hover:bg-transparent hover:text-blue-300"
                >
                    View all
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{roomName}</DialogTitle>
                    <DialogDescription>
                        {roomImages.length} image{roomImages.length === 1 ? "" : "s"} attached to this room type.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {roomImages.map((image, index) => (
                        <div key={`${image}-${index}`} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                            <div className="aspect-[4/3]">
                                <FallbackImage
                                    src={image}
                                    alt={`${roomName} image ${index + 1}`}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
