"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Upload, ArrowLeft, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CelebMatchSchema } from "@/lib/ai/schemas";
import { loadBirthData } from "@/lib/utils/birthDataStore";
import CelestialLoading from "@/components/celestial/CelestialLoading";
import ShareViralButton from "@/components/ui/ShareViralButton";
import { StreamingTypewriter } from "@/components/ui/TypewriterText";
import { triggerElementalHaptic } from "@/lib/utils/haptic";
import type { ElementType } from "@/lib/constants/archetypes";

type Step = "input" | "loading" | "result";

export default function CelebMatchPage() {
    const [step, setStep] = useState<Step>("input");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Optional saju for richer results
    const [showSaju, setShowSaju] = useState(false);
    const [sajuData, setSajuData] = useState({ year: "", month: "", day: "", hour: "", minute: "", gender: "male" });
    const [tone, setTone] = useState<"savage" | "balanced" | "gentle">("balanced");

    // Pre-fill saju from sessionStorage + auto-expand if data exists
    useEffect(() => {
        const stored = loadBirthData();
        if (stored && stored.year) {
            setSajuData(prev => ({ ...prev, ...stored }));
            setShowSaju(true);
        }
    }, []);

    const { object, submit, isLoading, error } = useObject({
        api: "/api/analyze/celeb-match",
        schema: CelebMatchSchema,
        onFinish: () => {
            setStep("result");
            triggerElementalHaptic("Fire");
        },
    });

    const handleUpload = async (file: File) => {
        const response = await fetch(`/api/upload?filename=${file.name}`, { method: "POST", body: file });
        const blob = await response.json();
        setImageUrl(blob.url);
    };

    const handleSubmit = () => {
        if (!imageUrl) return;
        setStep("loading");

        const payload: Record<string, unknown> = { image: imageUrl, tone };
        if (showSaju && sajuData.year) {
            payload.saju = {
                year: Number(sajuData.year),
                month: Number(sajuData.month),
                day: Number(sajuData.day),
                hour: sajuData.hour ? Number(sajuData.hour) : null,
                minute: sajuData.minute ? Number(sajuData.minute) : null,
                gender: sajuData.gender,
            };
        }

        submit(payload);
    };

    const sharePayload = useMemo(() => ({
        title: "OHANG Celebrity Match",
        text: object?.share_line ?? "Which celebrity matches your energy?",
        url: "https://ohang.app/features/celeb-match",
    }), [object]);

    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white relative overflow-hidden">
            {/* Loading */}
            <AnimatePresence>
                {step === "loading" && isLoading && (
                    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <CelestialLoading
                            element="Fire"
                            onPhaseChange={(id) => triggerElementalHaptic(id as ElementType)}
                            isComplete={!!object?.archetype_match}
                            onComplete={() => setStep("result")}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container mx-auto px-4 py-8 max-w-lg relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft size={18} className="text-white/50" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Star size={22} className="text-yellow-400 fill-yellow-400" /> Celebrity Match
                        </h1>
                        <p className="text-xs text-white/30">Find your celebrity energy twin</p>
                    </div>
                    {/* FREE badge */}
                    <span className="ml-auto px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                        FREE
                    </span>
                </div>

                {/* ── INPUT ── */}
                {step === "input" && (
                    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Photo Upload */}
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="aspect-[4/5] max-h-[400px] rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.03] transition-colors overflow-hidden relative"
                        >
                            {imageUrl ? (
                                <Image src={imageUrl} alt="Your photo" fill className="object-cover" />
                            ) : (
                                <div className="text-center text-white/40">
                                    <Upload size={32} className="mx-auto mb-3" />
                                    <span className="text-sm">Upload your selfie</span>
                                    <p className="text-[10px] text-white/20 mt-1">Best results with clear, front-facing photo</p>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileRef}
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                hidden
                                accept="image/*"
                            />
                        </div>

                        {/* Optional Saju Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowSaju(!showSaju)}
                            className="w-full text-left text-xs text-white/30 hover:text-white/50 transition-colors flex items-center gap-2"
                        >
                            <Sparkles size={12} />
                            {showSaju ? "Hide birth data (optional)" : "Add birth data for deeper match (optional)"}
                        </button>

                        <AnimatePresence>
                            {showSaju && (
                                <motion.div
                                    className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <div className="grid grid-cols-3 gap-3">
                                        <input value={sajuData.year} onChange={(e) => setSajuData({ ...sajuData, year: e.target.value })} type="number" placeholder="YYYY" className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-sm" />
                                        <input value={sajuData.month} onChange={(e) => setSajuData({ ...sajuData, month: e.target.value })} type="number" placeholder="MM" className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-sm" />
                                        <input value={sajuData.day} onChange={(e) => setSajuData({ ...sajuData, day: e.target.value })} type="number" placeholder="DD" className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-sm" />
                                    </div>
                                    <select value={sajuData.gender} onChange={(e) => setSajuData({ ...sajuData, gender: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <motion.button
                            onClick={handleSubmit}
                            disabled={!imageUrl || isLoading}
                            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600/80 to-amber-600/80 text-white border border-yellow-500/20 shadow-lg shadow-yellow-500/10 disabled:opacity-40"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Star size={18} className="fill-current" /> Find My Celebrity Twin
                        </motion.button>

                        <p className="text-[10px] text-white/20 text-center">
                            100% free. Share your result to unlock more features!
                        </p>
                    </motion.div>
                )}

                {/* ── RESULT ── */}
                {(step === "result" || (step === "loading" && object)) && object && (
                    <CelebResult data={object as Partial<import("@/lib/ai/schemas").CelebMatch>} isStreaming={isLoading} sharePayload={sharePayload} onReset={() => setStep("input")} />
                )}

                {error && (
                    <motion.div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {error.message || "Something went wrong."}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// ── Celebrity Match Result ──
function CelebResult({
    data,
    isStreaming,
    sharePayload,
    onReset,
}: {
    data: Partial<import("@/lib/ai/schemas").CelebMatch>;
    isStreaming: boolean;
    sharePayload: import("@/lib/sharing/shareUtils").SharePayload;
    onReset: () => void;
}) {
    return (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Match Header */}
            {data.archetype_match && (
                <motion.div className="text-center py-6" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/30 flex items-center justify-center">
                        <Star size={36} className="text-yellow-300 fill-yellow-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-white/90 mb-1">{data.archetype_match}</h2>
                    {data.energy_category && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                            {data.energy_category}
                        </span>
                    )}
                    {data.dominant_element && (
                        <p className="text-xs text-white/30 mt-2">{data.dominant_element} Energy</p>
                    )}
                </motion.div>
            )}

            {/* Energy Description */}
            {data.energy_description && (
                <motion.div
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <StreamingTypewriter text={data.energy_description} isLoading={isStreaming} className="text-sm text-white/55 leading-relaxed" />
                </motion.div>
            )}

            {/* Shared Traits */}
            {data.shared_traits && data.shared_traits.length > 0 && (
                <motion.div
                    className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h4 className="text-xs font-semibold text-yellow-300/50 uppercase tracking-wider mb-3">Shared Traits</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.shared_traits.map((trait, i) => (
                            <motion.span
                                key={i}
                                className="px-3 py-1.5 rounded-full text-xs bg-yellow-500/10 text-yellow-200/70 border border-yellow-500/15"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                            >
                                {trait}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Fun Fact */}
            {data.fun_fact && (
                <motion.div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h4 className="text-xs font-medium text-white/25 mb-2">✨ Fun Fact</h4>
                    <p className="text-sm text-white/55">{data.fun_fact}</p>
                </motion.div>
            )}

            {/* Share Line */}
            {data.share_line && (
                <motion.div className="text-center py-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-sm text-white/40 italic">&ldquo;{data.share_line}&rdquo;</p>
                </motion.div>
            )}

            {/* Share CTA + Upsell + Reset */}
            {!isStreaming && (
                <div className="flex flex-col items-center gap-4 pt-2">
                    <ShareViralButton payload={sharePayload} variant="cta" />

                    {/* Upsell to paid features */}
                    <div className="w-full p-4 rounded-xl bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 border border-violet-500/10 text-center space-y-2">
                        <p className="text-xs text-white/40">Want deeper insights?</p>
                        <div className="flex gap-2 justify-center">
                            <Link href="/features/red-flag" className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-300 border border-red-500/15 hover:brightness-110 transition-all">
                                Red Flag Radar
                            </Link>
                            <Link href="/features/couple-scan" className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-pink-500/10 text-pink-300 border border-pink-500/15 hover:brightness-110 transition-all">
                                Couple Scan
                            </Link>
                            <Link href="/features/retro-mode" className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/15 hover:brightness-110 transition-all">
                                Retro Mode
                            </Link>
                        </div>
                    </div>

                    <button onClick={onReset} className="text-sm text-white/30 hover:text-white/50 transition-colors">
                        Try Another Photo
                    </button>
                </div>
            )}
        </motion.div>
    );
}
