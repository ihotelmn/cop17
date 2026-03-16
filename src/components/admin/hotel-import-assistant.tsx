"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Wand2, Upload, Building2, BedDouble, TriangleAlert, Sparkles, ArrowRight, Trash2 } from "lucide-react";
import { generateHotelImportDraftAction, applyHotelImportDraftAction } from "@/app/actions/hotel-import";
import type { HotelImportDraft, ImportImageAsset } from "@/lib/hotel-import-assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImportImageUpload } from "@/components/admin/import-image-upload";

const initialGenerateState: { error?: string; draft?: unknown } = {};
const initialApplyState: { error?: string } = {};

export function HotelImportAssistant() {
    const [images, setImages] = useState<ImportImageAsset[]>([]);
    const [editedDraft, setEditedDraft] = useState<HotelImportDraft | null>(null);
    const [generateState, generateAction, isGenerating] = useActionState(generateHotelImportDraftAction, initialGenerateState);
    const [applyState, applyAction, isApplying] = useActionState(applyHotelImportDraftAction, initialApplyState);
    const generatedDraft = (generateState?.draft as HotelImportDraft | undefined) || null;
    const draft = editedDraft ?? generatedDraft;

    const roomCount = draft?.rooms.length || 0;
    const summaryBadges = useMemo(() => {
        if (!draft) return [];
        return [
            `${draft.images.length} hotel image${draft.images.length === 1 ? "" : "s"}`,
            `${roomCount} room draft${roomCount === 1 ? "" : "s"}`,
            `${draft.amenities.length} amenit${draft.amenities.length === 1 ? "y" : "ies"}`,
        ];
    }, [draft, roomCount]);

    return (
        <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900 text-white">
                <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-amber-500/15 p-3 text-amber-400">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Hotel Import Assistant</CardTitle>
                            <CardDescription className="text-zinc-400">
                                Paste Excel-exported rows, add the hotel website, upload mixed hotel and room photos, and let the system prepare a draft for review.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action={generateAction} className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                            <div className="space-y-3">
                                <Label htmlFor="raw_source" className="text-zinc-200">
                                    Source Data
                                </Label>
                                <Textarea
                                    id="raw_source"
                                    name="raw_source"
                                    rows={15}
                                    placeholder={[
                                        "Paste Excel/CSV/TSV rows or descriptive hotel notes here.",
                                        "Example:",
                                        "Hotel Name: Blue Sky Hotel",
                                        "Address: Peace Avenue, Ulaanbaatar, Mongolia",
                                        "Room Type\tPrice\tCapacity\tInventory",
                                        "Deluxe Twin Room\t185\t2\t12",
                                        "Executive Suite\t390\t4\t3",
                                    ].join("\n")}
                                    className="min-h-[320px] border-zinc-700 bg-zinc-950 text-white"
                                />
                                <p className="text-xs text-zinc-500">
                                    TSV copied straight from Excel works best. The assistant also understands labelled notes and mixed room lists.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="website" className="text-zinc-200">
                                        Hotel Website
                                    </Label>
                                    <Input
                                        id="website"
                                        name="website"
                                        type="url"
                                        placeholder="https://hotel-example.mn"
                                        className="border-zinc-700 bg-zinc-950 text-white"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        If the website is reachable, we will try to read title, meta description, phone, and other signals automatically.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-zinc-200">Images</Label>
                                    <ImportImageUpload value={images} onChange={setImages} />
                                    <input type="hidden" name="images" value={JSON.stringify(images)} />
                                </div>
                            </div>
                        </div>

                        {generateState?.error && (
                            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {generateState.error}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
                            <div className="text-sm text-zinc-500">
                                Hotels are created as unpublished drafts so the team can review before going live.
                            </div>
                            <Button
                                type="submit"
                                onClick={() => setEditedDraft(null)}
                                disabled={isGenerating}
                                className="bg-amber-500 font-semibold text-black hover:bg-amber-600"
                            >
                                {isGenerating ? (
                                    <>
                                        <Upload className="mr-2 h-4 w-4 animate-pulse" />
                                        Generating Draft...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Generate Draft
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {draft && (
                <form action={applyAction} className="space-y-6">
                    <input type="hidden" name="draft" value={JSON.stringify(draft)} />

                    <Card className="border-zinc-800 bg-zinc-900 text-white">
                        <CardHeader className="space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="text-2xl">Review Draft</CardTitle>
                                    <CardDescription className="text-zinc-400">
                                        Fine-tune the imported data below, then create the hotel as an unpublished draft.
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {summaryBadges.map((badge) => (
                                        <Badge key={badge} variant="secondary" className="border border-zinc-700 bg-zinc-800 text-zinc-200">
                                            {badge}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {draft.warnings.length > 0 && (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-300">
                                        <TriangleAlert className="h-4 w-4" />
                                        Review Notes
                                    </div>
                                    <ul className="space-y-1 text-sm text-amber-100/90">
                                        {draft.warnings.map((warning) => (
                                            <li key={warning}>• {warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                                    <Building2 className="h-5 w-5 text-amber-400" />
                                    Hotel Profile
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Hotel Name">
                                        <Input value={draft.name} onChange={(event) => updateDraft(setEditedDraft, draft, "name", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                    </Field>
                                    <Field label="English Name">
                                        <Input value={draft.name_en} onChange={(event) => updateDraft(setEditedDraft, draft, "name_en", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                    </Field>
                                    <Field label="Address">
                                        <Input value={draft.address} onChange={(event) => updateDraft(setEditedDraft, draft, "address", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                    </Field>
                                    <Field label="English Address">
                                        <Input value={draft.address_en} onChange={(event) => updateDraft(setEditedDraft, draft, "address_en", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                    </Field>
                                    <Field label="Hotel Type">
                                        <Input value={draft.hotel_type} onChange={(event) => updateDraft(setEditedDraft, draft, "hotel_type", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                    </Field>
                                    <Field label="Stars">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={draft.stars}
                                            onChange={(event) => updateDraft(setEditedDraft, draft, "stars", clampStars(event.target.value))}
                                            className="border-zinc-700 bg-zinc-950 text-white"
                                        />
                                    </Field>
                                    <Field label="Contact Phone">
                                        <Input value={draft.contact_phone} onChange={(event) => updateDraft(setEditedDraft, draft, "contact_phone", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                    </Field>
                                    <Field label="Contact Email">
                                        <Input value={draft.contact_email} onChange={(event) => updateDraft(setEditedDraft, draft, "contact_email", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                    </Field>
                                    <Field label="Website">
                                        <Input value={draft.website} onChange={(event) => updateDraft(setEditedDraft, draft, "website", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Check-in">
                                            <Input value={draft.check_in_time} onChange={(event) => updateDraft(setEditedDraft, draft, "check_in_time", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                        </Field>
                                        <Field label="Check-out">
                                            <Input value={draft.check_out_time} onChange={(event) => updateDraft(setEditedDraft, draft, "check_out_time", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                        </Field>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Description">
                                        <Textarea value={draft.description} onChange={(event) => updateDraft(setEditedDraft, draft, "description", event.target.value)} className="min-h-[130px] border-zinc-700 bg-zinc-950 text-white" />
                                    </Field>
                                    <Field label="English Description">
                                        <Textarea value={draft.description_en} onChange={(event) => updateDraft(setEditedDraft, draft, "description_en", event.target.value)} className="min-h-[130px] border-zinc-700 bg-zinc-950 text-white" />
                                    </Field>
                                </div>

                                <Field label="Amenities (comma separated)">
                                    <Input
                                        value={draft.amenities.join(", ")}
                                        onChange={(event) => updateDraft(setEditedDraft, draft, "amenities", parseCommaList(event.target.value))}
                                        className="border-zinc-700 bg-zinc-950 text-white"
                                    />
                                </Field>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <FlagCheckbox
                                        label="Official Partner"
                                        checked={draft.is_official_partner}
                                        onChange={(checked) => updateDraft(setEditedDraft, draft, "is_official_partner", checked)}
                                    />
                                    <FlagCheckbox
                                        label="Recommended"
                                        checked={draft.is_recommended}
                                        onChange={(checked) => updateDraft(setEditedDraft, draft, "is_recommended", checked)}
                                    />
                                    <FlagCheckbox
                                        label="Shuttle Service"
                                        checked={draft.has_shuttle_service}
                                        onChange={(checked) => updateDraft(setEditedDraft, draft, "has_shuttle_service", checked)}
                                    />
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                                    <Upload className="h-5 w-5 text-amber-400" />
                                    Hotel Images
                                </div>
                                {draft.images.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 px-4 py-6 text-sm text-zinc-500">
                                        No hotel-level images were confidently detected. You can still create the draft and adjust images later from the hotel edit screen.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                        {draft.images.map((image) => (
                                            <ImageChip
                                                key={image.id}
                                                image={image}
                                                onRemove={() => removeHotelImage(setEditedDraft, draft, image.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                                    <BedDouble className="h-5 w-5 text-amber-400" />
                                    Room Drafts
                                </div>

                                {draft.rooms.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 px-4 py-6 text-sm text-zinc-500">
                                        No room drafts were detected yet. You can still create the hotel and add room types manually afterward.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {draft.rooms.map((room, index) => (
                                            <div key={`${room.name}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
                                                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <h4 className="text-base font-semibold text-white">{room.name}</h4>
                                                        <p className="text-xs text-zinc-500">
                                                            Confidence {(room.confidence * 100).toFixed(0)}%
                                                            {room.source_line ? ` · ${room.source_line}` : ""}
                                                        </p>
                                                    </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                                                            onClick={() => removeRoom(setEditedDraft, draft, index)}
                                                        >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove Room
                                                    </Button>
                                                </div>

                                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                    <Field label="Room Name">
                                                        <Input value={room.name} onChange={(event) => updateRoom(setEditedDraft, draft, index, "name", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                                    </Field>
                                                    <Field label="Type">
                                                        <Input value={room.type} onChange={(event) => updateRoom(setEditedDraft, draft, index, "type", event.target.value)} className="border-zinc-700 bg-zinc-950 text-white" />
                                                    </Field>
                                                    <Field label="Price / Night">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={room.price_per_night}
                                                            onChange={(event) => updateRoom(setEditedDraft, draft, index, "price_per_night", clampNonNegative(event.target.value))}
                                                            className="border-zinc-700 bg-zinc-950 text-white"
                                                        />
                                                    </Field>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Field label="Capacity">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={room.capacity}
                                                                onChange={(event) => updateRoom(setEditedDraft, draft, index, "capacity", clampPositive(event.target.value, 1))}
                                                                className="border-zinc-700 bg-zinc-950 text-white"
                                                            />
                                                        </Field>
                                                        <Field label="Inventory">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={room.total_inventory}
                                                                onChange={(event) => updateRoom(setEditedDraft, draft, index, "total_inventory", clampNonNegative(event.target.value))}
                                                                className="border-zinc-700 bg-zinc-950 text-white"
                                                            />
                                                        </Field>
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                                    <Field label="Description">
                                                        <Textarea value={room.description} onChange={(event) => updateRoom(setEditedDraft, draft, index, "description", event.target.value)} className="min-h-[110px] border-zinc-700 bg-zinc-950 text-white" />
                                                    </Field>
                                                    <Field label="Amenities (comma separated)">
                                                        <Textarea
                                                            value={room.amenities.join(", ")}
                                                            onChange={(event) => updateRoom(setEditedDraft, draft, index, "amenities", parseCommaList(event.target.value))}
                                                            className="min-h-[110px] border-zinc-700 bg-zinc-950 text-white"
                                                        />
                                                    </Field>
                                                </div>

                                                {room.images.length > 0 && (
                                                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                                                        {room.images.map((image) => (
                                                            <ImageChip
                                                                key={image.id}
                                                                image={image}
                                                                onRemove={() => removeRoomImage(setEditedDraft, draft, index, image.id)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {applyState?.error && (
                                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                    {applyState.error}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-5">
                                <div className="text-sm text-zinc-500">
                                    Drafts are created unpublished. We can review final content and publish afterward from the normal hotel edit screen.
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isApplying}
                                    className="bg-amber-500 font-semibold text-black hover:bg-amber-600"
                                >
                                    {isApplying ? (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                                            Creating Draft...
                                        </>
                                    ) : (
                                        <>
                                            Create Hotel Draft
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            )}
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-zinc-300">{label}</Label>
            {children}
        </div>
    );
}

function FlagCheckbox({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-amber-500"
            />
            <span>{label}</span>
        </label>
    );
}

function ImageChip({
    image,
    onRemove,
}: {
    image: ImportImageAsset;
    onRemove: () => void;
}) {
    return (
        <div className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
            <div className="relative aspect-video">
                <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                />
            </div>
            <div className="border-t border-zinc-800 px-3 py-2">
                <p className="truncate text-xs text-zinc-300" title={image.name}>
                    {image.name}
                </p>
            </div>
            <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={onRemove}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

function updateDraft<T extends keyof HotelImportDraft>(
    setDraft: Dispatch<SetStateAction<HotelImportDraft | null>>,
    currentDraft: HotelImportDraft,
    key: T,
    value: HotelImportDraft[T]
) {
    setDraft({ ...currentDraft, [key]: value });
}

function updateRoom<T extends keyof HotelImportDraft["rooms"][number]>(
    setDraft: Dispatch<SetStateAction<HotelImportDraft | null>>,
    currentDraft: HotelImportDraft,
    roomIndex: number,
    key: T,
    value: HotelImportDraft["rooms"][number][T]
) {
    const rooms = currentDraft.rooms.map((room, index) => {
            if (index !== roomIndex) return room;
            return { ...room, [key]: value };
        });
    setDraft({ ...currentDraft, rooms });
}

function removeHotelImage(
    setDraft: Dispatch<SetStateAction<HotelImportDraft | null>>,
    currentDraft: HotelImportDraft,
    imageId: string
) {
    setDraft({
        ...currentDraft,
        images: currentDraft.images.filter((image) => image.id !== imageId),
    });
}

function removeRoom(
    setDraft: Dispatch<SetStateAction<HotelImportDraft | null>>,
    currentDraft: HotelImportDraft,
    roomIndex: number
) {
    setDraft({
        ...currentDraft,
        rooms: currentDraft.rooms.filter((_, index) => index !== roomIndex),
    });
}

function removeRoomImage(
    setDraft: Dispatch<SetStateAction<HotelImportDraft | null>>,
    currentDraft: HotelImportDraft,
    roomIndex: number,
    imageId: string
) {
    const rooms = currentDraft.rooms.map((room, index) => {
            if (index !== roomIndex) return room;
            return {
                ...room,
                images: room.images.filter((image) => image.id !== imageId),
            };
        });
    setDraft({ ...currentDraft, rooms });
}

function parseCommaList(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function clampStars(value: string) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 4;
    return Math.min(5, Math.max(1, Math.round(numericValue)));
}

function clampPositive(value: string, fallback: number) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return fallback;
    return Math.max(fallback, Math.round(numericValue));
}

function clampNonNegative(value: string) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.max(0, numericValue);
}
