"use client";

import { createHotel } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFormStatus } from "react-dom";
import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { AmenitiesSelector } from "@/components/admin/amenities-selector";
import { LocationPicker } from "@/components/admin/location-picker";

const initialState = { error: "", fieldErrors: {} };

export default function NewHotelPage() {
    const [state, formAction] = useActionState(createHotel, initialState);

    // Client state for complex components
    const [images, setImages] = useState<string[]>([]);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/hotels">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h2 className="text-3xl font-bold tracking-tight text-white">Add New Hotel</h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-sm">
                <form action={formAction} className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-zinc-300">Hotel Name *</Label>
                            <Input id="name" name="name" placeholder="e.g. Shangri-La Ulaanbaatar" required className="bg-zinc-800 border-zinc-700 text-white" />
                            {state?.fieldErrors?.name && <p className="text-red-500 text-sm">{state.fieldErrors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="hotel_type" className="text-zinc-300">Type</Label>
                            <Select name="hotel_type" defaultValue="Hotel">
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Hotel">Hotel</SelectItem>
                                    <SelectItem value="Resort">Resort</SelectItem>
                                    <SelectItem value="Camp">Tourist Camp</SelectItem>
                                    <SelectItem value="Ger Camp">Ger Camp</SelectItem>
                                    <SelectItem value="Hostel">Hostel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-zinc-300">Description</Label>
                        <Textarea id="description" name="description" placeholder="About the property..." className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]" />
                    </div>

                    {/* Contact & Times */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone" className="text-zinc-300">Contact Phone</Label>
                            <Input id="contact_phone" name="contact_phone" placeholder="+976..." className="bg-zinc-800 border-zinc-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_email" className="text-zinc-300">Contact Email</Label>
                            <Input id="contact_email" name="contact_email" type="email" placeholder="info@hotel.mn" className="bg-zinc-800 border-zinc-700 text-white" />
                            {state?.fieldErrors?.contact_email && <p className="text-red-500 text-sm">{state.fieldErrors.contact_email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="check_in_time" className="text-zinc-300">Check-in Time</Label>
                            <Input id="check_in_time" name="check_in_time" type="time" defaultValue="14:00" className="bg-zinc-800 border-zinc-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="check_out_time" className="text-zinc-300">Check-out Time</Label>
                            <Input id="check_out_time" name="check_out_time" type="time" defaultValue="12:00" className="bg-zinc-800 border-zinc-700 text-white" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="website" className="text-zinc-300">Website</Label>
                            <Input id="website" name="website" placeholder="https://..." className="bg-zinc-800 border-zinc-700 text-white" />
                            {state?.fieldErrors?.website && <p className="text-red-500 text-sm">{state.fieldErrors.website}</p>}
                        </div>
                    </div>

                    {/* Address & Location */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-zinc-300">Address text</Label>
                            <Input id="address" name="address" placeholder="Detailed address..." className="bg-zinc-800 border-zinc-700 text-white" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Map Location (Click to set)</Label>
                            <LocationPicker value={location} onChange={setLocation} />
                            {/* Hidden inputs to submit lat/lng */}
                            <input type="hidden" name="latitude" value={location?.lat || ""} />
                            <input type="hidden" name="longitude" value={location?.lng || ""} />
                            {state?.fieldErrors?.latitude && <p className="text-red-500 text-sm">Please select a location on the map</p>}
                        </div>
                    </div>

                    {/* Stars & Amenities */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="stars" className="text-zinc-300">Star Rating</Label>
                            <Input id="stars" name="stars" type="number" min="1" max="5" defaultValue="5" className="bg-zinc-800 border-zinc-700 text-white w-24" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Amenities</Label>
                            <AmenitiesSelector value={amenities} onChange={setAmenities} />
                            {/* Submit as JSON to handle complex arrays robustly */}
                            <input type="hidden" name="amenities" value={JSON.stringify(amenities)} />
                        </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Hotel Images</Label>
                        <ImageUpload value={images} onChange={setImages} />
                        <input type="hidden" name="images" value={JSON.stringify(images)} />
                    </div>

                    {/* Errors */}
                    {state?.error && (
                        <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm">
                            {state.error}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-4 border-t border-zinc-800">
                        <Button variant="outline" asChild className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                            <Link href="/admin/hotels">Cancel</Link>
                        </Button>
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Hotel
        </Button>
    );
}
