"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Upload, Loader2, ImagePlus } from "lucide-react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    maxFiles?: number;
    disabled?: boolean;
}

export function ImageUpload({ value, onChange, maxFiles = 5, disabled }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const onUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            setError(null);
            setIsUploading(true);
            const newUrls: string[] = [];
            const uploadedUrls: string[] = [];

            // Identify how many we can add
            const remainingSlots = maxFiles - value.length;
            const filesToUpload = Array.from(files).slice(0, remainingSlots);

            if (files.length > remainingSlots) {
                setError(`You can only upload ${remainingSlots} more image(s).`);
            }

            const compressionOptions = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: false,
                fileType: "image/webp"
            };

            for (const file of filesToUpload) {
                let fileToUpload = file;
                let fileExt = file.name.split('.').pop();

                try {
                    // Try to compress with 10s timeout
                    console.log(`qt: Starting compression for ${file.name}`);

                    const compressPromise = imageCompression(file, compressionOptions);
                    const timeoutPromise = new Promise<File>((_, reject) =>
                        setTimeout(() => reject(new Error("Compression timeout")), 10000)
                    );

                    const compressedFile = await Promise.race([compressPromise, timeoutPromise]) as File;

                    console.log(`qt: Compressed ${file.name} from ${file.size} to ${compressedFile.size}`);
                    fileToUpload = compressedFile;
                    fileExt = compressedFile.type.split('/')[1] || 'webp';
                } catch (compressionErr) {
                    console.warn(`qt: Compression failed or timed out for ${file.name}, using original file.`, compressionErr);
                    // Fallback to original file
                }

                try {
                    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    console.log(`qt: Uploading ${fileName}...`);
                    const { error: uploadError } = await supabase.storage
                        .from('hotel-images')
                        .upload(filePath, fileToUpload);

                    if (uploadError) {
                        console.error("Upload error:", uploadError);
                        setError(`Failed to upload ${file.name}: ${uploadError.message}`);
                        continue;
                    }

                    console.log(`qt: Upload success for ${fileName}`);
                    const { data: { publicUrl } } = supabase.storage
                        .from('hotel-images')
                        .getPublicUrl(filePath);

                    uploadedUrls.push(publicUrl);
                } catch (uploadErr) {
                    console.error("Upload exception:", uploadErr);
                    setError(`Failed to upload ${file.name}`);
                }
            }

            if (uploadedUrls.length > 0) {
                onChange([...value, ...uploadedUrls]);
            }
        } catch (error) {
            console.error("Error uploading images:", error);
            setError("Something went wrong during upload.");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = "";
        }
    }, [onChange, value, maxFiles, supabase.storage]);

    const onRemove = (url: string) => {
        onChange(value.filter((current) => current !== url));
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {value.map((url) => (
                    <div key={url} className="relative aspect-video rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onRemove(url)}
                                disabled={disabled}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <Image
                            fill
                            src={url}
                            alt="Hotel Image"
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>
                ))}
            </div>

            {(value.length < maxFiles) && (
                <div className="flex items-center justify-center w-full">
                    <label className={cn(
                        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors",
                        isUploading || disabled ? "opacity-50 cursor-not-allowed" : ""
                    )}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 text-zinc-400 animate-spin mb-2" />
                            ) : (
                                <ImagePlus className="h-8 w-8 text-zinc-400 mb-2" />
                            )}
                            <div className="text-center">
                                <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                                    <span className="font-semibold">Click to upload</span>
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Max 5MB (JPG, PNG)
                                </p>
                            </div>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={onUpload}
                            disabled={isUploading || disabled}
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
