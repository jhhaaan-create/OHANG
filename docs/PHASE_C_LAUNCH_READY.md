# 🚀 PHASE C: LAUNCH READY — Product Shell & Deploy Readiness

> **Generated**: 2026-03-03
> **Target**: Claude Code Agent (automated execution)
> **Stack**: Next.js 14 App Router · Tailwind · shadcn/ui · Framer Motion
> **Prerequisite**: Phase A (Security/Payment) ✅ · Phase B (Feature UI) ✅

---

## MISSION 1: Landing Page (app/page.tsx)

**File**: `src/app/page.tsx`
**Action**: FULL REWRITE — replace the default Next.js placeholder with a high-converting dark-mode landing page.

### Architecture

Three sections, vertically stacked, mobile-first:
1. **Hero** — Hook phrase + single CTA + animated background
2. **Social Proof Ticker** — "518,400 unique destiny profiles" scrolling marquee
3. **Feature Teaser** — 3 glassmorphism cards (Chemistry, Couple Scan, Red Flag)

### Full Implementation

```tsx
// src/app/page.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Sparkles, Heart, Camera, AlertTriangle, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════
// OHANG Landing Page — "Your face. Your birth. Your truth."
// Goal: Single CTA → /analyze (NOT feature list)
// ═══════════════════════════════════════════════════════

const TOTAL_PROFILES = 518_400;

export default function LandingPage() {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
            {/* ═══ HERO SECTION ═══ */}
            <motion.section
                ref={heroRef}
                className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6"
                style={{ opacity: heroOpacity, scale: heroScale }}
            >
                {/* Ambient Background Glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/[0.04] blur-[120px]" />
                    <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
                    <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-fuchsia-500/[0.03] blur-[80px]" />
                </div>

                {/* Floating particles */}
                <FloatingParticles />

                {/* Content */}
                <div className="relative z-10 text-center max-w-2xl">
                    {/* Badge */}
                    <motion.div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400" />
                        </span>
                        <span className="text-xs text-white/50 tracking-wide">Powered by K-Saju + AI Vision</span>
                    </motion.div>

                    {/* Hook Phrase */}
                    <motion.h1
                        className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.7 }}
                    >
                        <span className="text-white/90">Your face.</span>
                        <br />
                        <span className="text-white/90">Your birth.</span>
                        <br />
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                            Your truth.
                        </span>
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p
                        className="text-base sm:text-lg text-white/40 max-w-md mx-auto mb-10 leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                    >
                        518,400 unique destiny profiles from ancient K-Saju wisdom, decoded by modern AI.
                    </motion.p>

                    {/* Single CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                    >
                        <Link href="/analyze">
                            <motion.button
                                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-base text-white overflow-hidden"
                                style={{
                                    background: "linear-gradient(135deg, #8b5cf6, #a855f7, #d946ef)",
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                animate={{
                                    boxShadow: [
                                        "0 4px 30px rgba(139,92,246,0.3)",
                                        "0 8px 50px rgba(168,85,247,0.5)",
                                        "0 4px 30px rgba(139,92,246,0.3)",
                                    ],
                                }}
                                transition={{
                                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                }}
                            >
                                {/* Shimmer */}
                                <motion.div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                                    }}
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                                />
                                <Sparkles size={18} className="relative z-10" />
                                <span className="relative z-10">Discover Your Archetype</span>
                                <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>

                {/* Scroll hint */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <ChevronDown size={20} className="text-white/20" />
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* ═══ SOCIAL PROOF TICKER ═══ */}
            <SocialProofTicker />

            {/* ═══ FEATURE TEASER ═══ */}
            <FeatureTeaser />

            {/* ═══ BOTTOM CTA ═══ */}
            <section className="py-20 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-md mx-auto"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white/90">
                        Ready to decode your destiny?
                    </h2>
                    <p className="text-sm text-white/35 mb-8">Free archetype analysis. No credit card required.</p>
                    <Link href="/analyze">
                        <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm bg-white/[0.06] text-white/80 border border-white/[0.08] hover:bg-white/[0.1] transition-all">
                            <Sparkles size={16} /> Start Free Analysis
                        </button>
                    </Link>
                </motion.div>
            </section>
        </div>
    );
}

// ── Social Proof Auto-Scrolling Ticker ──
function SocialProofTicker() {
    const items = [
        "518,400 unique destiny profiles",
        "73 celestial archetypes mapped",
        "Five Elements × 518,400 combinations",
        "K-Saju 사주 + AI Vision fusion",
        "518,400 unique destiny profiles",
        "73 celestial archetypes mapped",
        "Five Elements × 518,400 combinations",
        "K-Saju 사주 + AI Vision fusion",
    ];

    return (
        <div className="relative py-6 overflow-hidden border-y border-white/[0.04] bg-white/[0.01]">
            <motion.div
                className="flex gap-12 whitespace-nowrap"
                animate={{ x: [0, "-50%"] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
                {items.map((item, i) => (
                    <span key={i} className="flex items-center gap-3 text-sm text-white/25 font-medium tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400/40" />
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}

// ── Feature Teaser — Top 3 High-Converting Features ──
function FeatureTeaser() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    const features = [
        {
            icon: Heart,
            title: "Chemistry Analysis",
            desc: "Decode passion, stability & timing between any two souls. 55-pair element dynamics.",
            color: "#ec4899",
            href: "/analyze",
            badge: null,
        },
        {
            icon: Camera,
            title: "Couple Face Scan",
            desc: "Upload two photos. AI reads facial element energy and reveals visual chemistry.",
            color: "#f43f5e",
            href: "/features/couple-scan",
            badge: "HOT",
        },
        {
            icon: AlertTriangle,
            title: "Red Flag Radar",
            desc: "Detect hidden relationship patterns before they surface. Progressive flag reveal.",
            color: "#ef4444",
            href: "/features/red-flag",
            badge: "HOT",
        },
    ];

    return (
        <section ref={ref} className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                >
                    <h2 className="text-2xl sm:text-3xl font-bold text-white/90 mb-3">
                        Beyond horoscopes
                    </h2>
                    <p className="text-sm text-white/35 max-w-md mx-auto">
                        Ancient Korean Four Pillars wisdom, amplified by AI vision analysis.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {features.map((feature, i) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.15 * i }}
                            >
                                <Link href={feature.href}>
                                    <div
                                        className="group relative p-6 rounded-2xl border border-white/[0.06] overflow-hidden cursor-pointer transition-all hover:border-white/[0.12] h-full"
                                        style={{
                                            background: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                                            backdropFilter: "blur(20px)",
                                        }}
                                    >
                                        {/* Glow on hover */}
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                            style={{
                                                background: `radial-gradient(ellipse at center, ${feature.color}08, transparent 70%)`,
                                            }}
                                        />

                                        {/* Badge */}
                                        {feature.badge && (
                                            <motion.span
                                                className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                                                style={{
                                                    backgroundColor: `${feature.color}15`,
                                                    color: feature.color,
                                                    border: `1px solid ${feature.color}25`,
                                                }}
                                                animate={{
                                                    boxShadow: [
                                                        `0 0 0 ${feature.color}00`,
                                                        `0 0 12px ${feature.color}30`,
                                                        `0 0 0 ${feature.color}00`,
                                                    ],
                                                }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                {feature.badge}
                                            </motion.span>
                                        )}

                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                            style={{
                                                backgroundColor: `${feature.color}10`,
                                                border: `1px solid ${feature.color}15`,
                                            }}
                                        >
                                            <Icon size={18} style={{ color: feature.color }} />
                                        </div>

                                        <h3 className="text-base font-semibold text-white/80 mb-2 group-hover:text-white transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-white/35 leading-relaxed group-hover:text-white/45 transition-colors">
                                            {feature.desc}
                                        </p>

                                        <div className="mt-4 flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: `${feature.color}80` }}>
                                            <span>Explore</span>
                                            <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ── Floating Particles (ambient decoration) ──
function FloatingParticles() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => {
                const size = 2 + (i % 3);
                const left = ((i * 37 + 13) % 100);
                const top = ((i * 53 + 7) % 100);
                const duration = 15 + (i % 10) * 3;
                const delay = (i * 0.4) % 5;

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: size,
                            height: size,
                            left: `${left}%`,
                            top: `${top}%`,
                            backgroundColor: i % 3 === 0
                                ? "rgba(139,92,246,0.15)"
                                : i % 3 === 1
                                    ? "rgba(168,85,247,0.1)"
                                    : "rgba(236,72,153,0.08)",
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                            duration,
                            delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                );
            })}
        </div>
    );
}
```

### Key Design Decisions
- CTA routes to `/analyze` — the onboarding free-tier flow, NOT a features list
- No navigation bar on landing — clean single-page scroll
- Dark glassmorphism with violet/fuchsia gradient accents
- Social proof ticker uses CSS marquee via Framer Motion `animate={{ x }}`
- Only 3 features shown: Chemistry (free hook), Couple Scan ($2.99), Red Flag ($2.99)

---

## MISSION 2: Navigation & Feature Hub

### 2A. Mobile Bottom Nav

**File**: `src/components/layout/BottomNav.tsx`

```tsx
// src/components/layout/BottomNav.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Grid3X3, CreditCard, User } from "lucide-react";

const NAV_ITEMS = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/features", icon: Grid3X3, label: "Features" },
    { href: "/pricing", icon: CreditCard, label: "Pricing" },
    { href: "/profile", icon: User, label: "Profile" },
] as const;

export default function BottomNav() {
    const pathname = usePathname();

    // Hide on landing page for clean hero UX
    if (pathname === "/") return null;

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] safe-area-bottom"
            style={{
                background: "rgba(10,10,10,0.75)",
                backdropFilter: "blur(20px) saturate(1.5)",
                WebkitBackdropFilter: "blur(20px) saturate(1.5)",
            }}
        >
            <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center gap-1 py-1.5 px-3 min-w-[56px]"
                        >
                            <div className="relative">
                                <Icon
                                    size={20}
                                    className={`transition-colors ${
                                        isActive ? "text-violet-400" : "text-white/30"
                                    }`}
                                    strokeWidth={isActive ? 2.5 : 1.5}
                                />
                                {isActive && (
                                    <motion.div
                                        className="absolute -inset-2 rounded-full bg-violet-400/10"
                                        layoutId="nav-glow"
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    />
                                )}
                            </div>
                            <span
                                className={`text-[10px] font-medium tracking-wide transition-colors ${
                                    isActive ? "text-violet-400" : "text-white/25"
                                }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
```

### 2B. Layout Integration

**File**: `src/app/layout.tsx`
**Action**: PATCH — add BottomNav inside `<main>` wrapper, add bottom padding for nav clearance.

```tsx
// Add import at top of layout.tsx:
import BottomNav from "@/components/layout/BottomNav";

// Inside the layout, after {children} and before closing </main>:
// Replace:
//   <main className="relative z-10">
//     {children}
//   </main>
// With:
<main className="relative z-10 pb-20">
    {children}
    <BottomNav />
</main>
```

### 2C. Features Hub

**File**: `src/app/features/page.tsx`

```tsx
// src/app/features/page.tsx
"use client";

import { motion } from "framer-motion";
import {
    Star, AlertTriangle, Heart, Camera, Rewind,
    Sparkles, Zap, Sun, ArrowRight,
} from "lucide-react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════
// OHANG Features Hub — Viral hooks at top, paid IAPs below
// ═══════════════════════════════════════════════════════

interface FeatureCard {
    href: string;
    icon: typeof Star;
    title: string;
    desc: string;
    color: string;
    badge?: string;
    badgeColor?: string;
    price?: string;
}

const FREE_FEATURES: FeatureCard[] = [
    {
        href: "/analyze",
        icon: Sparkles,
        title: "Soul Blueprint",
        desc: "Your core archetype decoded from birth data + face vision",
        color: "#a78bfa",
        badge: "FREE",
        badgeColor: "#22c55e",
    },
    {
        href: "/features/celeb-match",
        icon: Star,
        title: "Celebrity Match",
        desc: "Find your celebrity energy twin with a selfie",
        color: "#fbbf24",
        badge: "FREE",
        badgeColor: "#22c55e",
    },
];

const PAID_FEATURES: FeatureCard[] = [
    {
        href: "/features/red-flag",
        icon: AlertTriangle,
        title: "Red Flag Radar",
        desc: "Detect hidden relationship patterns before they surface",
        color: "#ef4444",
        badge: "HOT",
        badgeColor: "#ef4444",
        price: "$2.99",
    },
    {
        href: "/features/couple-scan",
        icon: Camera,
        title: "Couple Face Scan",
        desc: "Upload two photos to reveal visual chemistry scores",
        color: "#ec4899",
        badge: "HOT",
        badgeColor: "#ec4899",
        price: "$2.99",
    },
    {
        href: "/features/retro-mode",
        icon: Rewind,
        title: "Retro Mode",
        desc: "Understand why it ended and what your ex activated in you",
        color: "#3b82f6",
        price: "$1.99",
    },
];

const SUBSCRIPTION_FEATURES: FeatureCard[] = [
    {
        href: "/analyze",
        icon: Zap,
        title: "Chemistry Analysis",
        desc: "Full 55-pair relationship chemistry with 5 dimension scores",
        color: "#f97316",
        price: "OHANG+",
    },
    {
        href: "/analyze",
        icon: Sun,
        title: "Daily Vibe",
        desc: "Personalized daily fortune with peak/avoid windows and lucky color",
        color: "#a78bfa",
        price: "OHANG Pro",
    },
];

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="container mx-auto px-4 py-10 max-w-2xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white/90 mb-2">Features</h1>
                    <p className="text-sm text-white/35">Ancient K-Saju wisdom meets AI vision analysis</p>
                </header>

                {/* ── Free Viral Hooks (Top) ── */}
                <section className="mb-8">
                    <h2 className="text-xs font-semibold text-white/25 uppercase tracking-wider mb-4">Free Features</h2>
                    <div className="grid gap-3">
                        {FREE_FEATURES.map((f, i) => (
                            <FeatureRow key={f.title} feature={f} index={i} />
                        ))}
                    </div>
                </section>

                {/* ── High-Revenue IAP Features (Middle) ── */}
                <section className="mb-8">
                    <h2 className="text-xs font-semibold text-white/25 uppercase tracking-wider mb-4">Premium Features</h2>
                    <div className="grid gap-3">
                        {PAID_FEATURES.map((f, i) => (
                            <FeatureRow key={f.title} feature={f} index={i} />
                        ))}
                    </div>
                </section>

                {/* ── Subscription Features ── */}
                <section className="mb-8">
                    <h2 className="text-xs font-semibold text-white/25 uppercase tracking-wider mb-4">Subscription</h2>
                    <div className="grid gap-3">
                        {SUBSCRIPTION_FEATURES.map((f, i) => (
                            <FeatureRow key={f.title} feature={f} index={i} />
                        ))}
                    </div>
                    <Link href="/pricing" className="mt-4 inline-flex items-center gap-2 text-xs text-violet-400/70 hover:text-violet-400 transition-colors">
                        View pricing plans <ArrowRight size={12} />
                    </Link>
                </section>
            </div>
        </div>
    );
}

// ── Feature Row Card ──
function FeatureRow({ feature, index }: { feature: FeatureCard; index: number }) {
    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
        >
            <Link href={feature.href}>
                <div
                    className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.015)" }}
                >
                    {/* Icon */}
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                            backgroundColor: `${feature.color}10`,
                            border: `1px solid ${feature.color}15`,
                        }}
                    >
                        <Icon size={18} style={{ color: feature.color }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{feature.title}</h3>
                            {feature.badge && (
                                <span
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
                                    style={{
                                        backgroundColor: `${feature.badgeColor ?? feature.color}15`,
                                        color: feature.badgeColor ?? feature.color,
                                        border: `1px solid ${feature.badgeColor ?? feature.color}20`,
                                    }}
                                >
                                    {feature.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{feature.desc}</p>
                    </div>

                    {/* Price / Arrow */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        {feature.price && (
                            <span className="text-xs font-medium text-white/30">{feature.price}</span>
                        )}
                        <ArrowRight size={14} className="text-white/15 group-hover:text-white/40 transition-colors group-hover:translate-x-0.5 transform" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
```

---

## MISSION 3: High-Converting Pricing Page

**File**: `src/app/pricing/page.tsx`

### Architecture
- 3-tier pricing table using OHANG's dark glassmorphism
- Each CTA calls `/api/checkout/stripe` with the correct plan ID
- Free tier links to `/analyze`
- Pro tier gets "Most Popular" highlight ribbon
- Checkout plans map: `basic` → existing basic, `pro` → pro, `destiny` → destiny

### Note on Plan Mapping

The existing checkout API at `/api/checkout/stripe` accepts plans: `basic`, `pro`, `destiny`. However, the pricing page describes tiers differently from what Phase B specified. The existing checkout API plan enum is: `"basic" | "pro" | "destiny" | "red_flag" | "couple_scan" | "retro_mode"`.

For the pricing page:
- **Free** → No checkout, link to `/analyze`
- **OHANG+ ($7.99/mo)** → plan: `"pro"` (maps to `pro_monthly` subscription)
- **OHANG Pro ($19.99/mo)** → We need a new plan tier

**REQUIRED**: Add a new tier to the checkout system.

#### 3A. Patch Checkout Route

**File**: `src/app/api/checkout/stripe/route.ts`
**Action**: Add `"ohang_pro"` to the schema and PLAN_CONFIG.

```ts
// Update CheckoutSchema to add ohang_pro:
const CheckoutSchema = z.object({
    plan: z.enum(["basic", "pro", "destiny", "red_flag", "couple_scan", "retro_mode", "ohang_pro"]),
});

// Add to PLAN_CONFIG:
//   ohang_pro: { priceKey: "ohang_pro_monthly", mode: "subscription", tier: "pro" },
```

#### 3B. Patch Stripe Module

**File**: `src/lib/stripe/index.ts`
**Action**: Add price ID env var for OHANG Pro.

```ts
// Add to PRICE_IDS:
ohang_pro_monthly: process.env.STRIPE_PRICE_OHANG_PRO_MONTHLY || '',
```

#### 3C. Pricing Page

**File**: `src/app/pricing/page.tsx`

```tsx
// src/app/pricing/page.tsx
"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, Crown, Shield, Sparkles, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════
// OHANG Pricing — 3-Tier High-Converting Pricing Page
// Free → OHANG+ → OHANG Pro (Most Popular)
// ═══════════════════════════════════════════════════════

interface PricingTier {
    id: string;
    name: string;
    price: string;
    period: string;
    icon: typeof Star;
    popular: boolean;
    description: string;
    features: string[];
    ctaLabel: string;
    ctaPlan: string | null; // null = free tier (link to /analyze)
    color: string;
}

const TIERS: PricingTier[] = [
    {
        id: "free",
        name: "Free",
        price: "$0",
        period: "forever",
        icon: Star,
        popular: false,
        description: "Start your journey",
        features: [
            "Basic Archetype Analysis",
            "Celebrity Match (unlimited)",
            "Core energy + void element",
            "Share results on social",
        ],
        ctaLabel: "Get Started Free",
        ctaPlan: null,
        color: "#a1a1aa",
    },
    {
        id: "ohang_plus",
        name: "OHANG+",
        price: "$7.99",
        period: "/mo",
        icon: Crown,
        popular: false,
        description: "Go deeper",
        features: [
            "Everything in Free",
            "Full personality analysis",
            "3 tone modes: Savage · Balanced · Gentle",
            "Unlimited compatibility readings",
            "Face + Saju dual analysis",
            "Red Flag Radar included",
        ],
        ctaLabel: "Start OHANG+",
        ctaPlan: "pro", // Maps to existing pro_monthly in Stripe
        color: "#a78bfa",
    },
    {
        id: "ohang_pro",
        name: "OHANG Pro",
        price: "$19.99",
        period: "/mo",
        icon: Shield,
        popular: true,
        description: "The complete experience",
        features: [
            "Everything in OHANG+",
            "Daily Vibe fortune push",
            "Couple Face Scan unlimited",
            "Retro Mode unlimited",
            "Priority AI processing",
            "All future features included",
        ],
        ctaLabel: "Start OHANG Pro",
        ctaPlan: "ohang_pro",
        color: "#d946ef",
    },
];

export default function PricingPage() {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleCheckout = useCallback(async (plan: string) => {
        setLoadingPlan(plan);
        try {
            const res = await fetch("/api/checkout/stripe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error("Checkout error:", err);
        } finally {
            setLoadingPlan(null);
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                        Choose your <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">destiny</span>
                    </h1>
                    <p className="text-sm text-white/35 max-w-md mx-auto">
                        Start free. Upgrade when you're ready to unlock your full potential.
                    </p>
                </motion.div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                    {TIERS.map((tier, i) => {
                        const Icon = tier.icon;
                        return (
                            <motion.div
                                key={tier.id}
                                className="relative"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                            >
                                {/* Most Popular Ribbon */}
                                {tier.popular && (
                                    <div
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
                                        style={{
                                            background: `linear-gradient(135deg, ${tier.color}, ${tier.color}bb)`,
                                            color: "#fff",
                                            boxShadow: `0 4px 20px ${tier.color}40`,
                                        }}
                                    >
                                        Most Popular
                                    </div>
                                )}

                                <div
                                    className="h-full flex flex-col rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
                                    style={{
                                        background: tier.popular
                                            ? `linear-gradient(135deg, ${tier.color}08, rgba(255,255,255,0.02))`
                                            : "rgba(255,255,255,0.015)",
                                        border: tier.popular
                                            ? `2px solid ${tier.color}35`
                                            : "1px solid rgba(255,255,255,0.06)",
                                        boxShadow: tier.popular
                                            ? `0 0 40px ${tier.color}10`
                                            : "none",
                                    }}
                                >
                                    <div className="p-6 flex flex-col flex-1">
                                        {/* Icon + Name */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{
                                                    backgroundColor: `${tier.color}12`,
                                                    border: `1px solid ${tier.color}20`,
                                                }}
                                            >
                                                <Icon size={18} style={{ color: tier.color }} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white/90">{tier.name}</h3>
                                                <p className="text-[11px] text-white/30">{tier.description}</p>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="mb-6">
                                            <span className="text-3xl font-bold text-white">{tier.price}</span>
                                            <span className="text-sm text-white/30 ml-1">{tier.period}</span>
                                        </div>

                                        {/* Features */}
                                        <div className="space-y-2.5 mb-8 flex-1">
                                            {tier.features.map((f, fi) => (
                                                <div key={fi} className="flex items-start gap-2.5">
                                                    <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                                                    <span className="text-sm text-white/50">{f}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CTA */}
                                        {tier.ctaPlan ? (
                                            <motion.button
                                                onClick={() => handleCheckout(tier.ctaPlan!)}
                                                disabled={loadingPlan === tier.ctaPlan}
                                                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                                                style={{
                                                    background: tier.popular
                                                        ? `linear-gradient(135deg, ${tier.color}, ${tier.color}bb)`
                                                        : `${tier.color}15`,
                                                    color: tier.popular ? "#fff" : tier.color,
                                                    border: tier.popular ? "none" : `1px solid ${tier.color}20`,
                                                    boxShadow: tier.popular ? `0 4px 20px ${tier.color}30` : "none",
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {loadingPlan === tier.ctaPlan ? (
                                                    <motion.div
                                                        className="w-4 h-4 border-2 rounded-full"
                                                        style={{ borderColor: `${tier.popular ? "#fff" : tier.color}40`, borderTopColor: tier.popular ? "#fff" : tier.color }}
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                                    />
                                                ) : (
                                                    <>
                                                        <Sparkles size={14} />
                                                        {tier.ctaLabel}
                                                    </>
                                                )}
                                            </motion.button>
                                        ) : (
                                            <Link href="/analyze" className="w-full">
                                                <button className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08] transition-all">
                                                    {tier.ctaLabel}
                                                    <ArrowRight size={14} />
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer note */}
                <motion.p
                    className="text-center text-[11px] text-white/20 mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Cancel anytime · Secure payments via Stripe · All prices in USD
                </motion.p>
            </div>
        </div>
    );
}
```

---

## MISSION 4: Vercel Production Deploy Checklist

This mission generates a separate file: `docs/DEPLOY_CHECKLIST.md`.

**File**: `docs/DEPLOY_CHECKLIST.md`

```markdown
# OHANG — Vercel Production Deploy Checklist

## 1. Mandatory Environment Variables

ALL of these must be set in Vercel → Project Settings → Environment Variables.
Missing ANY one will cause runtime failures.

| Variable | Source | Description |
|----------|--------|-------------|
| `OPENAI_API_KEY` | OpenAI Dashboard | API key for GPT-4o / GPT-4o-mini |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys | Server-side Stripe key (sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | Webhook signing secret (whsec_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys | Client-side Stripe key (pk_live_...) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Service role key (server only) |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob | Token for image uploads |

### Stripe Price IDs (one per product)

| Variable | Stripe Product |
|----------|---------------|
| `STRIPE_PRICE_BASIC_ONETIME` | Basic one-time reading ($2.99) |
| `STRIPE_PRICE_PRO_MONTHLY` | OHANG+ monthly subscription ($7.99) |
| `STRIPE_PRICE_OHANG_PRO_MONTHLY` | OHANG Pro monthly subscription ($19.99) |
| `STRIPE_PRICE_DESTINY_LIFETIME` | Destiny lifetime ($39.99) |
| `STRIPE_PRICE_RED_FLAG` | Red Flag Radar IAP ($2.99) |
| `STRIPE_PRICE_COUPLE_SCAN` | Couple Face Scan IAP ($2.99) |
| `STRIPE_PRICE_RETRO_MODE` | Retro Mode IAP ($1.99) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | Auto-detected | Production URL (https://ohang.app) |
| `NODE_ENV` | `production` | Set automatically by Vercel |

## 2. Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://ohang.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`

## 3. Supabase Migrations

Run all migrations in order before deploy:

```sql
-- 1. Core tables (already applied)
-- 2. Stripe subscriptions
supabase/migrations/20260223_stripe_subscriptions.sql
-- 3. Stripe idempotency
supabase/migrations/20260226_stripe_idempotency.sql
```

Verify tables exist:
- `user_subscriptions`
- `user_iap_purchases`
- `stripe_events`

## 4. Vercel Project Settings

- **Framework**: Next.js (auto-detected)
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)
- **Node.js Version**: 18.x or 20.x
- **Root Directory**: `/` (if monorepo, adjust)
- **Install Command**: `npm install` or `pnpm install`

### Function Configuration

Verify `vercel.json` or route-level config:
- `/api/analyze/*` routes: `maxDuration: 60`
- `/api/stripe/webhook`: `maxDuration: 30`
- `/api/og/*`: `maxDuration: 10`

## 5. Domain & DNS

1. Add custom domain in Vercel: `ohang.app`
2. Configure DNS:
   - `A` record → `76.76.21.21`
   - `CNAME` www → `cname.vercel-dns.com`
3. Enable automatic HTTPS (default)

## 6. Pre-Deploy Verification

- [ ] All env vars set in Vercel dashboard
- [ ] Stripe products created with correct Price IDs
- [ ] Stripe webhook endpoint registered
- [ ] Supabase migrations applied
- [ ] `npm run build` passes locally with zero errors
- [ ] All TypeScript strict checks pass
- [ ] Test Stripe checkout flow in test mode
- [ ] Verify webhook receives events (Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- [ ] OG image generation works (`/api/og?archetype=test&element=Fire`)
- [ ] Face upload to Vercel Blob works

## 7. Post-Deploy Verification

- [ ] Landing page loads at production URL
- [ ] `/analyze` page functional
- [ ] Stripe checkout redirects correctly
- [ ] Webhook processes events (check Stripe dashboard → webhook logs)
- [ ] All feature pages accessible (`/features/red-flag`, `/features/couple-scan`, etc.)
- [ ] OG images render on social share
- [ ] Mobile bottom nav appears on all pages except landing
- [ ] Pricing page CTAs trigger checkout

## 8. Monitoring

- **Vercel Analytics**: Already integrated (`@vercel/analytics/react`)
- **Stripe Webhook Dashboard**: Monitor failed events
- **Supabase Dashboard**: Watch for RLS policy failures
- **Error tracking**: Consider adding Sentry for production error monitoring
```

---

## FILE MANIFEST

| # | Action | File Path |
|---|--------|-----------|
| 1 | REWRITE | `src/app/page.tsx` — Landing page with hero, ticker, feature cards |
| 2 | CREATE  | `src/components/layout/BottomNav.tsx` — Mobile bottom navigation |
| 3 | PATCH   | `src/app/layout.tsx` — Import BottomNav, add `pb-20` |
| 4 | CREATE  | `src/app/features/page.tsx` — Features hub grid |
| 5 | CREATE  | `src/app/pricing/page.tsx` — 3-tier pricing with Stripe checkout |
| 6 | PATCH   | `src/app/api/checkout/stripe/route.ts` — Add `ohang_pro` plan |
| 7 | PATCH   | `src/lib/stripe/index.ts` — Add `ohang_pro_monthly` price ID |
| 8 | PATCH   | `src/middleware.ts` — Add `/pricing`, `/features`, `/profile` to unguarded |
| 9 | CREATE  | `docs/DEPLOY_CHECKLIST.md` — Full Vercel deploy requirements |

## MIDDLEWARE PATCH

**File**: `src/middleware.ts`
**Action**: The current middleware only matches `/api/:path*`. Feature pages `/features`, `/pricing`, `/profile` are NOT API routes so they pass through automatically. No middleware change needed for page routes.

However, ensure `/api/checkout/stripe` is NOT in UNGUARDED_PATHS (it requires origin validation for security).

## DEPENDENCY CHECK

All dependencies already installed — no `npm install` required.

---

## EXECUTION COMMAND

```bash
mkdir -p src/components/layout src/app/pricing src/app/features
```

Then apply each file from code blocks above in manifest order (1→9).
