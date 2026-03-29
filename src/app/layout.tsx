import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { getCanonicalUrl } from "@/lib/site-config";

const canonicalUrl = getCanonicalUrl();

export const metadata: Metadata = {
  title: "COP17 Mongolia | Official Hotel Booking",
  description: "Exclusive hotel booking platform for COP17 delegates in Mongolia.",
  metadataBase: canonicalUrl,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "COP17 Mongolia | Official Hotel Booking",
    description: "Exclusive hotel booking platform for COP17 delegates in Mongolia.",
    url: canonicalUrl.toString(),
    siteName: "COP17 Mongolia",
  },
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
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import PageTransition from "@/components/page-transition";
import { Analytics } from "@vercel/analytics/react";


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;

  try {
    const supabase = await createClient();
    const authResult = await supabase.auth.getUser();
    user = authResult.data.user;
  } catch (error) {
    if (!(error instanceof Error && "digest" in error && error.digest === "DYNAMIC_SERVER_USAGE")) {
      console.error("Root layout auth bootstrap failed:", error);
    }
  }

  return (
    <html lang="en">
      <body
        className="antialiased min-h-screen bg-background text-foreground"
      >
        <AuthProvider initialUser={user}>
          <Suspense fallback={<div className="h-16 bg-zinc-950/90 border-b border-white/10" />}>
            <SiteHeader />
          </Suspense>
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
