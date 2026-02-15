import { ImageGallery } from "@/components/image-gallery";
import { Star, MapPin } from "lucide-react";
import { RoomList } from "@/components/room-list";
import { SearchForm } from "@/components/search-form";
import { getPublicHotel, getPublicRooms } from "@/app/actions/public";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function HotelDetailPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { from, to } = await searchParams;
    const hotel = await getPublicHotel(id);
    const rooms = await getPublicRooms(id);

    if (!hotel) {
        notFound();
    }

    // Parse dates
    const checkIn = from ? new Date(from) : new Date();
    const checkOut = to ? new Date(to) : new Date(new Date().setDate(new Date().getDate() + 1));

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            {/* ... (hero section) */}
            <div className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <main className="lg:col-span-2 space-y-10">
                    {/* ... (about section) */}

                    <section>
                        <h2 className="text-2xl font-semibold mb-6">Available Rooms</h2>
                        <RoomList hotelId={id} rooms={rooms} checkIn={checkIn} checkOut={checkOut} />
                    </section>
                </main>

                <aside className="lg:col-span-1">
                    <div className="sticky top-20">
                        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <h3 className="font-semibold text-lg mb-4">Modify Search</h3>
                            {/* We can reuse parts of SearchForm or make a compact version */}
                            <div className="text-sm text-zinc-500">
                                Check availability for specific dates to see accurate pricing.
                            </div>
                            <dl className="mt-4 space-y-2 text-sm">
                                {hotel.check_in_time && (
                                    <div className="flex justify-between">
                                        <dt className="text-zinc-500">Check-in</dt>
                                        <dd className="font-medium">{hotel.check_in_time}</dd>
                                    </div>
                                )}
                                {hotel.check_out_time && (
                                    <div className="flex justify-between">
                                        <dt className="text-zinc-500">Check-out</dt>
                                        <dd className="font-medium">{hotel.check_out_time}</dd>
                                    </div>
                                )}
                                {hotel.website && (
                                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                                        <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                                            Visit Website
                                        </a>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
