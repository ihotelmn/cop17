"use client";

import { useSearchParams } from "next/navigation";
import { Room } from "@/app/actions/admin";
import { format, differenceInDays } from "date-fns";
import { ArrowRight, BedDouble, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReservationSummaryProps {
    hotelId: string;
    rooms: any[]; // Or Pick<Room, 'id' | 'name' | 'price_per_night'>
    checkIn: Date;
    checkOut: Date;
}

export function ReservationSummary({ hotelId, rooms, checkIn, checkOut }: ReservationSummaryProps) {
    const searchParams = useSearchParams();

    const nights = Math.max(1, differenceInDays(checkOut, checkIn));

    // Calculate selected rooms
    const selectedRooms = rooms.reduce((acc, room) => {
        const qtyStr = searchParams.get(`r_${room.id}`);
        const qty = qtyStr ? parseInt(qtyStr) : 0;
        if (qty > 0) {
            acc.push({ ...room, quantity: qty });
        }
        return acc;
    }, [] as any[]);

    if (selectedRooms.length === 0) {
        return (
            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-500">
                    <Info className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">Select your preferred rooms from the list to see your reservation summary and proceed to booking.</p>
                </div>
            </div>
        );
    }

    const totalRooms = selectedRooms.reduce((sum: number, r: any) => sum + r.quantity, 0);
    const totalPrice = selectedRooms.reduce((sum: number, r: any) => sum + (r.price_per_night * r.quantity * nights), 0);

    // Build the checkout URL
    // For now, if there's only one room selected, we can go to standard /checkout/[roomId] with quantity param.
    // If multiple rooms, we need to adapt the checkout page, or we pass multiple via URL parameters.
    // Let's pass the first room as the main to avoid breaking the existing router, BUT add the serialized data so we can handle it later.
    // Wait, let's keep it simple: create a URL search params for all selected rooms
    const checkoutParams = new URLSearchParams(searchParams.toString());
    checkoutParams.set("from", format(checkIn, "yyyy-MM-dd"));
    checkoutParams.set("to", format(checkOut, "yyyy-MM-dd"));

    // Determine target checkout path.
    // If we haven't refactored the checkout to handle multi-rooms yet, we can't easily book them. Let's just pass the first room ID for the path to not break, but pass the rest in params.
    const mainRoomId = selectedRooms[0].id;
    // We already have r_* parameters in searchParams, they are kept via checkoutParams.toString()

    return (
        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Selected Inventory</h4>

            <div className="space-y-3 mb-6">
                {selectedRooms.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-sm p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600">
                                <span className="font-bold text-xs">{r.quantity}x</span>
                            </div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">{r.name}</span>
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">${r.price_per_night * r.quantity * nights}</span>
                    </div>
                ))}
            </div>

            <div className="flex items-end justify-between mb-8">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Estimated Total</p>
                    <p className="text-xs font-bold text-zinc-500">{totalRooms} Rooms, {nights} Nights</p>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tighter text-blue-600 dark:text-blue-400">${totalPrice}</span>
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">USD</span>
                </div>
            </div>

            <Button asChild className="w-full h-18 text-xs font-black uppercase tracking-[0.2em] rounded-2.5xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 transition-all active:scale-[0.97] group">
                <Link href={`/hotels/${hotelId}/checkout?${checkoutParams.toString()}`}>
                    Proceed to Secure Booking
                    <ArrowRight className="ml-4 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </Link>
            </Button>
        </div>
    );
}
