"use client";

import { useCallback, useState } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { Loader2, ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ImportImageAsset } from "@/lib/hotel-import-assistant";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImportImageUploadProps {
    value: ImportImageAsset[];
    onChange: (value: ImportImageAsset[]) => void;
    maxFiles?: number;
    disabled?: boolean;
}

export function ImportImageUpload({
    value,
    onChange,
    maxFiles = 30,
    disabled,
}: ImportImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const onUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files?.length) return;

        setError(null);
        setIsUploading(true);

        const remainingSlots = maxFiles - value.length;
        const filesToUpload = Array.from(files).slice(0, remainingSlots);

        if (files.length > remainingSlots) {
            setError(`Only ${remainingSlots} more image(s) can be added to this import.`);
        }

        const uploadedImages: ImportImageAsset[] = [];

        for (const file of filesToUpload) {
            const uploadedImage = await uploadImageFile(file, supabase);
            if (uploadedImage) {
                uploadedImages.push(uploadedImage);
            }
        }

        if (uploadedImages.length) {
            onChange([...value, ...uploadedImages]);
        }

        setIsUploading(false);
        event.target.value = "";
    }, [maxFiles, onChange, supabase, value]);

    const removeImage = (id: string) => {
        onChange(value.filter((image) => image.id !== id));
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}

            {value.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {value.map((image) => (
                        <div key={image.id} className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                            <div className="relative aspect-video">
                                <Image
                                    src={image.url}
                                    alt={image.name}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                />
                            </div>
                            <div className="border-t border-zinc-800 px-3 py-2">
                                <p className="truncate text-xs text-zinc-300" title={image.name}>
                                    {image.name}
                                </p>
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() => removeImage(image.id)}
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {value.length < maxFiles && (
                <label
                    className={cn(
                        "flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 text-center transition-colors hover:bg-zinc-900",
                        (isUploading || disabled) && "cursor-not-allowed opacity-60"
                    )}
                >
                    {isUploading ? (
                        <Loader2 className="mb-3 h-8 w-8 animate-spin text-zinc-400" />
                    ) : (
                        <ImagePlus className="mb-3 h-8 w-8 text-zinc-400" />
                    )}
                    <p className="text-sm font-medium text-white">
                        Upload hotel and room images
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                        Original file names are preserved for smart room matching.
                    </p>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={onUpload}
                        disabled={isUploading || disabled}
                    />
                </label>
            )}
        </div>
    );
}

async function uploadImageFile(file: File, supabase: ReturnType<typeof createClient>): Promise<ImportImageAsset | null> {
    const originalName = file.name;
    let fileToUpload = file;
    let extension = originalName.split(".").pop()?.toLowerCase() || "jpg";

    try {
        console.log(`Starting compression for: ${originalName}`);
        const compressed = await Promise.race([
            imageCompression(file, {
                maxSizeMB: 1.0,
                maxWidthOrHeight: 2048,
                useWebWorker: true,
                fileType: "image/webp",
            }),
            new Promise<File>((_, reject) => setTimeout(() => reject(new Error("Compression timeout")), 8000)),
        ]) as File;

        fileToUpload = compressed;
        extension = compressed.type.split("/")[1] || "webp";
        console.log(`Compression successful: ${originalName}`);
    } catch (e) {
        console.warn(`Compression failed or timed out for ${originalName}, using original.`, e);
    }

    const safeBaseName = originalName
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "image";

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const filePath = `imports/${id}-${safeBaseName}.${extension}`;

    console.log(`Uploading to Supabase: ${filePath}`);
    const { error } = await supabase.storage
        .from("hotel-images")
        .upload(filePath, fileToUpload);

    if (error) {
        console.error(`Supabase upload error for ${originalName}:`, error);
        return null;
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from("hotel-images").getPublicUrl(filePath);

    console.log(`Upload complete: ${publicUrl}`);
    return {
        id,
        name: originalName,
        url: publicUrl,
    };
}
