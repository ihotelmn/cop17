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
            {/* Hero Section */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg bg-zinc-100 dark:bg-zinc-800">
                            <ImageGallery images={hotel.images || []} alt={hotel.name} />
                        </div>
                        <div className="flex flex-col justify-center space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex text-amber-500">
                                        {[...Array(hotel.stars || 5)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-current" />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                        {hotel.stars}-Star Hotel
                                    </span>
                                </div>
                                <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                                    {hotel.name}
                                </h1>
                                <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <p className="text-lg leading-relaxed">
                                        {hotel.address || "Location not specified"}
                                    </p>
                                </div>
                            </div>

                            {(hotel.cached_rating || hotel.cached_review_count) && (
                                <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                    <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                        {hotel.cached_rating || "N/A"}
                                    </div>
                                    <div className="text-sm text-amber-800/80 dark:text-amber-200/80">
                                        Based on {hotel.cached_review_count || 0} reviews
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <main className="lg:col-span-2 space-y-12">
                    {hotel.description && (
                        <section className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">About the Hotel</h2>
                            <div
                                className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: hotel.description }}
                            />
                        </section>
                    )}

                    <section id="rooms">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Available Rooms</h2>
                            <div className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-sm font-medium">
                                {rooms.length} Room types found
                            </div>
                        </div>
                        <RoomList hotelId={id} rooms={rooms} checkIn={checkIn} checkOut={checkOut} />
                    </section>
                </main>

                <aside className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <h3 className="font-bold text-xl text-zinc-900 dark:text-white mb-6">Modify Search</h3>

                            <div className="space-y-6">
                                <SearchForm />

                                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Hotel Policies</h4>
                                    <dl className="space-y-4">
                                        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                                            <dt className="text-zinc-500 dark:text-zinc-400 text-sm">Check-in</dt>
                                            <dd className="font-bold text-zinc-900 dark:text-white">
                                                {hotel.check_in_time?.substring(0, 5) || "14:00"}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                                            <dt className="text-zinc-500 dark:text-zinc-400 text-sm">Check-out</dt>
                                            <dd className="font-bold text-zinc-900 dark:text-white">
                                                {hotel.check_out_time?.substring(0, 5) || "11:00"}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                {hotel.website && (
                                    <a
                                        href={hotel.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-xl transition-colors duration-200"
                                    >
                                        Visit Official Website
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
