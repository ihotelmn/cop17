"use client";

import Image from "next/image";

export function OrganizersSection() {
    return (
        <section className="py-16 border-t border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto px-4 text-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300 mb-12">
                    Organized By
                </h3>
                <div className="flex flex-nowrap justify-center items-center gap-4 md:gap-20 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide px-4 md:px-0">
                    <OrganizerLogo
                        src="/images/partner logos/gov-mongolia.png"
                        alt="Government of Mongolia"
                        width={120}
                        height={120}
                    />
                    <OrganizerLogo
                        src="/images/partner logos/ministry-environment.png"
                        alt="Ministry of Environment"
                        width={120}
                        height={120}
                    />
                    <OrganizerLogo
                        src="/images/partner logos/ministry-foreign.png"
                        alt="Ministry of Foreign Affairs"
                        width={180}
                        height={120}
                    />
                    <OrganizerLogo
                        src="/images/partner logos/ulaanbaatar-city.png"
                        alt="Governor's Office of Ulaanbaatar"
                        width={150}
                        height={120}
                    />
                </div>
            </div>
        </section>
    );
}

function OrganizerLogo({ src, alt, width, height }: { src: string, alt: string, width: number, height: number }) {
    return (
        <div className="relative transition-transform duration-300 hover:scale-110 flex items-center justify-center shrink-0">
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className="h-8 md:h-20 w-auto object-contain drop-shadow-lg"
            />
        </div>
    )
}
