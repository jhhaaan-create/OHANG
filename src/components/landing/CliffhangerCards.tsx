// src/components/landing/CliffhangerCards.tsx
"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { AlertTriangle, Heart, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import haptic from "@/lib/haptics";
import ShareViralButton from "@/components/ui/ShareViralButton";

// ═══════════════════════════════════════════════════════
// Cliffhanger Cards — CRO #5
// Fake result previews with blurred reveals to drive
// curiosity-gap conversions. "The Reveal" pattern.
// ═══════════════════════════════════════════════════════

interface CliffhangerCard {
    icon: typeof AlertTriangle;
    title: string;
    subtitle: string;
    color: string;
    href: string;
    fakeScore: number;
    fakeLabel: string;
    blurredText: string;
    ctaLabel: string;
    unlockFeature: "red_flag" | "couple_scan" | "retro_mode" | "celeb_match";
}

const CARDS: CliffhangerCard[] = [
    {
        icon: AlertTriangle,
        title: "Red Flag Radar",
        subtitle: "Relationship Pattern Detection",
        color: "#ef4444",
        href: "/features/red-flag",
        fakeScore: 73,
        fakeLabel: "RED",
        blurredText: "Your partner's Metal clashes with your Fire. The 3rd flag reveals a recurring abandonment pattern that...",
        ctaLabel: "Scan Your Relationship",
        unlockFeature: "red_flag",
    },
    {
        icon: Heart,
        title: "Couple Face Scan",
        subtitle: "Visual Chemistry Analysis",
        color: "#ec4899",
        href: "/features/couple-scan",
        fakeScore: 84,
        fakeLabel: "HIGH CHEMISTRY",
        blurredText: "Your spouse palaces show rare Mirror alignment. The facial element dynamic suggests deep karmic...",
        ctaLabel: "Upload Two Photos",
        unlockFeature: "couple_scan",
    },
];

export default function CliffhangerCards() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.15 });

    return (
        <section ref={ref} className="py-16 px-5">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                >
                    <h2 className="text-xl sm:text-2xl font-bold text-white/85 mb-2">
                        See what others are discovering
                    </h2>
                    <p className="text-xs text-white/30">
                        Real analysis previews — your results are waiting
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {CARDS.map((card, i) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.15 * i }}
                        >
                            <CliffCard card={card} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CliffCard({ card }: { card: CliffhangerCard }) {
    const Icon = card.icon;
    const [isUnlocked, setIsUnlocked] = useState(false);

    return (
        <div
            className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
            style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))",
                backdropFilter: "blur(16px)",
            }}
        >
            {/* Header */}
            <div className="p-5 pb-3">
                <div className="flex items-center gap-2.5 mb-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${card.color}12`, border: `1px solid ${card.color}18` }}
                    >
                        <Icon size={14} style={{ color: card.color }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white/75">{card.title}</h3>
                        <p className="text-[10px] text-white/25">{card.subtitle}</p>
                    </div>
                </div>

                {/* Fake Score Ring (mini) */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-12 h-12">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                            <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke={card.color}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - card.fakeScore / 100)}`}
                                style={{ filter: `drop-shadow(0 0 4px ${card.color}40)` }}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: card.color }}>
                            {card.fakeScore}
                        </span>
                    </div>
                    <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide"
                        style={{ backgroundColor: `${card.color}10`, color: card.color, border: `1px solid ${card.color}20` }}
                    >
                        {card.fakeLabel}
                    </span>
                </div>
            </div>

            {/* Blurred Insight — THE CLIFFHANGER */}
            <div className="px-5 pb-3">
                <p
                    className="text-sm text-white/50 leading-relaxed"
                    style={{
                        filter: "blur(5px)",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                    }}
                >
                    {card.blurredText}
                </p>
            </div>

            {/* Lock Overlay + CTA */}
            <div className="px-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                    <Lock size={12} className={isUnlocked ? "text-emerald-400/40" : "text-white/20"} />
                    <span className={`text-[10px] ${isUnlocked ? "text-emerald-400/40" : "text-white/20"}`}>
                        {isUnlocked ? "Unlocked for 24h" : "Full analysis locked"}
                    </span>
                </div>

                {/* Share-to-Unlock button */}
                <div className="mb-2">
                    <ShareViralButton
                        payload={{ title: card.title, text: `Check out my ${card.title} score!`, url: "https://ohang.app" }}
                        variant="cta"
                        locale="en"
                        unlockFeature={card.unlockFeature}
                        onShareSuccess={() => setIsUnlocked(true)}
                    />
                </div>

                <Link href={card.href}>
                    <motion.button
                        onClick={() => haptic.press()}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                        style={{
                            backgroundColor: `${card.color}12`,
                            color: card.color,
                            border: `1px solid ${card.color}18`,
                        }}
                        whileHover={{
                            backgroundColor: `${card.color}20`,
                            boxShadow: `0 0 20px ${card.color}15`,
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {card.ctaLabel}
                        <ArrowRight size={12} />
                    </motion.button>
                </Link>
            </div>
        </div>
    );
}
