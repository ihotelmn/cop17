import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { RoomList } from "@/components/room-list";
import { SearchForm } from "@/components/search-form";
// import { getHotel, getRooms } from "@/app/actions/admin"; // WRONG: Admin only
import { getPublicHotel, getPublicRooms } from "@/app/actions/public"; // CORRECT: Public access
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function HotelDetailPage({ params }: PageProps) {
    const { id } = await params;
    const hotel = await getPublicHotel(id); // Use public action
    const rooms = await getPublicRooms(id); // Use public action

    if (!hotel) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            {/* Hero Image */}
            <div className="relative h-[50vh] w-full items-end justify-start flex">
                <div className="absolute inset-0">
                    <Image
                        src={hotel.images?.[0] || "/images/placeholder-hotel.jpg"}
                        alt={hotel.name}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                <div className="container mx-auto px-4 relative z-10 pb-10 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-500/40">
                            <Star className="mr-1 h-3 w-3 fill-current" /> {hotel.stars} Stars
                        </span>
                        {hotel.hotel_type && (
                            <span className="inline-flex items-center rounded-full bg-zinc-500/20 px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-500/40">
                                {hotel.hotel_type}
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">{hotel.name}</h1>
                    <div className="flex items-center mt-4 text-zinc-300">
                        <MapPin className="mr-2 h-5 w-5" />
                        {hotel.address}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <main className="lg:col-span-2 space-y-10">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">About</h2>
                        <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {hotel.description}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {hotel.amenities?.map(amenity => (
                                <span key={amenity} className="inline-flex items-center rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                    {amenity}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-6">Available Rooms</h2>
                        <RoomList hotelId={id} rooms={rooms} />
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

