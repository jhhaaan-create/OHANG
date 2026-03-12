"use client";

import { useState, useEffect, useMemo } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Rewind, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

import { RetroModeSchema } from "@/lib/ai/schemas";
import { loadBirthData } from "@/lib/utils/birthDataStore";
import CelestialLoading from "@/components/celestial/CelestialLoading";
import ShareViralButton from "@/components/ui/ShareViralButton";
import { StreamingTypewriter } from "@/components/ui/TypewriterText";
import { triggerElementalHaptic } from "@/lib/utils/haptic";
import type { ElementType } from "@/lib/constants/archetypes";

type Step = "input" | "loading" | "result";

export default function RetroModePage() {
    const [step, setStep] = useState<Step>("input");
    const [myData, setMyData] = useState({ year: "", month: "", day: "", hour: "", minute: "", gender: "male" });
    const [exData, setExData] = useState({ year: "", month: "", day: "", hour: "", minute: "", gender: "female" });
    const [tone, setTone] = useState<"savage" | "balanced" | "gentle">("savage");

    // Pre-fill from sessionStorage
    useEffect(() => {
        const stored = loadBirthData();
        if (stored) setMyData(prev => ({ ...prev, ...stored }));
    }, []);

    const { object, submit, isLoading, error } = useObject({
        api: "/api/analyze/retro-mode",
        schema: RetroModeSchema,
        onFinish: () => {
            setStep("result");
            triggerElementalHaptic("Water");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep("loading");

        submit({
            user: {
                year: Number(myData.year),
                month: Number(myData.month),
                day: Number(myData.day),
                hour: myData.hour ? Number(myData.hour) : null,
                minute: myData.minute ? Number(myData.minute) : null,
                gender: myData.gender as "male" | "female",
            },
            ex: {
                year: Number(exData.year),
                month: Number(exData.month),
                day: Number(exData.day),
                hour: exData.hour ? Number(exData.hour) : null,
                minute: exData.minute ? Number(exData.minute) : null,
                gender: exData.gender as "male" | "female",
            },
            tone,
        });
    };

    const sharePayload = useMemo(() => ({
        title: "OHANG Retro Mode",
        text: object?.closure ?? "Understand why it ended",
        url: "https://ohang.app/features/retro-mode",
    }), [object]);

    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white relative overflow-hidden">
            {/* Loading */}
            <AnimatePresence>
                {step === "loading" && isLoading && (
                    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <CelestialLoading
                            element="Water"
                            onPhaseChange={(id) => triggerElementalHaptic(id as ElementType)}
                            isComplete={!!object?.closure}
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
                            <Rewind size={22} className="text-blue-400" /> Retro Mode
                        </h1>
                        <p className="text-xs text-white/30">Why it ended — and what it activated in you</p>
                    </div>
                </div>

                {/* ── INPUT ── */}
                {step === "input" && (
                    <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Reuse BirthDataSection pattern from Red Flag */}
                        <BirthInputCard label="Your Birth Data" icon="🔮" data={myData} onChange={setMyData} />
                        <BirthInputCard label="Your Ex's Birth Data" icon="👻" data={exData} onChange={setExData} />

                        {/* Tone */}
                        <div className="grid grid-cols-3 gap-2">
                            {(["savage", "balanced", "gentle"] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTone(t)}
                                    className={`py-2.5 rounded-lg text-xs font-medium border transition-all ${
                                        tone === t
                                            ? "bg-white/10 border-white/20 text-white"
                                            : "bg-white/[0.02] border-white/[0.06] text-white/40"
                                    }`}
                                >
                                    {t === "savage" ? "Savage 🔥" : t === "balanced" ? "Balanced ⚖️" : "Gentle 🌊"}
                                </button>
                            ))}
                        </div>

                        <motion.button
                            type="submit"
                            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white border border-blue-500/20 shadow-lg shadow-blue-500/10"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                        >
                            <Rewind size={18} /> Rewind the Tape
                        </motion.button>
                    </motion.form>
                )}

                {/* ── RESULT ── */}
                {(step === "result" || (step === "loading" && object)) && object && (
                    <RetroResult data={object as Partial<import("@/lib/ai/schemas").RetroMode>} isStreaming={isLoading} sharePayload={sharePayload} onReset={() => setStep("input")} />
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

// ── Retro Result Component ──
function RetroResult({
    data,
    isStreaming,
    sharePayload,
    onReset,
}: {
    data: Partial<import("@/lib/ai/schemas").RetroMode>;
    isStreaming: boolean;
    sharePayload: import("@/lib/sharing/shareUtils").SharePayload;
    onReset: () => void;
}) {
    return (
        <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Pairing Header */}
            {data.pairing_label && (
                <motion.div className="text-center py-4" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                    <span className="text-3xl mb-2 block">{data.pairing_emoji}</span>
                    <h2 className="text-xl font-bold text-white/80">{data.pairing_label}</h2>
                </motion.div>
            )}

            {/* Element Story */}
            {data.element_story && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300">{data.element_story.your_element}</span>
                        <span className="text-white/20 text-xs">{data.element_story.interaction}</span>
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300">{data.element_story.their_element}</span>
                    </div>
                    <StreamingTypewriter text={data.element_story.what_this_means ?? ""} isLoading={isStreaming} className="text-sm text-white/55 leading-relaxed" />
                </div>
            )}

            {/* Timeline Sections */}
            {[
                { label: "🧲 The Attraction", content: data.the_attraction },
                { label: "💔 The Breaking Point", content: data.the_breaking_point },
                { label: "⏱️ The Timeline", content: data.the_timeline },
                { label: "⚡ What They Activated", content: data.what_they_activated },
                { label: "🔄 The Pattern", content: data.the_pattern },
            ].filter(s => s.content).map((section, i) => (
                <motion.div
                    key={section.label}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 * i }}
                >
                    <h4 className="text-xs font-medium text-white/30 mb-2">{section.label}</h4>
                    <StreamingTypewriter text={section.content ?? ""} isLoading={isStreaming} className="text-sm text-white/55 leading-relaxed" />
                </motion.div>
            ))}

            {/* Closure */}
            {data.closure && (
                <motion.div
                    className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <h4 className="text-xs font-semibold text-blue-300/50 uppercase tracking-wider mb-2">Closure</h4>
                    <p className="text-base text-blue-200/70 leading-relaxed">{data.closure}</p>
                </motion.div>
            )}

            {/* What to Seek */}
            {data.what_to_seek && (
                <motion.div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h4 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider mb-2">What To Seek Next</h4>
                    <p className="text-sm text-white/55 leading-relaxed">{data.what_to_seek}</p>
                </motion.div>
            )}

            {/* Share + Reset */}
            {!isStreaming && (
                <div className="flex flex-col items-center gap-3 pt-4">
                    <ShareViralButton payload={sharePayload} variant="cta" />
                    <button onClick={onReset} className="text-sm text-white/30 hover:text-white/50 transition-colors">
                        Analyze Another Ex
                    </button>
                </div>
            )}
        </motion.div>
    );
}

// ── Birth Input Card (same pattern as Red Flag) ──
function BirthInputCard({
    label, icon, data, onChange,
}: {
    label: string;
    icon: string;
    data: { year: string; month: string; day: string; hour: string; minute: string; gender: string };
    onChange: (d: typeof data) => void;
}) {
    const set = (key: string, val: string) => onChange({ ...data, [key]: val });

    return (
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4">
            <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
                <span>{icon}</span> {label}
            </h3>
            <div className="grid grid-cols-3 gap-3">
                <input value={data.year} onChange={(e) => set("year", e.target.value)} type="number" placeholder="YYYY" required className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-sm" />
                <input value={data.month} onChange={(e) => set("month", e.target.value)} type="number" placeholder="MM" required className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-sm" />
                <input value={data.day} onChange={(e) => set("day", e.target.value)} type="number" placeholder="DD" required className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <input value={data.hour} onChange={(e) => set("hour", e.target.value)} type="number" placeholder="Hour (0-23)" className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-sm" />
                <input value={data.minute} onChange={(e) => set("minute", e.target.value)} type="number" placeholder="Min" className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-sm" />
            </div>
            <select value={data.gender} onChange={(e) => set("gender", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white">
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
        </div>
    );
}
