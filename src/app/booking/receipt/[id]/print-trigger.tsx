"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

export function PrintTrigger({ showButton = false }: { showButton?: boolean }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (!showButton) return null;

    return (
        <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-8 h-12 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 transition-colors shadow-lg"
        >
            <Printer className="h-5 w-5" />
            Print Receipt
        </button>
    );
}
