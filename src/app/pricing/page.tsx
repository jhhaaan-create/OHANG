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
            "3 tone modes: Savage \u00b7 Balanced \u00b7 Gentle",
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
