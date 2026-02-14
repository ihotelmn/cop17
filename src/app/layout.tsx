import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
};

import { AuthProvider } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "sonner";

import { createClient } from "@/lib/supabase/server";
import PageTransition from "@/components/page-transition";

export const dynamic = "force-dynamic";

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

          <PageTransition>{children}</PageTransition>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
