import { ImageGallery } from "@/components/image-gallery";
import { Star, MapPin, ShieldCheck, Mail, Phone, Globe, Info, Clock, CheckCircle2 } from "lucide-react";
import { RoomList } from "@/components/room-list";
import { SearchForm } from "@/components/search-form";
import { ReservationSummary } from "@/components/reservation-summary";
import { SingleHotelMapWrapper } from "@/components/single-hotel-map";
import { getPublicHotel, getPublicRooms } from "@/app/actions/public";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import type { Metadata, ResolvingMetadata } from "next";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata(
    { params }: PageProps,
    parent: ResolvingMetadata
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
        description: hotel.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || `Book your stay at ${hotel.name} for COP17 Mongolia.`,
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

    // Default dates if missing — MUST match SearchForm defaults (3 nights from today)
    const defaultFrom = format(new Date(), "yyyy-MM-dd");
    const defaultTo = format(addDays(new Date(), 3), "yyyy-MM-dd");

    const checkIn = from || defaultFrom;
    const checkOut = to || defaultTo;

    const hotel = await getPublicHotel(id);
    const adults = parseInt(resolvedParams.adults || "2");
    const children = parseInt(resolvedParams.children || "0");
    const totalGuests = adults + children;
    const rooms = await getPublicRooms(id, totalGuests, checkIn, checkOut);

    if (!hotel) {
        notFound();
    }

    // Use the resolved stay dates safely
    const finalCheckIn = typeof checkIn === 'string' ? new Date(`${checkIn}T12:00:00`) : checkIn;
    const finalCheckOut = typeof checkOut === 'string' ? new Date(`${checkOut}T12:00:00`) : checkOut;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            {/* Header / Breadcrumbs */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        <Link href="/" className="hover:text-blue-500 transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/hotels" className="hover:text-blue-500 transition-colors">Hotels</Link>
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
                    {hotel.description && hotel.description !== "NULL" && (
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
                            <div
                                className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed font-medium"
                                dangerouslySetInnerHTML={{ __html: hotel.description }}
                            />
                        </section>
                    )}

                    {/* Rooms Section */}
                    <section id="rooms" className="scroll-mt-24">
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
                    </section>
                </main>

                {/* Sidebar Sticky Area */}
                <aside className="lg:col-span-4 lg:block">
                    <div className="sticky top-24 space-y-8">

                        {/* Search Persistence / Quick Modify */}
                        <div className="rounded-[2.5rem] bg-white dark:bg-zinc-900 p-10 shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-12 -mr-6 -mt-6 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
                            <h3 className="font-black text-xl text-zinc-950 dark:text-white mb-8 tracking-tight uppercase tracking-widest text-xs opacity-50">Reservation Assistant</h3>

                            <div className="space-y-8 relative z-10">
                                <SearchForm />

                                <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Policy</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Check-In</p>
                                            <p className="text-xl font-black text-zinc-900 dark:text-white">{hotel.check_in_time?.substring(0, 5) || "14:00"}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ready</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Check-Out</p>
                                            <p className="text-xl font-black text-zinc-900 dark:text-white">{hotel.check_out_time?.substring(0, 5) || "11:00"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Newly Added Reservation Summary */}
                                <ReservationSummary
                                    hotelId={id}
                                    rooms={rooms}
                                    checkIn={finalCheckIn}
                                    checkOut={finalCheckOut}
                                />

                                {hotel.website && (
                                    <a
                                        href={hotel.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-full px-8 py-5 bg-zinc-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-zinc-950/10 active:scale-95 group"
                                    >
                                        <Globe className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" />
                                        Official Website
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Direct Contact Card */}
                        <div className="p-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20">
                            <h4 className="text-sm font-black uppercase tracking-[0.2em] opacity-60 mb-8">Direct Contact</h4>
                            <div className="space-y-6">
                                <div className="flex items-center gap-5 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <Mail className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Email Support</p>
                                        <p className="font-bold text-lg">hotel@support.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <Phone className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Call Directly</p>
                                        <p className="font-bold text-lg">+976 11-123-456</p>
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
