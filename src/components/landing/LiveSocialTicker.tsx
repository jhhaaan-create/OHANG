// src/components/landing/LiveSocialTicker.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════
// Live Social Proof Ticker — CRO #3
// Simulates real-time user activity for social validation
// ═══════════════════════════════════════════════════════

const ELEMENTS = ["Fire", "Water", "Wood", "Metal", "Earth"] as const;
const ARCHETYPES = [
    "The Maverick", "The Oracle", "The Sentinel", "The Alchemist",
    "The Phoenix", "The Wanderer", "The Mirror", "The Catalyst",
    "The Sovereign", "The Mystic", "The Ironclad", "The Tidecaller",
] as const;

const TEMPLATES = [
    (n: number, a: string, e: string) => `User ${n} just matched with ${a} \u00b7 ${e} Element`,
    (n: number, a: string, e: string) => `${a} discovered in Seoul \u00b7 ${e} energy detected`,
    (n: number, _: string, e: string) => `User ${n} unlocked their Soul Blueprint \u00b7 ${e}`,
    (n: number, a: string, _: string) => `New ${a} revealed \u00b7 "This is scary accurate"`,
    (n: number, _: string, e: string) => `Couple chemistry scan complete \u00b7 ${e} \u00d7 Fire = 87%`,
    (n: number, a: string, _: string) => `Red Flag Radar activated \u00b7 ${a} pattern detected`,
] as const;

function generateEvent(): string {
    const n = Math.floor(100 + Math.random() * 900);
    const a = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
    const e = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const t = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    return t(n, a, e);
}

const ELEMENT_DOTS: Record<string, string> = {
    Fire: "#f97316",
    Water: "#3b82f6",
    Wood: "#22c55e",
    Metal: "#a1a1aa",
    Earth: "#eab308",
};

function dotColorFromText(text: string): string {
    for (const [el, color] of Object.entries(ELEMENT_DOTS)) {
        if (text.includes(el)) return color;
    }
    return "#a78bfa";
}

export default function LiveSocialTicker() {
    const [event, setEvent] = useState(() => generateEvent());
    const [key, setKey] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setEvent(generateEvent());
            setKey((k) => k + 1);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const dotColor = dotColorFromText(event);

    return (
        <div className="relative py-3.5 overflow-hidden border-y border-white/[0.04] bg-white/[0.01]">
            <div className="max-w-lg mx-auto px-6 flex items-center justify-center gap-3 h-5">
                {/* Live pulse dot */}
                <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: dotColor }}
                    />
                    <span
                        className="relative inline-flex rounded-full h-2 w-2"
                        style={{ backgroundColor: dotColor }}
                    />
                </span>

                {/* Sliding text */}
                <div className="relative overflow-hidden flex-1 h-5">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={key}
                            className="absolute inset-0 flex items-center text-xs text-white/30 font-medium tracking-wide whitespace-nowrap"
                            initial={{ y: 16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -16, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {event}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* Counter */}
                <span className="text-[10px] text-white/15 font-mono tabular-nums flex-shrink-0">
                    LIVE
                </span>
            </div>
        </div>
    );
}
