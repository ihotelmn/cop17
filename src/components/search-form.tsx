"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon, Search, Users, MapPin, ChevronDown } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function SearchForm({ className }: React.HTMLAttributes<HTMLDivElement>) {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 3),
    })

    return (
        <div className={cn("space-y-6", className)}>
            <div className="space-y-4">
                {/* Location - Informational only if we are on hotel page */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                        Current Destination
                    </label>
                    <div className="flex items-center gap-3 px-4 h-14 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span>Ulaanbaatar, Mongolia</span>
                    </div>
                </div>

                {/* Date Picker */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                        Selected Dates
                    </label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="w-full h-14 px-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all focus:outline-none">
                                <div className="flex items-center gap-3">
                                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                                    <div className="flex flex-col items-start translate-y-[1px]">
                                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                            {date?.from ? format(date.from, "MMM dd") : "Arrival"} — {date?.to ? format(date.to, "MMM dd") : "Departure"}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                            {date?.from && date?.to ? `${Math.round((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))} Nights Stay` : "Select dates"}
                                        </span>
                                    </div>
                                </div>
                                <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                className="p-4"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Guests */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                        Capacity Needs
                    </label>
                    <div className="flex items-center justify-between px-4 h-14 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">Minimum 2 Guests</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Requirement</span>
                    </div>
                </div>
            </div>

            <p className="text-[9px] text-center font-bold text-zinc-400 uppercase tracking-widest leading-relaxed px-4">
                Prices and availability are shown in real-time on the room selection cards below.
            </p>
        </div>
    )
}
