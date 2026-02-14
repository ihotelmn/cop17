"use client";

import { Button } from "@/components/ui/button";
import { FilterSidebar } from "./filter-sidebar";
import { SlidersHorizontal, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export function MobileFilter({ count }: { count?: number }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 lg:hidden h-12 px-6 rounded-full border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <SlidersHorizontal className="h-4 w-4" /> Filters {count ? `(${count})` : ""}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-full h-full max-w-none rounded-none border-none p-0 flex flex-col bg-zinc-50 dark:bg-zinc-950">
                <DialogHeader className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10 flex flex-row items-center justify-between">
                    <div className="flex-1" />
                    <DialogTitle className="text-center font-bold text-lg">Filters</DialogTitle>
                    <div className="flex-1 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
                    {/* Pass a prop to Sidebar to handle closing? Or url change handles it? 
                         FilterSidebar reads URL. Applying filters closes URL. 
                         We can just render it. */}
                    <FilterSidebar />
                </div>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky bottom-0 z-10">
                    <Button
                        className="w-full h-12 rounded-lg text-base font-bold"
                        onClick={() => setOpen(false)} // Or handle apply
                    >
                        Show Results
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
