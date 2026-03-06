import { Metadata } from "next";
import Link from "next/link";
import { Headphones, Mail, Phone, Clock, MessageCircle, Globe, MapPin, Shield, ArrowRight, HelpCircle, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Delegate Support | COP17 Mongolia",
    description: "24/7 support for COP17 delegates — booking assistance, travel help, and emergency services.",
};

const channels = [
    {
        icon: Phone,
        title: "24/7 Hotline",
        value: "+976 7000 1700",
        desc: "Immediate assistance in English, Mongolian, French, and Russian",
        color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
        action: "tel:+97670001700",
    },
    {
        icon: Mail,
        title: "Email Support",
        value: "support@cop17.ihotel.mn",
        desc: "Response within 2 hours during conference period",
        color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
        action: "mailto:support@cop17.ihotel.mn",
    },
    {
        icon: MessageCircle,
        title: "WhatsApp",
        value: "+976 9911 1700",
        desc: "Quick queries, shuttle updates, and real-time assistance",
        color: "bg-green-50 dark:bg-green-900/20 text-green-600",
        action: "https://wa.me/97699111700",
    },
];

const faqs = [
    {
        q: "How do I modify or cancel my booking?",
        a: "Log into your account and visit 'My Bookings' to manage your reservation. Cancellations made 7+ days before check-in receive a full refund. For same-day changes, contact our hotline directly.",
    },
    {
        q: "Is the shuttle service really free?",
        a: "Yes. All guests at official COP17 partner hotels enjoy complimentary shuttle service to and from the conference venue. Simply show your hotel key card or delegate badge when boarding.",
    },
    {
        q: "What documents do I need at check-in?",
        a: "Please present your passport (or national ID for Mongolian citizens), your COP17 delegate badge or registration confirmation, and your booking confirmation email.",
    },
    {
        q: "Can I book for my entire delegation?",
        a: "Absolutely. Use our Group Reservations page to submit a request for 5+ rooms. Our team will assign a dedicated coordinator to handle your delegation's needs.",
    },
    {
        q: "What if my flight is delayed?",
        a: "Contact our 24/7 hotline immediately. We coordinate with partner hotels to hold your room and can arrange late-night airport transfers if needed.",
    },
    {
        q: "Are the hotels near the COP17 venue?",
        a: "All partner hotels are within 15-25 minutes of the venue via our express shuttle service. Some centrally located properties are within walking distance.",
    },
];

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-zinc-950 to-blue-950 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-20 w-96 h-96 bg-violet-500 rounded-full blur-[128px]" />
                    <div className="absolute bottom-10 left-20 w-72 h-72 bg-blue-500 rounded-full blur-[128px]" />
                </div>
                <div className="container mx-auto px-4 py-24 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-violet-600/20 border border-violet-500/30 text-violet-400 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-8">
                            <Headphones className="h-3.5 w-3.5" />
                            Delegate Assistance
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                            We're Here <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">To Help</span>
                        </h1>
                        <p className="text-xl text-white/70 font-medium leading-relaxed max-w-2xl">
                            Round-the-clock support for all COP17 delegates. Available in 4 languages,
                            through phone, email, and messaging.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl -mt-12 relative z-20">
                {/* Contact Channels */}
                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    {channels.map((ch, i) => (
                        <a
                            key={i}
                            href={ch.action}
                            target={ch.action.startsWith("http") ? "_blank" : undefined}
                            rel={ch.action.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="group bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                        >
                            <div className={`h-14 w-14 rounded-2xl ${ch.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <ch.icon className="h-7 w-7" />
                            </div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">{ch.title}</p>
                            <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">{ch.value}</p>
                            <p className="text-sm text-zinc-500 font-medium">{ch.desc}</p>
                        </a>
                    ))}
                </div>

                {/* On-site Support Info */}
                <div className="grid md:grid-cols-2 gap-8 mb-20">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-amber-600" />
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">On-Site Help Desk</h3>
                        </div>
                        <p className="text-zinc-500 font-medium text-sm mb-6 leading-relaxed">
                            Visit our physical help desks located at the COP17 venue entrance and at all official partner hotel lobbies.
                            Our multilingual staff can assist with:
                        </p>
                        <ul className="space-y-3 text-sm">
                            {["Booking modifications & extensions", "Shuttle schedule inquiries", "Tour reservations", "Lost & found", "Medical referrals", "Visa extension guidance"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300 font-medium">
                                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Emergency Contacts</h3>
                        </div>
                        <div className="space-y-5">
                            {[
                                { label: "Police", number: "102", note: "Mongolian National Police" },
                                { label: "Ambulance", number: "103", note: "Emergency Medical Services" },
                                { label: "Fire Department", number: "101", note: "Fire & Rescue" },
                                { label: "COP17 Security", number: "+976 7000 1799", note: "Venue security team" },
                                { label: "Embassy Liaison", number: "+976 7000 1750", note: "Diplomatic assistance" },
                            ].map((e, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <div>
                                        <p className="text-sm font-black text-zinc-900 dark:text-white">{e.label}</p>
                                        <p className="text-xs text-zinc-500">{e.note}</p>
                                    </div>
                                    <a href={`tel:${e.number.replace(/\s/g, '')}`} className="text-sm font-black text-blue-600 hover:text-blue-500 transition-colors">
                                        {e.number}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mb-20">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                            <HelpCircle className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Frequently Asked</h2>
                            <p className="text-zinc-500 font-medium text-sm">Quick answers to common delegate questions.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow">
                                <h4 className="font-black text-zinc-900 dark:text-white text-sm mb-3">{faq.q}</h4>
                                <p className="text-sm text-zinc-500 font-medium leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center bg-gradient-to-r from-violet-600 to-blue-600 rounded-3xl p-12 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black tracking-tight mb-4">Need Group Booking Support?</h2>
                        <p className="text-white/80 font-medium mb-8 max-w-lg mx-auto">
                            Our dedicated delegation coordinator can handle bulk bookings,
                            special requirements, and VIP arrangements.
                        </p>
                        <Button asChild className="bg-white text-violet-700 hover:bg-zinc-100 rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                            <Link href="/group-reservations">
                                Group Reservations
                                <ArrowRight className="ml-3 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
