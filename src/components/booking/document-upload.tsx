"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { registerDocumentAction } from "@/app/actions/document-actions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
    Upload,
    FileText,
    CheckCircle2,
    XCircle,
    Loader2,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
    bookingId: string;
    type: 'passport' | 'visa' | 'accreditation';
    guestId?: string;
    label: string;
    onSuccess?: () => void;
}

export function DocumentUpload({
    bookingId,
    type,
    guestId,
    label,
    onSuccess
}: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validation
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(selectedFile.type)) {
            toast.error("Invalid file type. Please use PDF, JPG, or PNG.");
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("File size too large. Max 5MB allowed.");
            return;
        }

        setFile(selectedFile);
        setStatus('idle');
    }

    async function handleUpload() {
        if (!file) return;

        setIsUploading(true);
        setStatus('uploading');
        setProgress(10);

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${bookingId}_${type}_${Date.now()}.${fileExt}`;
            const filePath = `accreditation/${bookingId}/${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('accreditation-docs')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            setProgress(70);

            // 2. Register in DB via Server Action
            const result = await registerDocumentAction({
                bookingId,
                type,
                filePath,
                guestId
            });

            if (result.error) throw new Error(result.error);

            setProgress(100);
            setStatus('success');
            toast.success(`${label} uploaded successfully!`);
            onSuccess?.();

        } catch (error) {
            console.error("Upload Error:", error);
            setStatus('error');
            toast.error(`Failed to upload ${label}. Please try again.`);
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <div className={cn(
            "p-6 rounded-2xl border transition-all",
            status === 'success' ? "bg-green-500/5 border-green-500/20" :
                status === 'error' ? "bg-red-500/5 border-red-500/20" :
                    "bg-zinc-900 border-zinc-800"
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center",
                        status === 'success' ? "bg-green-500/20 text-green-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                        {status === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-white">{label}</h4>
                        <p className="text-xs text-zinc-500">PDF, JPG, or PNG (Max 5MB)</p>
                    </div>
                </div>
                {status === 'success' && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Verified</Badge>
                )}
            </div>

            {status !== 'success' && (
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-zinc-800/50 transition-colors">
                            <Upload className="h-8 w-8 text-zinc-600" />
                            <p className="text-sm text-zinc-400">
                                {file ? file.name : "Click or drag to select file"}
                            </p>
                        </div>
                    </div>

                    {status === 'uploading' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5 bg-zinc-800" />
                        </div>
                    )}

                    <Button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20"
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        {isUploading ? "Uploading..." : `Upload ${label}`}
                    </Button>
                </div>
            )}

            {status === 'success' && (
                <div className="flex items-center gap-2 text-sm text-green-500 font-medium mt-2">
                    <ShieldCheck className="h-4 w-4" />
                    Document safely stored and being processed.
                </div>
            )}
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border", className)}>
            {children}
        </span>
    );
}
