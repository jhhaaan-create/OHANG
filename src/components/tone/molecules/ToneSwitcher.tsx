"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTone, type Tone } from "@/lib/tone/ToneProvider";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Tone Switcher — 3-Mode Voice Pill
// Compact toggle: 매운맛 🔥 | 중간맛 ⚖️ | 순한맛 🌿
// ═══════════════════════════════════════════════════════

const TONES: { id: Tone; emoji: string; label: string; labelEn: string; color: string }[] = [
    { id: "savage", emoji: "🔥", label: "매운맛", labelEn: "Savage", color: "#ef4444" },
    { id: "balanced", emoji: "⚖️", label: "중간맛", labelEn: "Balanced", color: "#a78bfa" },
    { id: "gentle", emoji: "🌿", label: "순한맛", labelEn: "Gentle", color: "#4ade80" },
];

interface ToneSwitcherProps {
    /** Compact mode = single pill that cycles. Full mode = 3 buttons. */
    mode?: "compact" | "full";
    locale?: "ko" | "en";
    className?: string;
}

export default function ToneSwitcher({
    mode = "compact",
    locale = "ko",
    className = "",
}: ToneSwitcherProps) {
    const { tone, setTone, cycleTone } = useTone();

    if (mode === "compact") {
        const current = TONES.find((t) => t.id === tone)!;
        return (
            <motion.button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${className}`}
                style={{
                    backgroundColor: `${current.color}10`,
                    color: current.color,
                    border: `1px solid ${current.color}25`,
                }}
                onClick={() => { haptic.tap(); cycleTone(); }}
                whileTap={{ scale: 0.95 }}
            >
                <AnimatePresence mode="wait">
                    <motion.span
                        key={tone}
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 8, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {current.emoji} {locale === "ko" ? current.label : current.labelEn}
                    </motion.span>
                </AnimatePresence>
            </motion.button>
        );
    }

    // Full mode = 3 visible buttons
    return (
        <div className={`flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] ${className}`}>
            {TONES.map((t) => {
                const isActive = t.id === tone;
                return (
                    <button
                        key={t.id}
                        onClick={() => { haptic.tap(); setTone(t.id); }}
                        className="relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                            color: isActive ? t.color : "rgba(255,255,255,0.3)",
                        }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="tone-indicator"
                                className="absolute inset-0 rounded-lg"
                                style={{
                                    backgroundColor: `${t.color}10`,
                                    border: `1px solid ${t.color}20`,
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{t.emoji}</span>
                        <span className="relative z-10">
                            {locale === "ko" ? t.label : t.labelEn}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
