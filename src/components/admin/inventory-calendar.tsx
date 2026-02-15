"use client";

import { useState, useTransition, useEffect } from "react";
import { format, parseISO, addMonths, subMonths, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Hotel, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInventoryStats } from "@/app/actions/inventory-admin";
import { BulkBlockModal } from "./bulk-block-modal";

interface InventoryCalendarProps {
    initialData: any;
}

export function InventoryCalendar({ initialData }: InventoryCalendarProps) {
    const [data, setData] = useState(initialData);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isPending, startTransition] = useTransition();

    const refreshData = (date: Date) => {
        const startOfView = format(date, "yyyy-MM-dd");
        startTransition(async () => {
            const res = await getInventoryStats(startOfView, 21);
            if (res.success) {
                setData(res.data);
            }
        });
    };

    const nextPeriod = () => {
        const next = addMonths(currentMonth, 1);
        setCurrentMonth(next);
        refreshData(startOfMonth(next));
    };

    const prevPeriod = () => {
        const prev = subMonths(currentMonth, 1);
        setCurrentMonth(prev);
        refreshData(startOfMonth(prev));
    };

    if (!data) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Calendar</h1>
                    <p className="text-muted-foreground mt-1">
                        Track room availability and manage occupancy across your properties.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <BulkBlockModal rooms={data.rooms} />
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border rounded-lg p-1 shadow-sm">
                        <button
                            onClick={prevPeriod}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="px-4 py-1 flex items-center gap-2 font-medium min-w-[150px] justify-center text-sm">
                            <CalendarIcon className="h-4 w-4 text-indigo-600" />
                            {format(currentMonth, "MMMM yyyy")}
                        </div>
                        <button
                            onClick={nextPeriod}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                                <th className="sticky left-0 z-20 bg-zinc-50 dark:bg-zinc-800/50 p-4 text-left font-semibold text-sm border-b border-r w-[250px]">
                                    Property & Room
                                </th>
                                {data.dates.map((date: string) => {
                                    const d = parseISO(date);
                                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                    return (
                                        <th
                                            key={date}
                                            className={cn(
                                                "p-3 text-center border-b font-medium text-xs min-w-[60px]",
                                                isWeekend && "bg-zinc-100/50 dark:bg-zinc-800/20"
                                            )}
                                        >
                                            <div className="text-muted-foreground">{format(d, "EEE")}</div>
                                            <div className="text-lg">{format(d, "dd")}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.rooms.length === 0 ? (
                                <tr>
                                    <td colSpan={data.dates.length + 1} className="p-8 text-center text-muted-foreground italic">
                                        No rooms found.
                                    </td>
                                </tr>
                            ) : (
                                data.rooms.map((room: any) => (
                                    <tr key={room.roomId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 p-4 border-r">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded text-indigo-600 dark:text-indigo-400">
                                                    <Hotel className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm line-clamp-1">{room.roomName}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-tight line-clamp-1">
                                                        {room.hotelName}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {room.days.map((day: any) => {
                                            const occupancyPercent = (day.booked / room.totalInventory) * 100;
                                            const isFull = day.available === 0;
                                            const isClosing = day.available > 0 && day.available <= 2;

                                            return (
                                                <td key={day.date} className="p-1 border text-center">
                                                    <div className={cn(
                                                        "h-full w-full py-3 rounded-md flex flex-col items-center justify-center transition-all",
                                                        isFull ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" :
                                                            isClosing ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                                                                "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400"
                                                    )}>
                                                        <span className="text-sm font-bold">{day.available}</span>
                                                        <span className="text-[9px] uppercase font-medium opacity-70">Left</span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {isPending && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[1px] flex items-center justify-center z-30">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-muted-foreground">High Availability</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-muted-foreground">Limited Rooms (1-2 left)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-muted-foreground">Fully Booked</span>
                </div>
                <div className="ml-auto text-muted-foreground italic">
                    * Showing 21-day rolling availability from start date.
                </div>
            </div>
        </div>
    );
}
