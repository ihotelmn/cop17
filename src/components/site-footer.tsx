"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Monitor } from "lucide-react";

export function SiteFooter() {
    return (
        <footer className="bg-zinc-950 border-t border-white/5 pt-24 pb-12 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">

                    {/* Col 1: Brand & Copyright */}
                    <div className="md:col-span-4 space-y-8">
                        <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
                            <Image
                                src="/images/cop17-logo-horizontal.png"
                                alt="COP17 Logo"
                                width={140}
                                height={44}
                                className="h-9 w-auto brightness-0 invert opacity-90"
                            />
                        </Link>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                            The official accommodation booking platform for the 17th Conference of the Parties (COP17). Ensuring premium, secure stays for global delegates in Ulaanbaatar.
                        </p>

                        <div className="flex items-center gap-3">
                            <SocialLink href="#" icon={<Facebook className="h-4 w-4" />} />
                            <SocialLink href="#" icon={<Twitter className="h-4 w-4" />} />
                            <SocialLink href="#" icon={<Instagram className="h-4 w-4" />} />
                        </div>
                    </div>

                    {/* Col 2: Quick Links */}
                    <div className="md:col-span-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-8">Navigation</h3>
                        <ul className="space-y-4 text-[13px] font-medium text-zinc-400">
                            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                            <li><Link href="/hotels" className="hover:text-white transition-colors">Find Stay</Link></li>
                            <li><Link href="https://unccdcop17.org" className="hover:text-white transition-colors">About COP17</Link></li>
                            <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                        </ul>
                    </div>

                    {/* Col 3: Support */}
                    <div className="md:col-span-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-8">Support</h3>
                        <ul className="space-y-4 text-[13px] font-medium text-zinc-400">
                            <li className="flex items-center gap-3 group px-0.5">
                                <Mail className="h-4 w-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                                <span className="group-hover:text-white transition-colors">info@ihotel.mn</span>
                            </li>
                            <li className="flex items-center gap-3 group px-0.5">
                                <Phone className="h-4 w-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                                <span className="group-hover:text-white transition-colors">+976 8857 9090</span>
                            </li>
                        </ul>
                    </div>

                    {/* Col 4: Technology Partner */}
                    <div className="md:col-span-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-8">Technology Partner</h3>
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 transition-all hover:bg-white/[0.07] hover:border-white/10 group">
                            <div className="flex items-center gap-3 mb-6">
                                <Monitor className="h-4 w-4 text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Powered By</span>
                            </div>
                            <a
                                href="https://ihotel.mn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className="mb-4 relative">
                                    <Image
                                        src="/images/ihotel-logo.webp"
                                        alt="iHotel Logo"
                                        width={160}
                                        height={48}
                                        className="h-10 w-auto object-contain opacity-90 group-hover:opacity-100 transition-all"
                                        priority
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 group-hover:text-zinc-400 leading-relaxed font-medium">
                                    Official Hotel Booking Engine <br />
                                    Security Verified & Certified
                                </p>
                            </a>
                        </div>
                    </div>

                </div>

                <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} COP17 Organizing Committee. All rights reserved.
                    </p>
                    <div className="flex gap-8 text-[11px] font-bold text-zinc-600 uppercase tracking-widest">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon }: { href: string, icon: React.ReactNode }) {
    return (
        <a
            href={href}
            className="h-10 w-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
        >
            {icon}
        </a>
    );
}
