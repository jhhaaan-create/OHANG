/**
 * ROOT LAYOUT — OHANG
 *
 * Integration points:
 * 1. MoodThemeProvider wraps the entire app → CSS variables available everywhere
 * 2. ThemeProvider (legacy) delegates to MoodThemeProvider for backward compat
 * 3. defaultMetadata + JSON-LD → SEO baseline
 * 4. Font loading → Distinctive typography (Outfit + Crimson Pro + legacy Cinzel)
 */
import type { Metadata, Viewport } from "next";
import { Outfit, Crimson_Pro, Inter, Cinzel } from "next/font/google";
import { Toaster } from "sonner";
import { MoodThemeProvider } from "@/providers/MoodThemeProvider";
import { ToneProvider } from "@/lib/tone/ToneProvider";
import { defaultMetadata, appJsonLd } from "@/lib/metadata";
import { MoodBackground } from "@/components/ui/MoodBackground";
import { StarError } from "@/components/ui/StarError";
import { Analytics } from "@vercel/analytics/react";
import BottomNav from "@/components/layout/BottomNav";
import "./globals.css";

// ── Typography ───────────────────────────────────────────
// Outfit: Clean geometric sans for UI — distinctive but readable
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

// Crimson Pro: Elegant serif for headings — adds gravitas
const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson-pro",
  display: "swap",
});

// Legacy fonts — display:swap prevents FOIT (Flash of Invisible Text)
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });

// ── Metadata ─────────────────────────────────────────────
export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// ── Layout ───────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${crimsonPro.variable} ${inter.variable} ${cinzel.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        {/* DNS Prefetch & Preconnect for critical third-party origins */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(appJsonLd()),
          }}
        />
      </head>
      <body className="font-sans bg-[#0a0a0a] text-white antialiased min-h-screen">
        {/* 0. Global Error Boundary (The Fail-Safe) */}
        <StarError>
          <MoodThemeProvider>
            <ToneProvider>
            {/* 1. Dynamic Background Layer */}
            <MoodBackground />

            {/* 2. Main Content Layer */}
            <main className="relative z-10 pb-20">
              {children}
              <BottomNav />
            </main>

            {/* 3. Toast Notifications (sonner) */}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "rgba(23, 23, 23, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  color: "#e4e4e7",
                  backdropFilter: "blur(12px)",
                },
              }}
            />
            </ToneProvider>
          </MoodThemeProvider>
        </StarError>

        {/* 4. Vercel Web Analytics (Zero-Cost Performance Monitoring) */}
        <Analytics />
      </body>
    </html>
  );
}
