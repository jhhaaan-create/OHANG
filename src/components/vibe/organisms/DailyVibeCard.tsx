"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Palette, Heart, AlertCircle, Clock, Flame, Share2 } from "lucide-react";
import type { DailyVibe } from "@/lib/ai/schemas";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Daily Vibe Card — Retention Engine UI
// ═══════════════════════════════════════════════════════

const ELEMENT_COLORS: Record<string, string> = {
    Wood: "#4ade80", Fire: "#f43f5e", Earth: "#fbbf24",
    Metal: "#94a3b8", Water: "#60a5fa",
};

const INTERACTION_LABELS: Record<string, { ko: string; en: string; color: string }> = {
    generates: { ko: "생성 에너지 ↑", en: "Generating ↑", color: "#4ade80" },
    controls: { ko: "통제 에너지", en: "Controlling", color: "#ef4444" },
    drains: { ko: "소모 에너지 ↓", en: "Draining ↓", color: "#f59e0b" },
    pressures: { ko: "압박 에너지", en: "Pressure", color: "#8b5cf6" },
    mirrors: { ko: "공명 에너지 ≈", en: "Mirroring ≈", color: "#60a5fa" },
};

interface DailyVibeCardProps {
    data: Partial<DailyVibe>;
    isPremium?: boolean;
    isStreaming?: boolean;
    locale?: "ko" | "en";
    streak?: number;
    onShare?: () => void;
}

export default function DailyVibeCard({
    data,
    isPremium = false,
    isStreaming = false,
    locale = "ko",
    streak = 0,
    onShare,
}: DailyVibeCardProps) {
    const vibeColor = ELEMENT_COLORS[data.today_element ?? "Water"] ?? "#60a5fa";
    const interaction = INTERACTION_LABELS[data.interaction_type ?? "mirrors"] ?? INTERACTION_LABELS.mirrors;

    return (
        <motion.div
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* ── Vibe Score Hero ── */}
            {data.vibe_score !== undefined && (
                <motion.div
                    className="text-center py-6 rounded-2xl relative overflow-hidden"
                    style={{
                        background: `radial-gradient(ellipse at 50% 60%, ${vibeColor}08, transparent)`,
                    }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onAnimationComplete={() => haptic.celestial()}
                >
                    {/* Streak Badge */}
                    {streak > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                            <Flame size={10} className="text-amber-400" />
                            <span className="text-[10px] font-medium text-amber-300">{streak}</span>
                        </div>
                    )}

                    <span className="text-5xl mb-2 block">{data.vibe_emoji}</span>
                    <span className="text-4xl font-bold text-white">{data.vibe_score}</span>
                    <span className="text-sm text-white/30 ml-1">/100</span>

                    {data.vibe_keyword && (
                        <p className="text-lg font-medium text-white/70 mt-1">{data.vibe_keyword}</p>
                    )}

                    {data.interaction_type && (
                        <span
                            className="inline-block px-3 py-1 rounded-full text-[11px] font-medium mt-2"
                            style={{ backgroundColor: `${interaction.color}15`, color: interaction.color }}
                        >
                            {locale === "ko" ? interaction.ko : interaction.en}
                        </span>
                    )}
                </motion.div>
            )}

            {/* ── Message ── */}
            {(data.message_brief || data.message_detailed) && (
                <motion.div
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <p className="text-sm text-white/65 leading-relaxed">
                        {isPremium && data.message_detailed
                            ? data.message_detailed
                            : data.message_brief}
                    </p>
                </motion.div>
            )}

            {/* ── Time Windows ── */}
            <div className="grid grid-cols-2 gap-3">
                {/* Peak */}
                {data.peak_window && (
                    <motion.div
                        className="p-3 rounded-xl"
                        style={{
                            backgroundColor: `${vibeColor}06`,
                            border: `1px solid ${vibeColor}12`,
                        }}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <Sun size={12} style={{ color: vibeColor }} />
                            <span className="text-[10px] font-medium text-white/40">
                                {locale === "ko" ? "최적 시간" : "Peak"}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-white/70">
                            {data.peak_window.start} - {data.peak_window.end}
                        </p>
                        <p className="text-xs text-white/40 mt-1">{data.peak_window.activity}</p>
                    </motion.div>
                )}

                {/* Avoid */}
                {data.avoid_window && (
                    <motion.div
                        className="p-3 rounded-xl bg-red-500/[0.03] border border-red-500/10"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <Moon size={12} className="text-red-400/60" />
                            <span className="text-[10px] font-medium text-white/40">
                                {locale === "ko" ? "주의 시간" : "Avoid"}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-white/70">
                            {data.avoid_window.start} - {data.avoid_window.end}
                        </p>
                        <p className="text-xs text-white/40 mt-1">{data.avoid_window.reason}</p>
                    </motion.div>
                )}
            </div>

            {/* ── Lucky Color ── */}
            {data.lucky_color && (
                <motion.div
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <div
                        className="w-8 h-8 rounded-lg shrink-0"
                        style={{ backgroundColor: data.lucky_color.hex }}
                    />
                    <div className="flex items-center gap-1.5">
                        <Palette size={12} className="text-white/30" />
                        <span className="text-xs text-white/50">{data.lucky_color.tip}</span>
                    </div>
                </motion.div>
            )}

            {/* ── Love Forecast ── */}
            {data.love_forecast && (
                <motion.div
                    className="flex items-start gap-2 px-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <Heart size={12} className="text-pink-400/50 mt-0.5 shrink-0" />
                    <p className="text-xs text-white/45">{data.love_forecast}</p>
                </motion.div>
            )}

            {/* ── One Thing to Avoid ── */}
            {data.one_thing_to_avoid && (
                <motion.div
                    className="flex items-start gap-2 px-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <AlertCircle size={12} className="text-amber-400/50 mt-0.5 shrink-0" />
                    <p className="text-xs text-white/45">{data.one_thing_to_avoid}</p>
                </motion.div>
            )}

            {/* ── Share ── */}
            {!isStreaming && onShare && (
                <motion.div
                    className="flex justify-center pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    <button
                        onClick={() => { haptic.press(); onShare(); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/50 border border-white/10 transition-all hover:brightness-110 active:scale-[0.97]"
                    >
                        <Share2 size={14} />
                        {locale === "ko" ? "오늘의 운세 공유" : "Share Vibe"}
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
}
