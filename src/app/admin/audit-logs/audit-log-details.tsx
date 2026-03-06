"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function AuditLogDetails({ data }: { data: any }) {
    const [expanded, setExpanded] = useState(false);

    if (!data) return <span className="text-zinc-600 text-xs">—</span>;

    const preview = JSON.stringify(data);
    const isLong = preview.length > 80;

    if (!isLong) {
        return (
            <code className="text-zinc-400 font-mono text-[11px] break-all">
                {preview}
            </code>
        );
    }

    return (
        <div>
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
                {expanded ? (
                    <>
                        <ChevronUp className="h-3 w-3" />
                        Collapse
                    </>
                ) : (
                    <>
                        <ChevronDown className="h-3 w-3" />
                        Expand ({Math.round(preview.length / 100)}·100 chars)
                    </>
                )}
            </button>
            {expanded && (
                <pre className="mt-2 p-3 bg-zinc-950 rounded-lg text-[10px] text-zinc-400 font-mono overflow-x-auto max-h-60 max-w-md whitespace-pre-wrap break-all border border-zinc-800">
                    {JSON.stringify(data, null, 2)}
                </pre>
            )}
        </div>
    );
}
