import { ImageGallery } from "@/components/image-gallery";
import { Star, MapPin, ShieldCheck, Info, Clock, CheckCircle2 } from "lucide-react";
import { RoomList } from "@/components/room-list";
import { SearchForm } from "@/components/search-form";
import { ReservationSummary } from "@/components/reservation-summary";
import { SingleHotelMapWrapper } from "@/components/single-hotel-map";
import { getPublicHotel, getPublicRooms } from "@/app/actions/public";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { sanitizeRichTextToParagraphs, sanitizeRichTextToPlainText } from "@/lib/safe-rich-text";

// Hotel detail pages are mostly static (name, description, images, amenities).
// Cache for 5 minutes — availability/pricing calls can stream separately.
export const revalidate = 300;

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata(
    { params }: PageProps
): Promise<Metadata> {
    const { id } = await params;
    const hotel = await getPublicHotel(id);

    if (!hotel) {
        return {
            title: "Hotel Not Found | COP17 Mongolia",
        };
    }

    return {
        title: `${hotel.name} | COP17 Mongolia Official Booking`,
        description: sanitizeRichTextToPlainText(hotel.description).substring(0, 160) || `Book your stay at ${hotel.name} for COP17 Mongolia.`,
        openGraph: {
            title: hotel.name,
            description: `Official accommodation for COP17 at ${hotel.name}.`,
            images: hotel.images?.[0] ? [hotel.images[0]] : [],
        },
    };
}

export default async function HotelDetailPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const resolvedParams = await searchParams;
    const { from, to } = resolvedParams;
    const bookingSearchString = new URLSearchParams(
        Object.entries(resolvedParams).filter(([, value]) => Boolean(value)) as [string, string][]
    ).toString();
    const homeHref = bookingSearchString ? `/?${bookingSearchString}` : "/";
    const hotelsHref = bookingSearchString ? `/?${bookingSearchString}#search` : "/#search";

    // No default dates — if user hasn't picked dates, they stay undefined
    // This prevents fake defaults from appearing and causing sync issues
    const checkIn = from || undefined;
    const checkOut = to || undefined;

    const hotel = await getPublicHotel(id);
    const adults = parseInt(resolvedParams.adults || "2");
    const children = parseInt(resolvedParams.children || "0");
    const totalGuests = adults + children;
    const rooms = await getPublicRooms(id, totalGuests, checkIn, checkOut);

    if (!hotel) {
        notFound();
    }

    // Create Date objects only if dates exist
    const finalCheckIn = checkIn ? new Date(`${checkIn}T12:00:00`) : undefined;
    const finalCheckOut = checkOut ? new Date(`${checkOut}T12:00:00`) : undefined;
    const hotelDescriptionParagraphs = sanitizeRichTextToParagraphs(hotel.description);

    return (
        <div className="min-h-screen bg-zinc-50 pb-40 dark:bg-zinc-950 lg:pb-20">
            {/* Header / Breadcrumbs */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        <Link href={homeHref} className="hover:text-blue-500 transition-colors">Home</Link>
                        <span>/</span>
                        <Link href={hotelsHref} className="hover:text-blue-500 transition-colors">Hotels</Link>
                        <span>/</span>
                        <span className="text-zinc-600 dark:text-zinc-300">{hotel.name}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Hero */}
            <div className="bg-white dark:bg-black relative overflow-hidden">
                <div className="container mx-auto px-4 py-12 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                        {/* Gallery Column */}
                        <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                            <div className="rounded-[2rem] overflow-hidden shadow-2xl bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700">
                                <ImageGallery images={hotel.images || []} alt={hotel.name} aspectRatio="video" />
                            </div>
                        </div>

                        {/* Title & Rapid Info */}
                        <div className="lg:col-span-12 xl:col-span-4 flex flex-col h-full justify-center py-4 lg:py-0">
                            {hotel.stars && hotel.stars > 0 ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-6 self-start">
                                    <div className="flex text-amber-500 gap-0.5">
                                        {[...Array(hotel.stars)].map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                        {hotel.stars}-Star Premium Hotel
                                    </span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-6 self-start">
                                    <Star className="w-3.5 h-3.5 text-zinc-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                        Star rating not provided
                                    </span>
                                </div>
                            )}

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-950 dark:text-white mb-6 tracking-tight leading-[1.05]">
                                {hotel.name}
                            </h1>

                            <div className="mb-8 rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl group">
                                <div className="h-48 w-full relative">
                                    {hotel.latitude && hotel.longitude ? (
                                        <SingleHotelMapWrapper
                                            latitude={hotel.latitude}
                                            longitude={hotel.longitude}
                                            hotelName={hotel.name}
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <MapPin className="w-12 h-12 text-zinc-300" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold leading-tight text-zinc-900 dark:text-zinc-100">
                                            {hotel.address || "Location not specified"}
                                        </p>
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 mt-2 inline-block"
                                        >
                                            Get Directions
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {(hotel.cached_rating || hotel.cached_review_count) && (
                                <div className="flex items-center gap-6 p-6 rounded-3xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                    <div className="text-5xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                                        {hotel.cached_rating || "N/A"}/5
                                    </div>
                                    <div className="h-10 w-px bg-blue-200 dark:bg-blue-800/50" />
                                    <div className="space-y-1">
                                        <p className="text-lg font-black text-blue-900 dark:text-blue-100">Superb</p>
                                        <p className="text-xs text-blue-800/60 dark:text-blue-200/60 uppercase font-black tracking-widest">
                                            {hotel.cached_review_count || 0} Professional Reviews
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="container mx-auto px-4 mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Main Content Area */}
                <main className="lg:col-span-8 space-y-16">

                    {/* Description Section */}
                    {hotelDescriptionParagraphs.length > 0 && (
                        <section className="bg-white dark:bg-zinc-900/40 p-10 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Info className="w-24 h-24" />
                            </div>
                            <h2 className="text-2xl font-black text-zinc-950 dark:text-white mb-8 tracking-tight flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                                Detailed Property Overview
                            </h2>
                            <div className="space-y-5 text-lg font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
                                {hotelDescriptionParagraphs.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Rooms Section */}
                    <section id="rooms" className="scroll-mt-24">
                        <div
                            id="mobile-search-assistant"
                            className="mb-6 lg:hidden"
                        >
                            <div className="mb-3">
                                <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
                                    Stay details
                                </h3>
                            </div>
                            <SearchForm compact className="space-y-3" />
                        </div>

                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-zinc-950 dark:text-white tracking-tight">Available Residences</h2>
                                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Select your preferred room type</p>
                            </div>
                            <div className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full text-xs font-black uppercase tracking-widest">
                                {rooms.length} Suites Left
                            </div>
                        </div>
                        <RoomList hotelId={id} rooms={rooms} checkIn={finalCheckIn} checkOut={finalCheckOut} />
                        <ReservationSummary
                            hotelId={id}
                            rooms={rooms}
                            checkIn={finalCheckIn}
                            checkOut={finalCheckOut}
                            mode="mobile"
                        />
                    </section>
                </main>

                {/* Sidebar Sticky Area */}
                <aside className="lg:col-span-4">
                    <div className="space-y-6 lg:sticky lg:top-20">

                        {/* Search Persistence / Quick Modify */}
                        <div id="reservation-assistant" className="relative hidden overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/30 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none lg:block">
                            <div className="mb-4">
                                <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">Stay details</h3>
                                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                    Update dates, guests, and rooms before checkout.
                                </p>
                            </div>

                            <div className="relative z-10 space-y-4">
                                <SearchForm compact />

                                <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                    <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Check-in</span>
                                        </div>
                                        <p className="mt-2 text-lg font-black text-zinc-900 dark:text-white">
                                            {hotel.check_in_time?.substring(0, 5) || "14:00"}
                                        </p>
                                    </div>
                                    <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Check-out</span>
                                        </div>
                                        <p className="mt-2 text-lg font-black text-zinc-900 dark:text-white">
                                            {hotel.check_out_time?.substring(0, 5) || "11:00"}
                                        </p>
                                    </div>
                                </div>

                                {/* Newly Added Reservation Summary */}
                                <ReservationSummary
                                    hotelId={id}
                                    rooms={rooms}
                                    checkIn={finalCheckIn}
                                    checkOut={finalCheckOut}
                                    mode="desktop"
                                />
                            </div>
                        </div>

                        {/* Booking Contact Policy */}
                        <div className="p-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20">
                            <h4 className="text-sm font-black uppercase tracking-[0.2em] opacity-60 mb-8">Official Booking Policy</h4>
                            <div className="space-y-6">
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Protected Conversion</p>
                                        <p className="font-bold text-lg leading-tight">Hotel phone numbers and websites unlock after payment.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                        <Info className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">When It Appears</p>
                                        <p className="font-bold text-lg leading-tight">Once your booking is confirmed and paid, direct hotel contact details appear in your booking pages and receipt.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </aside>
            </div>
        </div>
    )
}
