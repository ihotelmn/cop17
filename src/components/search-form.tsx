"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon, Search, Users } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export function SearchForm({ className }: React.HTMLAttributes<HTMLDivElement>) {
    const [date, setDate] = React.useState<DateRange | undefined>()

    React.useEffect(() => {
        setDate({
            from: new Date(),
            to: addDays(new Date(), 3),
        })
    }, [])

    return (
        <div className={cn("grid gap-4 p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-lg border border-white/20 dark:border-zinc-800/50", className)}>
            <form className="grid gap-4 md:grid-cols-4 items-end">
                <div className="grid gap-2">
                    <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Location
                    </label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="location" placeholder="Ulaanbaatar, Mongolia" className="pl-9" defaultValue="Ulaanbaatar" />
                    </div>
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Check-in - Check-out
                    </label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid gap-2">
                    <label htmlFor="guests" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Guests
                    </label>
                    <div className="relative">
                        <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="guests" type="number" min={1} max={10} defaultValue={1} className="pl-9" />
                    </div>
                </div>
            </form>
            <Button size="lg" className="w-full md:w-auto md:ml-auto md:col-span-4" variant="premium">
                Search Available Rooms
            </Button>
        </div>
    )
}
