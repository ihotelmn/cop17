import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "COP17 Mongolia | Official Hotel Booking",
  description: "Exclusive hotel booking platform for COP17 delegates in Mongolia.",
  icons: {
    icon: [
      { url: "/favicon.webp", type: "image/webp" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/favicon.webp",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
};

import { AuthProvider } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OrganizersSection } from "@/components/organizers-section";
import { Toaster } from "sonner";

import { createClient } from "@/lib/supabase/server";
import PageTransition from "@/components/page-transition";
import { Analytics } from "@vercel/analytics/react";


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <AuthProvider initialUser={user}>
          <SiteHeader />
          <main className="min-h-screen pt-16">

            <PageTransition>{children}</PageTransition>
          </main>
          <OrganizersSection />

          <SiteFooter />
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
