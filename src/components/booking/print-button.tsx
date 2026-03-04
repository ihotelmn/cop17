"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
    return (
        <Button
            className="w-full h-12 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl font-black uppercase tracking-widest text-[10px]"
            onClick={() => typeof window !== "undefined" && window.print()}
        >
            <Printer className="h-4 w-4 mr-2" /> Print Confirmation
        </Button>
    );
}
