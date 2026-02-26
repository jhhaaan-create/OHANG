"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, ChevronDown, Share2 } from "lucide-react";
import type { RedFlag } from "@/lib/ai/schemas";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Red Flag Radar — Progressive Disclosure with Loss Aversion
// Flags revealed one at a time with escalating urgency.
// ═══════════════════════════════════════════════════════

const RISK_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
    GREEN: { bg: "#22c55e12", text: "#4ade80", ring: "#22c55e" },
    YELLOW: { bg: "#eab30812", text: "#fbbf24", ring: "#eab308" },
    RED: { bg: "#ef444412", text: "#f87171", ring: "#ef4444" },
    RUN: { bg: "#f4395e12", text: "#fb7185", ring: "#f43f5e" },
};

const SEVERITY_ICONS: Record<string, string> = {
    low: "⚠️",
    medium: "🚩",
    high: "🚩🚩",
};

interface RedFlagResultProps {
    data: Partial<RedFlag>;
    isStreaming?: boolean;
    locale?: "ko" | "en";
    onShare?: () => void;
}

export default function RedFlagResult({
    data,
    isStreaming = false,
    locale = "ko",
    onShare,
}: RedFlagResultProps) {
    const [revealedFlags, setRevealedFlags] = useState<number>(0);
    const colors = RISK_COLORS[data.risk_level ?? "GREEN"] ?? RISK_COLORS.GREEN;
    const allFlags = data.flags ?? [];
    const hasUnrevealedFlags = revealedFlags < allFlags.length;

    function revealNextFlag() {
        if (revealedFlags < allFlags.length) {
            haptic.warning();
            setRevealedFlags((prev) => prev + 1);
        }
    }

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* ── Risk Level Header ── */}
            {data.risk_level && (
                <motion.div
                    className="text-center py-6"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    onAnimationComplete={() => haptic.reveal()}
                >
                    {/* Risk Score Ring */}
                    <div className="relative w-28 h-28 mx-auto mb-4">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                            <motion.circle
                                cx="50" cy="50" r="42" fill="none"
                                stroke={colors.ring}
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 42}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                animate={{
                                    strokeDashoffset: 2 * Math.PI * 42 * (1 - (data.risk_score ?? 0) / 100),
                                }}
                                transition={{ duration: 1.5, delay: 0.3 }}
                                style={{ filter: `drop-shadow(0 0 6px ${colors.ring}50)` }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold" style={{ color: colors.text }}>
                                {data.risk_score}
                            </span>
                        </div>
                    </div>

                    <span
                        className="inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wide"
                        style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.ring}30` }}
                    >
                        {data.risk_level}
                    </span>

                    {data.headline && (
                        <p className="text-base text-white/70 mt-3 px-4">
                            {data.headline}
                        </p>
                    )}
                </motion.div>
            )}

            {/* ── Element Clash ── */}
            {data.element_clash_summary && (
                <motion.div
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <p className="text-sm text-white/55 leading-relaxed">{data.element_clash_summary}</p>
                </motion.div>
            )}

            {/* ── Progressive Flag Reveal ── */}
            {allFlags.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-white/30 flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        {locale === "ko" ? "감지된 패턴" : "Detected Patterns"}
                        <span className="text-white/20">({revealedFlags}/{allFlags.length})</span>
                    </h3>

                    <AnimatePresence mode="popLayout">
                        {allFlags.slice(0, revealedFlags).map((flag, i) => {
                            const severityColor = flag.severity === "high" ? "#ef4444"
                                : flag.severity === "medium" ? "#f59e0b" : "#94a3b8";
                            return (
                                <motion.div
                                    key={i}
                                    className="p-4 rounded-xl border"
                                    style={{
                                        backgroundColor: `${severityColor}06`,
                                        borderColor: `${severityColor}15`,
                                    }}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "spring", damping: 20 }}
                                >
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="text-sm">{SEVERITY_ICONS[flag.severity]}</span>
                                        <span className="text-sm font-medium text-white/80">{flag.flag}</span>
                                    </div>
                                    <p className="text-xs text-white/45 mb-1">
                                        <span className="text-white/25">{locale === "ko" ? "원소 원인" : "Element Cause"}:</span>{" "}
                                        {flag.element_cause}
                                    </p>
                                    <p className="text-sm text-white/55 leading-relaxed mb-2">{flag.how_it_shows}</p>
                                    <p className="text-xs text-white/35 italic">
                                        💡 {flag.mitigation}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Reveal Next Button */}
                    {hasUnrevealedFlags && !isStreaming && (
                        <motion.button
                            onClick={revealNextFlag}
                            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                            style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.ring}20`,
                            }}
                            animate={{
                                boxShadow: [
                                    `0 0 0 ${colors.ring}00`,
                                    `0 0 20px ${colors.ring}20`,
                                    `0 0 0 ${colors.ring}00`,
                                ],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <ChevronDown size={14} />
                            {locale === "ko"
                                ? `다음 패턴 확인 (${allFlags.length - revealedFlags}개 남음)`
                                : `Reveal next (${allFlags.length - revealedFlags} remaining)`}
                        </motion.button>
                    )}
                </div>
            )}

            {/* ── Hidden Strength ── */}
            {data.hidden_strength && revealedFlags >= allFlags.length && (
                <motion.div
                    className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Shield size={14} className="text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-300/60">
                            {locale === "ko" ? "숨겨진 장점" : "Hidden Strength"}
                        </span>
                    </div>
                    <p className="text-sm text-white/55 leading-relaxed">{data.hidden_strength}</p>
                </motion.div>
            )}

            {/* ── The Pattern + Verdict ── */}
            {data.the_pattern && revealedFlags >= allFlags.length && (
                <motion.div
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <p className="text-sm text-white/55 leading-relaxed mb-3">{data.the_pattern}</p>
                    {data.verdict && (
                        <p className="text-sm text-white/70 font-medium">{data.verdict}</p>
                    )}
                    {data.if_you_proceed && (
                        <p className="text-xs text-white/35 mt-2 italic">
                            💡 {data.if_you_proceed}
                        </p>
                    )}
                </motion.div>
            )}

            {/* ── Share ── */}
            {!isStreaming && revealedFlags >= allFlags.length && onShare && (
                <motion.div
                    className="flex justify-center pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <button
                        onClick={() => { haptic.press(); onShare(); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/50 border border-white/10 transition-all hover:brightness-110 active:scale-[0.97]"
                    >
                        <Share2 size={14} />
                        {locale === "ko" ? "공유하기" : "Share"}
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
}
