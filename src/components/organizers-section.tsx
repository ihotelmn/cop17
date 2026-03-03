"use client";

import Image from "next/image";

export function OrganizersSection() {
    return (
        <section className="py-24 border-t border-white/5 bg-zinc-950 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 text-center relative z-10">
                <div className="flex flex-col items-center gap-4 mb-16">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Official Partners</span>
                    <h3 className="text-xl font-black text-white/90 tracking-tight">
                        Organized By
                    </h3>
                </div>

                <div className="flex flex-nowrap justify-center items-center gap-12 md:gap-24 overflow-x-auto md:overflow-visible pb-8 md:pb-0 scrollbar-hide px-8 md:px-0">
                    <OrganizerLogo
                        src="/images/partner logos/gov-mongolia.png"
                        alt="Government of Mongolia"
                    />
                    <OrganizerLogo
                        src="/images/partner logos/ministry-environment.png"
                        alt="Ministry of Environment"
                    />
                    <OrganizerLogo
                        src="/images/partner logos/ministry-foreign.png"
                        alt="Ministry of Foreign Affairs"
                    />
                    <OrganizerLogo
                        src="/images/partner logos/ulaanbaatar-city.png"
                        alt="Governor's Office of Ulaanbaatar"
                    />
                </div>
            </div>
        </section>
    );
}

function OrganizerLogo({ src, alt }: { src: string, alt: string }) {
    return (
        <div className="relative group flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-white/5 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 opacity-0 group-hover:opacity-100" />
            <Image
                src={src}
                alt={alt}
                width={200}
                height={120}
                className="h-10 md:h-20 w-auto object-contain brightness-100 group-hover:brightness-110 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-500"
                priority
            />
        </div>
    )
}
