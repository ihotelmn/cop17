import { getPublishedHotels } from "@/app/actions/public";
import { HotelList } from "@/components/hotel-list";
import { HotelSearch } from "@/components/hotel-search";
import { HotelMapWrapper as HotelMap } from "@/components/hotel-map-wrapper";
import { FilterSidebar } from "@/components/hotels/filter-sidebar";
import { Suspense } from 'react';
import { Search, Map as MapIcon, List as ListIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HotelsPage(props: Props) {
    const searchParams = await props.searchParams;

    // Normalize params
    const getParam = (key: string) => {
        const val = searchParams[key];
        return Array.isArray(val) ? val[0] : val;
    };

    const query = getParam("query");
    const stars = getParam("stars");
    const amenities = getParam("amenities");
    const sortBy = getParam("sortBy");
    const minPrice = getParam("minPrice");
    const maxPrice = getParam("maxPrice");
    const view = getParam("view") || "list";

    const hotels = await getPublishedHotels({
        query,
        stars,
        amenities,
        sortBy,
        minPrice,
        maxPrice,
    });

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 pt-24">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header Section */}
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-4">
                        Find Your Stay
                    </h1>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl">
                        Official premium accommodations for COP17 Mongolia delegates.
                        Secure, comfortable, and close to the venue.
                    </p>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

                    {/* Sidebar Filters (Desktop) */}
                    <div className="hidden lg:block lg:col-span-1 space-y-8 sticky top-24 h-fit">
                        <FilterSidebar />
                    </div>

                    {/* Hotel List */}
                    <div className="lg:col-span-3">
                        {/* Mobile Filter & Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h2 className="text-xl font-bold tracking-tight">
                                {hotels.length} Properties Found
                            </h2>

                            <div className="flex items-center gap-2">
                                {/* Toggle View (Mock for now, can implement real toggle via URL) */}
                                <div className="flex items-center bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" asChild>
                                        <Link href={`/hotels?view=list`} scroll={false}>
                                            <ListIcon className="h-4 w-4 mr-2" /> List
                                        </Link>
                                    </Button>
                                    <Button variant={view === "map" ? "secondary" : "ghost"} size="sm" asChild>
                                        <Link href={`/hotels?view=map`} scroll={false}>
                                            <MapIcon className="h-4 w-4 mr-2" /> Map
                                        </Link>
                                    </Button>
                                </div>
                                {/* Sort Dropdown can go here */}
                            </div>
                        </div>

                        {/* Results */}
                        {hotels.length > 0 ? (
                            view === "map" ? (
                                <div className="space-y-8">
                                    <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm h-[600px]">
                                        <Suspense fallback={<div className="h-full bg-zinc-100 animate-pulse" />}>
                                            <HotelMap hotels={hotels} />
                                        </Suspense>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Show a subset or list below map */}
                                        {hotels.map(hotel => (
                                            /* We will use a smaller card variant here if needed, or normal */
                                            <div key={hotel.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border">
                                                <h3 className="font-bold">{hotel.name}</h3>
                                                <p className="text-sm text-zinc-500">${hotel.minPrice}/night</p>
                                                <Link href={`/hotels/${hotel.id}`} className="text-sm text-blue-600 hover:underline">View</Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <HotelList hotels={hotels} />
                            )
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                <Search className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">No properties found</h3>
                                <p className="text-zinc-500 mb-6">Try adjusting your filters.</p>
                                <Button variant="outline" onClick={() => { /* Filters reset via sidebar or link */ }}>
                                    <Link href="/hotels">Clear Filters</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
