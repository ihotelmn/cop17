"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon, Search, Users, MapPin, ChevronDown, Minus, Plus } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { differenceInDays } from "date-fns"

export function SearchForm({ className }: React.HTMLAttributes<HTMLDivElement>) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()

    const [isDatePopoverOpen, setIsDatePopoverOpen] = React.useState(false)
    const [isGuestsPopoverOpen, setIsGuestsPopoverOpen] = React.useState(false)

    const fromStr = searchParams.get("from")
    const toStr = searchParams.get("to")

    const date: DateRange | undefined = React.useMemo(() => {
        if (!fromStr && !toStr) {
            return { from: new Date(), to: addDays(new Date(), 3) }
        }
        return {
            from: fromStr ? new Date(fromStr) : undefined,
            to: toStr ? new Date(toStr) : undefined
        }
    }, [fromStr, toStr])

    const adults = parseInt(searchParams.get("adults") || "2")
    const children = parseInt(searchParams.get("children") || "0")

    const nights = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0
    const totalGuests = adults + children

    const updateParams = (newDate?: DateRange, newAdults?: number, newChildren?: number) => {
        const params = new URLSearchParams(searchParams)

        const d = newDate !== undefined ? newDate : date
        if (d?.from) params.set("from", format(d.from, "yyyy-MM-dd"))
        else params.delete("from")

        if (d?.to) params.set("to", format(d.to, "yyyy-MM-dd"))
        else params.delete("to")

        const a = newAdults ?? adults
        const c = newChildren ?? children
        params.set("adults", a.toString())
        params.set("children", c.toString())

        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const handleDateSelect = (selectedRange: DateRange | undefined) => {
        updateParams(selectedRange)
    }

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
                        Stay Period
                    </label>
                    <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                        <PopoverTrigger asChild>
                            <button className="w-full h-16 px-5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all focus:outline-none">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <CalendarIcon className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">
                                            {date?.from && date?.to ? (
                                                `${format(date.from, "MMM dd")} — ${format(date.to, "MMM dd")}`
                                            ) : "Select dates"}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                            {nights > 0 ? `${nights} Nights stay` : "Check-in / Out"}
                                        </span>
                                    </div>
                                </div>
                                <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-[0_30px_70px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden" align="start" sideOffset={8}>
                            <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Stay Selection</span>
                                <Button variant="ghost" size="sm" onClick={() => updateParams(undefined)} className="h-8 text-[9px] font-black uppercase text-zinc-400 hover:text-red-500 rounded-lg">Reset</Button>
                            </div>
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleDateSelect}
                                numberOfMonths={2}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                className="p-4"
                            />
                            <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                                <Button className="w-full h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] shadow-xl" onClick={() => setIsDatePopoverOpen(false)}>
                                    Confirm Dates
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Guests */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                        Accommodating
                    </label>
                    <Popover open={isGuestsPopoverOpen} onOpenChange={setIsGuestsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <button className="w-full h-16 px-5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all focus:outline-none">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Users className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">
                                            {totalGuests} {totalGuests > 1 ? "Travelers" : "Traveler"}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                            {adults} Adults, {children} Children
                                        </span>
                                    </div>
                                </div>
                                <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-6 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.2)] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" align="start" sideOffset={8}>
                            <div className="space-y-6">
                                {/* Adults */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Adults</span>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Ages 13+</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline" size="icon" className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800 active:scale-90 transition-all"
                                            onClick={() => { const val = Math.max(1, adults - 1); updateParams(undefined, val); }}
                                            disabled={adults <= 1}
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="w-4 text-center text-xs font-black">{adults}</span>
                                        <Button
                                            variant="outline" size="icon" className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800 active:scale-90 transition-all"
                                            onClick={() => { const val = Math.min(10, adults + 1); updateParams(undefined, val); }}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Children</span>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Ages 0-12</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline" size="icon" className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800 active:scale-90 transition-all"
                                            onClick={() => { const val = Math.max(0, children - 1); updateParams(undefined, undefined, val); }}
                                            disabled={children <= 0}
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="w-4 text-center text-xs font-black">{children}</span>
                                        <Button
                                            variant="outline" size="icon" className="h-9 w-9 rounded-full border-zinc-200 dark:border-zinc-800 active:scale-90 transition-all"
                                            onClick={() => { const val = Math.min(10, children + 1); updateParams(undefined, undefined, val); }}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <Button className="w-full mt-2 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl" onClick={() => setIsGuestsPopoverOpen(false)}>
                                    Apply Selection
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <p className="text-[9px] text-center font-bold text-zinc-400 uppercase tracking-widest leading-relaxed px-4 opacity-80">
                Official COP17 support is available for all bookings made through this platform.
            </p>
        </div>
    )
}
