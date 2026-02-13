"use client";

import { motion } from "framer-motion";
import { ArrowRight, Hotel, ShieldCheck, Star, Users, Bus, Clock, CreditCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Banner */}
      {/* Background Banner with Dark Overlay for Contrast */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/cop17-back.avif"
          alt="Mongolia Landscape"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay to make text pop */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      <div className="relative z-10 max-w-5xl w-full text-center space-y-16 pt-24 pb-20">

        {/* Hero Section */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white shadow-xl">
            <Image
              src="/images/cop17-logo-horizontal.png"
              alt="COP17 Logo"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
            <div className="h-5 w-px bg-zinc-300" />
            <span className="text-sm font-bold text-zinc-900 tracking-wide">
              OFFICIAL ACCOMMODATION BOOKING PLATFORM
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white uppercase drop-shadow-lg">
            UNCCD COP17 <br />
            <span className="text-blue-300">Ulaanbaatar</span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-100 font-medium max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            Welcome to the official accommodation booking portal for the 17th Session of the Conference of the Parties (COP17) to the UNCCD, taking place in Ulaanbaatar, Mongolia.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link href="/hotels" className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-blue-600 px-10 font-bold text-white transition-all duration-300 hover:bg-blue-700 hover:scale-105 shadow-xl hover:shadow-2xl">
              <span className="mr-2 text-lg">Book Accommodation</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="https://unccdcop17.org" target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center justify-center rounded-full bg-white/10 border border-white/30 backdrop-blur-md px-10 font-bold text-white shadow-lg transition-all hover:bg-white/20 hover:scale-105">
              Official Site
            </a>
          </div>
        </div>

        {/* Stats / Highlights - REPLACED WITH BOOKING STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-white/20 max-w-4xl mx-auto bg-black/20 backdrop-blur-sm rounded-2xl">
          <StatItem value="45+" label="Certified Hotels" />
          <StatItem value="3,500+" label="Rooms Secured" />
          <StatItem value="24/7" label="Delegate Support" />
          <StatItem value="Free" label="Shuttle Service" />
        </div>

        {/* Focused Content - REPLACED WITH DELEGATE BENEFITS */}
        <div className="text-left space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Delegate Benefits</h2>
            <p className="text-zinc-200 text-lg">Why book through the official platform?</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<ShieldCheck className="h-8 w-8 text-green-400" />}
              title="Official & Secure"
              description="All listed properties are vetted and certified by the COP17 Organizing Committee to ensure safety, hygiene, and comfort."
            />
            <FeatureCard
              icon={<Bus className="h-8 w-8 text-blue-400" />}
              title="Transport Logistics"
              description="Guests at official hotels enjoy complimentary express shuttle services to and from the conference venue."
            />
            <FeatureCard
              icon={<CreditCard className="h-8 w-8 text-amber-400" />}
              title="Best Rate Guarantee"
              description="Access exclusive negotiated rates and flexible cancellation policies tailored specifically for international delegates."
            />
          </div>
        </div>

        {/* Organizers */}
        <div className="pb-12 pt-12">
          <h3 className="text-center text-sm font-bold uppercase tracking-widest text-zinc-300 mb-10">Organized By</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
            <OrganizerLogo
              src="/images/partner logos/gov-mongolia.png"
              alt="Government of Mongolia"
              width={100}
              height={100}
            />
            <OrganizerLogo
              src="/images/partner logos/ministry-environment.png"
              alt="Ministry of Environment"
              width={100}
              height={100}
            />
            <OrganizerLogo
              src="/images/partner logos/ministry-foreign.png"
              alt="Ministry of Foreign Affairs"
              width={159}
              height={100}
            />
            <OrganizerLogo
              src="/images/partner logos/ulaanbaatar-city.png"
              alt="Governor's Office of Ulaanbaatar"
              width={130}
              height={100}
            />
          </div>
        </div>

        {/* Powered By */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-zinc-400 text-sm font-medium">
            Powered by <span className="text-white font-bold">iHotel</span>
          </p>
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

function OrganizerLogo({ src, alt, width, height }: { src: string, alt: string, width: number, height: number }) {
  return (
    <div className="relative transition-transform duration-300 hover:scale-110 flex items-center justify-center">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-20 w-auto md:h-24 object-contain drop-shadow-lg"
      />
    </div>
  )
}
