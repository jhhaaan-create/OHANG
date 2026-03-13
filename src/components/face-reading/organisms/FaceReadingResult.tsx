"use client";

import { motion } from "framer-motion";
import { Eye, Scan, Sparkles, AlertTriangle, Share2 } from "lucide-react";
import { useMoodTheme } from "@/providers/MoodThemeProvider";
import type { FaceReading } from "@/lib/ai/schemas";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Face Reading Result Display — K-Gwansang
// ═══════════════════════════════════════════════════════

const ELEMENT_COLORS: Record<string, string> = {
    Wood: "#4ade80", Fire: "#f43f5e", Earth: "#fbbf24",
    Metal: "#94a3b8", Water: "#60a5fa",
};

const ZONE_LABELS: Record<string, { ko: string; en: string }> = {
    upper: { ko: "상정 (초년)", en: "Upper (Early Life)" },
    middle: { ko: "중정 (중년)", en: "Middle (Prime)" },
    lower: { ko: "하정 (만년)", en: "Lower (Later Life)" },
};

interface FaceReadingResultProps {
    data: Partial<FaceReading>;
    isStreaming?: boolean;
    isFallback?: boolean;
    locale?: "ko" | "en";
    onShare?: () => void;
}

export default function FaceReadingResult({
    data,
    isStreaming = false,
    isFallback = false,
    locale = "ko",
    onShare,
}: FaceReadingResultProps) {
    const { palette } = useMoodTheme();
    const dominantColor = ELEMENT_COLORS[data.dominant_element ?? "Water"] ?? palette.accent;

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Fallback Banner */}
            {isFallback && (
                <motion.div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-300/80">
                        {locale === "ko"
                            ? "이미지 분석에 실패하여 사주 데이터 기반 추정 결과입니다."
                            : "Image analysis unavailable. This is a Cosmic Blueprint-based estimation."}
                    </p>
                </motion.div>
            )}

            {/* ── Header ── */}
            {data.face_archetype && (
                <motion.div
                    className="text-center py-6"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onAnimationComplete={() => haptic.reveal()}
                >
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${dominantColor}15`, border: `1px solid ${dominantColor}30` }}
                        >
                            <Scan size={18} style={{ color: dominantColor }} />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white">{data.face_archetype}</h2>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        {data.dominant_element && (
                            <span
                                className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: `${dominantColor}15`, color: dominantColor }}
                            >
                                {data.dominant_element}
                            </span>
                        )}
                        {data.secondary_element && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-white/40">
                                {data.secondary_element}
                            </span>
                        )}
                        {data.confidence && (
                            <span className="text-[10px] text-white/25">
                                {locale === "ko" ? `신뢰도: ${data.confidence}` : `Confidence: ${data.confidence}`}
                            </span>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── Zone Analysis (삼정) ── */}
            {data.zone_analysis && (
                <div className="space-y-2">
                    {(["upper", "middle", "lower"] as const).map((zone, i) => {
                        const zoneData = data.zone_analysis![zone];
                        if (!zoneData) return null;
                        const color = ELEMENT_COLORS[zoneData.element] ?? "#94a3b8";
                        return (
                            <motion.div
                                key={zone}
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                            >
                                <div
                                    className="w-1 h-full min-h-[32px] rounded-full shrink-0"
                                    style={{ backgroundColor: `${color}60` }}
                                />
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] text-white/30">
                                            {locale === "ko" ? ZONE_LABELS[zone].ko : ZONE_LABELS[zone].en}
                                        </span>
                                        <span className="text-[10px] font-medium" style={{ color }}>
                                            {zoneData.element}
                                        </span>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed">{zoneData.reading}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ── Key Features (오관) ── */}
            {data.key_features && data.key_features.length > 0 && (
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <h3 className="text-xs font-medium text-white/30 px-1 flex items-center gap-1.5">
                        <Eye size={12} /> {locale === "ko" ? "오관 분석" : "Five Officers"}
                    </h3>
                    {data.key_features.map((feat, i) => {
                        const color = ELEMENT_COLORS[feat.element] ?? "#94a3b8";
                        return (
                            <motion.div
                                key={i}
                                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 + i * 0.08 }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-white/70">{feat.feature}</span>
                                    <span className="text-[10px]" style={{ color }}>{feat.element}</span>
                                    <span className="text-[10px] text-white/20">{feat.officer}</span>
                                </div>
                                <p className="text-sm text-white/50 leading-relaxed">{feat.reading}</p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* ── Palace Insights (십이궁) ── */}
            {data.palace_insights && (
                <motion.div
                    className="rounded-xl p-4"
                    style={{
                        background: `linear-gradient(135deg, ${dominantColor}06, transparent)`,
                        border: `1px solid ${dominantColor}10`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    <h3 className="text-xs font-medium text-white/30 mb-3 flex items-center gap-1.5">
                        <Sparkles size={12} style={{ color: dominantColor }} />
                        {locale === "ko" ? "궁 해석" : "Palace Insights"}
                    </h3>
                    <div className="space-y-2">
                        {([
                            { key: "spouse_palace", label: locale === "ko" ? "부처궁 (배우자)" : "Spouse Palace" },
                            { key: "property_palace", label: locale === "ko" ? "전택궁 (재산)" : "Property Palace" },
                            { key: "fortune_palace", label: locale === "ko" ? "복덕궁 (복)" : "Fortune Palace" },
                        ] as const).map(({ key, label }) => {
                            const text = data.palace_insights![key];
                            if (!text) return null;
                            return (
                                <div key={key}>
                                    <span className="text-[10px] text-white/25">{label}</span>
                                    <p className="text-sm text-white/55">{text}</p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* ── Personality + First Impression ── */}
            {data.personality_read && (
                <motion.div
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                >
                    <p className="text-sm text-white/65 leading-relaxed">{data.personality_read}</p>
                    {data.first_impression_vs_reality && (
                        <p className="text-sm text-white/45 leading-relaxed mt-3 pt-3 border-t border-white/[0.04]">
                            {data.first_impression_vs_reality}
                        </p>
                    )}
                </motion.div>
            )}

            {/* ── Saju Cross-Analysis ── */}
            {data.saju_cross_analysis && (
                <motion.div
                    className="rounded-xl p-4"
                    style={{
                        background: `linear-gradient(135deg, ${palette.accent}06, transparent)`,
                        border: `1px solid ${palette.accent}12`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                >
                    <h3 className="text-xs font-medium text-white/30 mb-2">
                        {locale === "ko" ? "사주 × 관상 교차 분석" : "Blueprint × Face Cross Analysis"}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">{data.saju_cross_analysis}</p>
                </motion.div>
            )}

            {/* ── Share ── */}
            {!isStreaming && data.share_line && onShare && (
                <motion.div
                    className="flex justify-center pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                >
                    <button
                        onClick={() => { haptic.press(); onShare(); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-110 active:scale-[0.97]"
                        style={{
                            backgroundColor: `${dominantColor}15`,
                            color: dominantColor,
                            border: `1px solid ${dominantColor}25`,
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
