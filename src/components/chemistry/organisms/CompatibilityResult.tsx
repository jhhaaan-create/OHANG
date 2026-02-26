"use client";

import { motion } from "framer-motion";
import { Heart, Flame, Shield, MessageCircle, TrendingUp, Clock, Sparkles, Share2 } from "lucide-react";
import { useMoodTheme } from "@/providers/MoodThemeProvider";
import type { Compatibility } from "@/lib/ai/schemas";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Compatibility Result Display — God-Tier Chemistry Card
// ═══════════════════════════════════════════════════════

const DIMENSION_ICONS = {
    passion: Flame,
    stability: Shield,
    communication: MessageCircle,
    growth: TrendingUp,
    timing: Clock,
};

const DIMENSION_LABELS: Record<string, { ko: string; en: string }> = {
    passion: { ko: "열정", en: "Passion" },
    stability: { ko: "안정", en: "Stability" },
    communication: { ko: "소통", en: "Communication" },
    growth: { ko: "성장", en: "Growth" },
    timing: { ko: "타이밍", en: "Timing" },
};

const DYNAMIC_COLORS: Record<string, string> = {
    Spark: "#f59e0b",
    Comfort: "#4ade80",
    War: "#ef4444",
    Growth: "#22d3ee",
    Mirror: "#a78bfa",
    Karmic: "#c084fc",
    Toxic: "#f43f5e",
    Soulmate: "#ec4899",
};

interface CompatibilityResultProps {
    data: Partial<Compatibility>;
    isStreaming?: boolean;
    locale?: "ko" | "en";
    onShare?: () => void;
}

export default function CompatibilityResult({
    data,
    isStreaming = false,
    locale = "ko",
    onShare,
}: CompatibilityResultProps) {
    const { palette } = useMoodTheme();
    const dynamicColor = DYNAMIC_COLORS[data.dynamic_type ?? "Spark"] ?? palette.accent;

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* ── Hero Section ── */}
            {data.chemistry_label && (
                <motion.div
                    className="text-center py-8"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onAnimationComplete={() => haptic.destiny()}
                >
                    <span className="text-4xl mb-3 block">{data.chemistry_emoji}</span>
                    <h2 className="text-2xl font-bold text-white mb-1">
                        {data.chemistry_label}
                    </h2>
                    {data.dynamic_type && (
                        <span
                            className="inline-block px-3 py-1 rounded-full text-xs font-medium mt-2"
                            style={{ backgroundColor: `${dynamicColor}20`, color: dynamicColor }}
                        >
                            {data.dynamic_type}
                        </span>
                    )}
                </motion.div>
            )}

            {/* ── Score Ring ── */}
            {data.overall_score !== undefined && (
                <motion.div
                    className="flex justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                >
                    <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                            <motion.circle
                                cx="50" cy="50" r="42" fill="none"
                                stroke={dynamicColor}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 42}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                animate={{
                                    strokeDashoffset: 2 * Math.PI * 42 * (1 - data.overall_score / 100),
                                }}
                                transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                                style={{ filter: `drop-shadow(0 0 8px ${dynamicColor}60)` }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">{data.overall_score}</span>
                            <span className="text-[10px] text-white/30">/ 100</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Headline ── */}
            {data.headline && (
                <motion.p
                    className="text-center text-lg font-medium text-white/80 px-4 leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    &ldquo;{data.headline}&rdquo;
                </motion.p>
            )}

            {/* ── Dimension Scores ── */}
            {data.dimension_scores && (
                <motion.div
                    className="space-y-3 px-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {(Object.keys(data.dimension_scores) as Array<keyof typeof data.dimension_scores>).map((key, i) => {
                        const score = data.dimension_scores![key];
                        const Icon = DIMENSION_ICONS[key];
                        const label = DIMENSION_LABELS[key];
                        return (
                            <motion.div
                                key={key}
                                className="flex items-center gap-3"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.08 }}
                            >
                                <Icon size={14} className="text-white/30 shrink-0" />
                                <span className="text-xs text-white/50 w-16 shrink-0">
                                    {locale === "ko" ? label.ko : label.en}
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-white/6 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: dynamicColor }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${score}%` }}
                                        transition={{ delay: 0.7 + i * 0.08, duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                                <span className="text-xs text-white/40 w-8 text-right tabular-nums">
                                    {score}
                                </span>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* ── Element Dynamic ── */}
            {data.element_dynamic && (
                <motion.div
                    className="rounded-xl p-4"
                    style={{
                        background: `linear-gradient(135deg, ${dynamicColor}08, transparent)`,
                        border: `1px solid ${dynamicColor}12`,
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} style={{ color: dynamicColor }} />
                        <span className="text-xs font-medium text-white/60">
                            {data.element_dynamic.interaction_type}
                        </span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">
                        {data.element_dynamic.description}
                    </p>
                </motion.div>
            )}

            {/* ── Void Complementarity ── */}
            {data.void_complementarity && (
                <motion.div
                    className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.04]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium mb-2"
                        style={{ backgroundColor: `${dynamicColor}15`, color: dynamicColor }}
                    >
                        {data.void_complementarity.type}
                    </span>
                    <p className="text-sm text-white/60 leading-relaxed">
                        {data.void_complementarity.insight}
                    </p>
                </motion.div>
            )}

            {/* ── Narrative ── */}
            {data.narrative && (
                <div className="space-y-4">
                    {([
                        { key: "the_meeting", label: locale === "ko" ? "첫 만남" : "The Meeting" },
                        { key: "month_three", label: locale === "ko" ? "3개월 후" : "Month 3" },
                        { key: "the_crossroads", label: locale === "ko" ? "갈림길" : "The Crossroads" },
                        { key: "the_verdict", label: locale === "ko" ? "결론" : "The Verdict" },
                    ] as const).map(({ key, label }, i) => {
                        const text = data.narrative![key];
                        if (!text) return null;
                        return (
                            <motion.div
                                key={key}
                                className="pl-4 border-l-2"
                                style={{ borderColor: `${dynamicColor}30` }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.0 + i * 0.12 }}
                            >
                                <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
                                    {label}
                                </span>
                                <p className="text-sm text-white/60 leading-relaxed mt-0.5">
                                    {text}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ── Verdict + Survival Tip ── */}
            {data.verdict && (
                <motion.div
                    className="rounded-xl p-5 text-center"
                    style={{
                        background: `radial-gradient(ellipse at center, ${dynamicColor}08, transparent)`,
                        border: `1px solid ${dynamicColor}15`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                >
                    <p className="text-sm font-medium text-white/80 mb-3">{data.verdict}</p>
                    {data.survival_tip && (
                        <p className="text-xs text-white/40 italic">
                            💡 {data.survival_tip}
                        </p>
                    )}
                </motion.div>
            )}

            {/* ── Share Button ── */}
            {!isStreaming && data.share_line && onShare && (
                <motion.div
                    className="flex justify-center pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                >
                    <button
                        onClick={() => {
                            haptic.press();
                            onShare();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-110 active:scale-[0.97]"
                        style={{
                            backgroundColor: `${dynamicColor}15`,
                            color: dynamicColor,
                            border: `1px solid ${dynamicColor}25`,
                        }}
                    >
                        <Share2 size={14} />
                        {locale === "ko" ? "공유하기" : "Share"}
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
}
