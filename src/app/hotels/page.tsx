import { getPublishedHotels } from "@/app/actions/public";
import { HotelList } from "@/components/hotel-list";
import { HotelSearch } from "@/components/hotel-search";
import { HotelMapWrapper as HotelMap } from "@/components/hotel-map-wrapper";
import { Suspense } from 'react';
import { Search } from 'lucide-react';


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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 pt-20">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="mt-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-2xl">
                        <h1 className="text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
                            Find Your Stay
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-xl font-medium leading-relaxed">
                            Premium accommodations carefully selected for COP17 Mongolia delegates.
                        </p>
                    </div>
                </div>

                <HotelSearch />

                <div className="mt-12">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">
                            {hotels.length} {hotels.length === 1 ? 'Hotel' : 'Hotels'} Available
                        </h2>
                    </div>

                    {hotels.length > 0 ? (
                        view === "map" ? (
                            <div className="space-y-12">
                                <Suspense fallback={<div className="h-[600px] bg-zinc-100 animate-pulse rounded-2xl" />}>
                                    <HotelMap hotels={hotels} />
                                </Suspense>

                                <div className="pt-16 border-t border-zinc-200 dark:border-zinc-800">
                                    <h3 className="text-2xl font-black mb-8 tracking-tight">Quick List</h3>
                                    <HotelList hotels={hotels} />
                                </div>
                            </div>
                        ) : (
                            <HotelList hotels={hotels} />
                        )
                    ) : (
                        <div className="text-center py-32 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Search className="h-10 w-10 text-zinc-400" />
                            </div>
                            <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">No Results Found</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-3 max-w-sm mx-auto text-lg">
                                Try adjusting your filters or search terms to find your ideal accommodation.
                            </p>
                            <div className="mt-10">
                                <button
                                    onClick={() => {/* This will be handled by the Search clear button */ }}
                                    className="text-blue-600 font-bold hover:underline"
                                >
                                    Reset all filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
