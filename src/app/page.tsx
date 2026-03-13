// src/app/page.tsx
import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import LoreSection from "@/components/landing/LoreSection";
import LiveSocialTicker from "@/components/landing/LiveSocialTicker";
import CliffhangerCards from "@/components/landing/CliffhangerCards";
import BottomCTA from "@/components/landing/BottomCTA";
import FloatingParticles from "@/components/landing/FloatingParticles";
import ParallaxElements from "@/components/landing/ParallaxElements";

// ═══════════════════════════════════════════════════════
// OHANG Landing Page — CVR-Maximized Assembler
//
// Architecture: SSR metadata shell + client components
// CRO #8: High-conversion OG metadata
// CRO #9: LCP via "use client" boundary code-splitting
// ═══════════════════════════════════════════════════════

// ── OG Metadata — CRO #8 ──
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ohang.app";

export const metadata: Metadata = {
    title: "OHANG — Your Face. Your Birth. Your Truth.",
    description:
        "AI decodes your soul blueprint from birth data + face scan. 518,400 unique destiny profiles. Free instant analysis.",
    openGraph: {
        title: "Your Face. Your Birth. Your Truth. | OHANG",
        description:
            "518,400 unique destiny profiles. AI-powered Cosmic Blueprint analysis + Face Frequency Scan. Discover your archetype in 30 seconds.",
        url: BASE_URL,
        siteName: "OHANG",
        images: [
            {
                url: `${BASE_URL}/api/og?mode=landing`,
                width: 1200,
                height: 630,
                alt: "OHANG — Five Element Intelligence",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Your Face. Your Birth. Your Truth. | OHANG",
        description:
            "518,400 unique profiles. AI decodes your soul blueprint. Free.",
        images: [`${BASE_URL}/api/og?mode=landing`],
    },
};

// ── Page Assembly ──
export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
            {/* Fixed background layers */}
            <FloatingParticles />
            <ParallaxElements />

            {/* Content stack */}
            <div className="relative z-10">
                <HeroSection />
                <LoreSection />
                <LiveSocialTicker />
                <CliffhangerCards />
                <BottomCTA />
            </div>
        </div>
    );
}
