"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { createAmenity } from "@/app/actions/amenities";

interface Amenity {
    id: string;
    name: string;
}

interface AmenitiesSelectorProps {
    value: string[];
    onChange: (value: string[]) => void;
}

export function AmenitiesSelector({ value = [], onChange }: AmenitiesSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [amenities, setAmenities] = React.useState<Amenity[]>([]);
    const [searchValue, setSearchValue] = React.useState("");
    const supabase = createClient();

    React.useEffect(() => {
        const fetchAmenities = async () => {
            const { data } = await supabase.from("amenities").select("*").order("name");
            if (data) setAmenities(data);
        };
        fetchAmenities();
    }, [supabase]);

    const handleSelect = (currentValue: string) => {
        // Here currentValue is likely the name (lowercase) from command item
        // But we want to match by ID or Name. Since we store string[] of names usually in hotels table (text[]),
        // we'll stick to names. 
        // Wait, current schema for amenities in `hotels` table is likely `text[]` of names.
        // Let's verify schema. `hotels` has `amenities text[]`.

        // CommandItem value is usually lowercased by default, so we need to be careful.
        // We will strict match against amenity names.

        const isSelected = value.includes(currentValue);
        if (isSelected) {
            onChange(value.filter((item) => item !== currentValue));
        } else {
            onChange([...value, currentValue]);
        }
    };

    const handleCreate = async () => {
        if (!searchValue) return;

        // Optimistic update check
        const newAmenityName = searchValue.trim();
        if (amenities.some(a => a.name.toLowerCase() === newAmenityName.toLowerCase())) return;

        // Use Server Action
        const result = await createAmenity(newAmenityName);

        if (result.error) {
            console.error("Error creating amenity:", result.error);
            // Ideally show a toast here
            return;
        }

        if (result.data) {
            const newAmenity = result.data;
            setAmenities((prev) => [...prev, newAmenity].sort((a: Amenity, b: Amenity) => a.name.localeCompare(b.name)));
            onChange([...value, newAmenity.name]);
            setSearchValue("");
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {value.map((item) => (
                    <Badge key={item} variant="secondary" className="px-3 py-1 flex items-center gap-1">
                        {item}
                        <button
                            type="button"
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onClick={() => onChange(value.filter((i) => i !== item))}
                        >
                            <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Badge>
                ))}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        Select amenities...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Search amenities..."
                            value={searchValue}
                            onValueChange={setSearchValue}
                        />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2 flex flex-col items-center gap-2">
                                    <span className="text-sm text-muted-foreground">No amenity found.</span>
                                    {searchValue && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full"
                                            onClick={handleCreate}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create "{searchValue}"
                                        </Button>
                                    )}
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {amenities.map((amenity) => (
                                    <CommandItem
                                        key={amenity.id}
                                        // Use name as value to avoid lowercase issues if possible, but Command usually lowercases.
                                        // We will rely on manual onSelect handling.
                                        value={amenity.name}
                                        onSelect={(currentValue) => {
                                            // currentValue is lowercased by shadcn Command
                                            // We find the real casing from our list
                                            const realName = amenities.find(a => a.name.toLowerCase() === currentValue.toLowerCase())?.name || currentValue;
                                            handleSelect(realName);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value.includes(amenity.name) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {amenity.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}
