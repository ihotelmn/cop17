"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const organizers = [
    {
        src: "/images/partner logos/gov-mongolia.png",
        alt: "Government of Mongolia",
        frameClassName: "p-4 md:p-5",
        imageClassName: "scale-[0.9]",
    },
    {
        src: "/images/partner logos/ministry-environment.png",
        alt: "Ministry of Environment",
        frameClassName: "p-4 md:p-5",
        imageClassName: "scale-[0.82]",
    },
    {
        src: "/images/partner logos/ministry-foreign.png",
        alt: "Ministry of Foreign Affairs",
        frameClassName: "p-3 md:p-4",
        imageClassName: "scale-[1.08]",
    },
    {
        src: "/images/partner logos/ulaanbaatar-city.png",
        alt: "Governor's Office of Ulaanbaatar",
        frameClassName: "p-4 md:p-5",
        imageClassName: "scale-[0.92]",
    },
] as const;

export function OrganizersSection() {
    return (
        <section className="relative overflow-hidden border-t border-white/5 bg-zinc-950 py-24">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/5 blur-[120px]" />

            <div className="container mx-auto px-4 text-center relative z-10">
                <div className="flex flex-col items-center gap-4 mb-16">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Official Partners</span>
                    <h3 className="text-xl font-black text-white/90 tracking-tight">
                        Organized By
                    </h3>
                    <p className="max-w-2xl text-sm font-medium leading-relaxed text-zinc-400">
                        Official institutions presented in a unified display system for a cleaner visual rhythm.
                    </p>
                </div>

                <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
                    {organizers.map((organizer) => (
                        <OrganizerLogo
                            key={organizer.alt}
                            src={organizer.src}
                            alt={organizer.alt}
                            frameClassName={organizer.frameClassName}
                            imageClassName={organizer.imageClassName}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function OrganizerLogo({
    src,
    alt,
    frameClassName,
    imageClassName,
}: {
    src: string;
    alt: string;
    frameClassName?: string;
    imageClassName?: string;
}) {
    return (
        <div className="group relative">
            <div className="absolute inset-0 rounded-[1.45rem] bg-blue-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative flex aspect-[1.6/1] items-center justify-center overflow-hidden rounded-[1.45rem] border border-white/10 bg-white shadow-[0_16px_38px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:-translate-y-1">
                <div className={cn("flex h-full w-full items-center justify-center", frameClassName)}>
                    <Image
                        src={src}
                        alt={alt}
                        width={220}
                        height={140}
                        className={cn(
                            "h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]",
                            imageClassName
                        )}
                        priority
                    />
                </div>
            </div>
        </div>
    );
}
