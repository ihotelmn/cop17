
import { motion } from "framer-motion";
import { ArrowRight, Hotel, ShieldCheck, Star, Users, Bus, Clock, CreditCard, Search, Map as MapIcon, List as ListIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from 'react';
import { cn } from "@/lib/utils";
import ScrollReveal from "@/components/scroll-reveal";
import { Button } from "@/components/ui/button";

// Hotel components
import { HotelList } from "@/components/hotel-list";
import { HotelSearch, SortDropdown } from "@/components/hotel-search";
import { HotelMapWrapper as HotelMap } from "@/components/hotel-map-wrapper";
import { FilterSidebar } from "@/components/hotels/filter-sidebar";

import { getHomepageStats, getPublishedHotels } from "@/app/actions/public";
import { HotelSections } from "@/components/hotel-sections";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home(props: Props) {
  const stats = await getHomepageStats();
  const searchParams = await props.searchParams;

  // Normalize params for hotels
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
  const adults = getParam("adults");
  const children = getParam("children");
  const roomsCount = getParam("rooms");
  const from = getParam("from");
  const to = getParam("to");

  const hotels = await getPublishedHotels({
    query,
    stars,
    amenities,
    sortBy,
    minPrice,
    maxPrice,
    adults,
    children,
    rooms: roomsCount,
    from,
    to,
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Banner */}
      {/* Background Banner with Dark Overlay for Contrast */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/cop17-back.avif"
          alt="Mongolia Landscape"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        {/* Dark overlay to make text pop */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      <div className="relative z-10 max-w-5xl w-full text-center pt-32 pb-40">

        {/* Hero Section */}
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <ScrollReveal width="100%">
            <div className="flex justify-center mb-16">
              <div className="inline-flex items-center gap-5 rounded-2xl bg-black/20 backdrop-blur-xl px-7 py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 transition-all hover:scale-105 hover:bg-black/30 group">
                <div className="relative">
                  <Image
                    src="/images/cop17-logo-horizontal.png"
                    alt="COP17 Logo"
                    width={130}
                    height={40}
                    className="h-8 w-auto object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
                    priority
                  />
                </div>
                <div className="h-6 w-px bg-white/20"></div>
                <span className="text-[10px] font-black text-white/80 tracking-[0.15em] uppercase leading-tight text-left">
                  Official Accommodation <br />
                  <span className="text-blue-400">Booking Platform</span>
                </span>
              </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 drop-shadow-2xl">
              Find Your Stay <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">COP17 Mongolia</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-bold max-w-3xl mx-auto leading-relaxed drop-shadow-xl tracking-tight opacity-90">
              Premium accommodations vetted for UNCCD COP17 delegates. <br className="hidden md:block" />
              Secure your stay near the venue with official delegate support.
            </p>
          </ScrollReveal>

        </div>

      </div>

      {/* --- HOTELS SECTION --- */}
      <div className="w-full bg-zinc-50 dark:bg-zinc-950 py-16 -mt-10 relative z-20 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4 max-w-7xl">

          {/* Search Bar */}
          <div className="-mt-32 mb-16 relative z-30">
            <HotelSearch />
          </div>

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Sidebar Filters (Desktop) */}
            <aside className="hidden lg:block w-[280px] shrink-0 space-y-8 sticky top-24 h-fit">
              <FilterSidebar />
            </aside>

            {/* Hotel List */}
            <div className="flex-1 min-w-0">
              {/* Controls: Count, View Toggle, Sort */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {hotels.length} Properties Found
                </h2>

                <div className="flex items-center gap-3">
                  <SortDropdown />

                  {/* Toggle View */}
                  <div className="flex items-center bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hidden sm:flex">
                    <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" asChild>
                      <Link href={`/?view=list`} scroll={false}>
                        <ListIcon className="h-4 w-4 mr-2" /> List
                      </Link>
                    </Button>
                    <Button variant={view === "map" ? "secondary" : "ghost"} size="sm" asChild>
                      <Link href={`/?view=map`} scroll={false}>
                        <MapIcon className="h-4 w-4 mr-2" /> Map
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results */}
              {hotels.length > 0 ? (
                // If NO search/filter/sort is active AND we are in 'list' view, show categorized sections
                // Otherwise show standard List or Map
                (view === "list" && !query && !stars && !amenities && !minPrice && !maxPrice && !sortBy) ? (
                  <HotelSections hotels={hotels} />
                ) : (
                  view === "map" ? (
                    <div className="space-y-8">
                      <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm h-[600px]">
                        <Suspense fallback={<div className="h-full bg-zinc-100 animate-pulse" />}>
                          <HotelMap hotels={hotels} query={query} />
                        </Suspense>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {hotels.map(hotel => (
                          <div key={hotel.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-bold text-zinc-900 dark:text-white">{hotel.name}</h3>
                            <p className="text-sm text-zinc-500">${hotel.minPrice}/night</p>
                            <Link href={`/hotels/${hotel.id}${Object.keys(searchParams).length ? '?' + new URLSearchParams(searchParams as Record<string, string>).toString() : ''}`} className="text-sm text-blue-600 hover:underline mt-2 inline-block font-medium">View Details</Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <HotelList hotels={hotels} />
                  )
                )
              ) : (
                <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Search className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No properties found</h3>
                  <p className="text-zinc-500 mb-6">Try adjusting your filters.</p>
                  <Button variant="outline" asChild>
                    <Link href="/" scroll={false}>Clear Filters</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* --- INFO SECTION --- */}
      <div className="w-full bg-zinc-950 py-20 relative z-10">
        <div className="max-w-5xl mx-auto px-4">
          {/* Stats / Highlights - DYNAMICALLY LOADED */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-white/10 mb-16 rounded-2xl">
            <StatItem value={`${stats.hotels}+`} label="Certified Hotels" />
            <StatItem value={`${stats.rooms.toLocaleString()}+`} label="Rooms Secured" />
            <StatItem value="24/7" label="Delegate Support" />
            <StatItem value="Free" label="Shuttle Service" />
          </div>

          {/* Focused Content - DELEGATE BENEFITS */}
          <div className="text-left space-y-12">
            <div className="text-center space-y-4">
              <ScrollReveal>
                <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Delegate Benefits</h2>
                <p className="text-zinc-400 text-lg">Why book through the official platform?</p>
              </ScrollReveal>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <ScrollReveal delay={0.1}>
                <FeatureCard
                  icon={<ShieldCheck className="h-8 w-8 text-green-400" />}
                  title="Official & Secure"
                  description="All listed properties are vetted and certified by the COP17 Organizing Committee to ensure safety, hygiene, and comfort."
                />
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <FeatureCard
                  icon={<Bus className="h-8 w-8 text-blue-400" />}
                  title="Transport Logistics"
                  description="Guests at official hotels enjoy complimentary express shuttle services to and from the conference venue."
                />
              </ScrollReveal>
              <ScrollReveal delay={0.3}>
                <FeatureCard
                  icon={<CreditCard className="h-8 w-8 text-amber-400" />}
                  title="Best Rate Guarantee"
                  description="Access exclusive negotiated rates and flexible cancellation policies tailored specifically for international delegates."
                />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md transition-transform hover:scale-105 hover:bg-black/50 shadow-lg">
      <div className="p-4 rounded-full bg-white/10 shadow-inner">
        {icon}
      </div>
      <h3 className="font-bold text-xl text-white">{title}</h3>
      <p className="text-base text-zinc-300 text-center leading-relaxed">{description}</p>
    </div>
  )
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <span className="text-4xl font-extrabold text-white drop-shadow-md">{value}</span>
      <span className="text-xs uppercase tracking-widest text-zinc-300 font-bold">{label}</span>
    </div>
  )
}
