"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Scan, AlertTriangle, Sparkles } from "lucide-react";
import { DailyVibeSchema } from "@/lib/ai/schemas";
import { useStreamingResult } from "@/hooks/useStreamingResult";
import { useTone } from "@/lib/tone/ToneProvider";
import DailyVibeCard from "@/components/vibe/organisms/DailyVibeCard";
import ErrorFallback from "@/components/ui/ErrorFallback";
import ToneSwitcher from "@/components/tone/molecules/ToneSwitcher";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Dashboard Client — Daily Vibe + Feature Grid
// ═══════════════════════════════════════════════════════

interface BirthData {
    year: string;
    month: string;
    day: string;
    hour: string;
    gender: "male" | "female";
}

const FEATURE_CARDS = [
    { href: "/chemistry", icon: Heart, label: "궁합 분석", color: "#f43f5e", desc: "두 사람의 케미" },
    { href: "/face-reading", icon: Scan, label: "관상 분석", color: "#60a5fa", desc: "AI 관상학" },
    { href: "/red-flag", icon: AlertTriangle, label: "레드플래그", color: "#ef4444", desc: "위험 신호 탐지" },
] as const;

export default function DashboardClient() {
    const [birth, setBirth] = useState<BirthData>({ year: "", month: "", day: "", hour: "", gender: "female" });
    const [vibeLoaded, setVibeLoaded] = useState(false);
    const { tone } = useTone();

    const { data, isLoading, error, request, clearError } = useStreamingResult({
        api: "/api/vibe/today",
        schema: DailyVibeSchema,
        onComplete: () => { setVibeLoaded(true); haptic.celestial(); },
    });

    const handleVibeCheck = useCallback(() => {
        if (!birth.year) return;
        haptic.press();
        clearError();
        const today = new Date().toISOString().split("T")[0];
        request({
            year: Number(birth.year),
            month: Number(birth.month),
            day: Number(birth.day),
            hour: birth.hour ? Number(birth.hour) : null,
            gender: birth.gender,
            date: today,
            tone,
        });
    }, [birth, tone, request, clearError]);

    return (
        <div className="space-y-8">
            {/* Header with Tone Switcher */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">OHANG</h1>
                    <p className="text-xs text-white/30">오행 기반 운명 분석</p>
                </div>
                <ToneSwitcher mode="compact" />
            </div>

            {/* Daily Vibe Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    <h2 className="text-sm font-medium text-white/50">오늘의 운세</h2>
                </div>

                {error && (
                    <ErrorFallback type={error.type} message={error.message} onRetry={handleVibeCheck} />
                )}

                {data?.vibe_score !== undefined ? (
                    <DailyVibeCard data={data} isStreaming={isLoading} />
                ) : !isLoading ? (
                    <div className="space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                        <p className="text-xs text-white/30 text-center">생년월일을 입력하고 오늘의 운세를 확인하세요</p>
                        <div className="grid grid-cols-3 gap-2">
                            <input type="number" placeholder="년도" value={birth.year} onChange={(e) => setBirth({ ...birth, year: e.target.value })}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20" />
                            <input type="number" placeholder="월" value={birth.month} onChange={(e) => setBirth({ ...birth, month: e.target.value })}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20" />
                            <input type="number" placeholder="일" value={birth.day} onChange={(e) => setBirth({ ...birth, day: e.target.value })}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20" />
                        </div>
                        <button
                            onClick={handleVibeCheck}
                            disabled={!birth.year || !birth.month || !birth.day}
                            className="w-full py-3 rounded-xl bg-amber-500/10 text-amber-300 font-medium text-sm border border-amber-500/20 transition-all hover:bg-amber-500/15 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            오늘의 운세 확인
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-amber-400/20 border-t-amber-400/60 rounded-full animate-spin" />
                    </div>
                )}
            </section>

            {/* Feature Grid */}
            <section className="space-y-3">
                <h2 className="text-sm font-medium text-white/50">분석 기능</h2>
                <div className="grid grid-cols-1 gap-3">
                    {FEATURE_CARDS.map((card, i) => (
                        <Link key={card.href} href={card.href}>
                            <motion.div
                                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.08 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${card.color}10`, border: `1px solid ${card.color}20` }}
                                >
                                    <card.icon size={18} style={{ color: card.color }} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{card.label}</p>
                                    <p className="text-xs text-white/30">{card.desc}</p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
