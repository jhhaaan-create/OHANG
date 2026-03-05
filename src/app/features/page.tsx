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
