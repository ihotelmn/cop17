"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Monitor } from "lucide-react";

export function SiteFooter() {
    return (
        <footer className="bg-zinc-950 border-t border-white/10 pt-16 pb-16">
            <div className="container mx-auto px-4">



                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* Col 1: Brand & Copyright */}
                    <div className="md:col-span-1 space-y-6">
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/images/cop17-logo-horizontal.png"
                                alt="COP17 Logo"
                                width={120}
                                height={40}
                                className="h-8 w-auto brightness-0 invert"
                            />
                        </Link>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Official Accommodation Booking Platform for the 17th Conference of the Parties (COP17) in Ulaanbaatar, Mongolia.
                        </p>

                        <div className="flex items-center gap-4">
                            <SocialLink href="#" icon={<Facebook className="h-4 w-4" />} />
                            <SocialLink href="#" icon={<Twitter className="h-4 w-4" />} />
                            <SocialLink href="#" icon={<Instagram className="h-4 w-4" />} />
                        </div>

                        <div className="pt-4 space-y-2">
                            <p className="text-zinc-500 text-xs">
                                &copy; {new Date().getFullYear()} COP17 Mongolia. All rights reserved.
                            </p>
                        </div>
                    </div>

                    {/* Col 2: Quick Links */}
                    <div>
                        <h3 className="text-white font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                            <li><Link href="/hotels" className="hover:text-white transition-colors">Find Accommodation</Link></li>
                            <li><Link href="https://unccdcop17.org" className="hover:text-white transition-colors">About COP17</Link></li>
                            <li><Link href="/login" className="hover:text-white transition-colors">Delegate Login</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Col 3: Contact */}
                    <div>
                        <h3 className="text-white font-bold mb-4">Contact Support</h3>
                        <ul className="space-y-4 text-sm text-zinc-400">
                            <li className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-zinc-500 shrink-0" />
                                <span>support@cop17.mn</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-zinc-500 shrink-0" />
                                <span>+976 7700 0000</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-zinc-500 shrink-0" />
                                <span>Ulaanbaatar, Mongolia</span>
                            </li>
                        </ul>
                    </div>

                    {/* Col 4: Technology Partner (Powered By) */}
                    <div>
                        <h3 className="text-white font-bold mb-4">Technology Partner</h3>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:bg-zinc-900 transition-colors group">
                            <div className="flex items-center gap-3 mb-3">
                                <Monitor className="h-5 w-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Powered By</span>
                            </div>
                            <a
                                href="https://ihotel.mn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <span className="text-2xl font-extrabold text-white group-hover:text-blue-400 transition-colors block mb-1">iHotel.mn</span>
                                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">Official Hotel Booking Engine</span>
                            </a>
                        </div>
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
            className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
            {icon}
        </a>
    );
}
