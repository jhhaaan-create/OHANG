"use client";

import { useState, useRef, useMemo } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Heart, ArrowLeft, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CoupleFaceScanSchema } from "@/lib/ai/schemas";
import CelestialLoading from "@/components/celestial/CelestialLoading";
import ShareViralButton from "@/components/ui/ShareViralButton";
import { StreamingTypewriter } from "@/components/ui/TypewriterText";
import { triggerElementalHaptic } from "@/lib/utils/haptic";
import { buildShareUrl } from "@/lib/sharing/shareUtils";
import type { ElementType } from "@/lib/constants/archetypes";

type Step = "input" | "loading" | "result";

export default function CoupleScanPage() {
    const [step, setStep] = useState<Step>("input");
    const [imageA, setImageA] = useState<string | null>(null);
    const [imageB, setImageB] = useState<string | null>(null);
    const fileRefA = useRef<HTMLInputElement>(null);
    const fileRefB = useRef<HTMLInputElement>(null);
    const [tone, setTone] = useState<"savage" | "balanced" | "gentle">("balanced");

    // Optional Saju data state (collapsed by default)
    const [showSaju, setShowSaju] = useState(false);

    const { object, submit, isLoading, error } = useObject({
        api: "/api/analyze/couple-face-scan",
        schema: CoupleFaceScanSchema,
        onFinish: () => {
            setStep("result");
            triggerElementalHaptic("Earth");
        },
    });

    // ── Image Upload Handler ──
    const handleUpload = async (
        file: File,
        setter: (url: string) => void
    ) => {
        const response = await fetch(`/api/upload?filename=${file.name}`, {
            method: "POST",
            body: file,
        });
        const blob = await response.json();
        setter(blob.url);
    };

    const handleSubmit = () => {
        if (!imageA || !imageB) return;
        setStep("loading");

        submit({
            imageA,
            imageB,
            tone,
            // sajuA and sajuB omitted for simplicity; add if showSaju
        });
    };

    const sharePayload = useMemo(() => ({
        title: "OHANG Couple Face Scan",
        text: object?.verdict ?? "See your visual chemistry",
        url: "https://ohang.app/features/couple-scan",
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
                            isComplete={!!object?.visual_chemistry_score}
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
                            <Heart size={22} className="text-pink-400 fill-pink-400" /> Couple Face Scan
                        </h1>
                        <p className="text-xs text-white/30">Upload two photos to reveal visual chemistry</p>
                    </div>
                </div>

                {/* ── INPUT ── */}
                {step === "input" && (
                    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Dual Photo Upload */}
                        <div className="grid grid-cols-2 gap-4">
                            <PhotoUploader
                                label="Person A"
                                imageUrl={imageA}
                                fileRef={fileRefA}
                                onUpload={(f) => handleUpload(f, setImageA)}
                            />
                            <PhotoUploader
                                label="Person B"
                                imageUrl={imageB}
                                fileRef={fileRefB}
                                onUpload={(f) => handleUpload(f, setImageB)}
                            />
                        </div>

                        {/* Tone Selector (reuse same pattern) */}
                        <div className="space-y-2">
                            <span className="text-xs text-white/30 font-medium">Reading Tone</span>
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
                        </div>

                        {/* Submit */}
                        <motion.button
                            onClick={handleSubmit}
                            disabled={!imageA || !imageB || isLoading}
                            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600/80 to-rose-600/80 text-white border border-pink-500/20 shadow-lg shadow-pink-500/10 disabled:opacity-40"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Camera size={18} /> Scan Chemistry
                        </motion.button>

                        <p className="text-[10px] text-white/20 text-center">
                            Photos are analyzed by AI and never stored permanently.
                        </p>
                    </motion.div>
                )}

                {/* ── RESULT ── */}
                {(step === "result" || (step === "loading" && object)) && object && (
                    <CoupleScanResult data={object as Partial<import("@/lib/ai/schemas").CoupleFaceScan>} isStreaming={isLoading} sharePayload={sharePayload} onReset={() => setStep("input")} />
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

// ── Photo Uploader Card ──
function PhotoUploader({
    label,
    imageUrl,
    fileRef,
    onUpload,
}: {
    label: string;
    imageUrl: string | null;
    fileRef: React.RefObject<HTMLInputElement | null>;
    onUpload: (file: File) => void;
}) {
    return (
        <div
            onClick={() => fileRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.03] transition-colors overflow-hidden relative"
        >
            {imageUrl ? (
                <Image src={imageUrl} alt={label} fill className="object-cover" />
            ) : (
                <div className="text-center text-white/40">
                    <Upload size={24} className="mx-auto mb-2" />
                    <span className="text-xs">{label}</span>
                </div>
            )}
            <input
                type="file"
                ref={fileRef}
                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                hidden
                accept="image/*"
            />
        </div>
    );
}

// ── Couple Scan Result Display ──
function CoupleScanResult({
    data,
    isStreaming,
    sharePayload,
    onReset,
}: {
    data: Partial<import("@/lib/ai/schemas").CoupleFaceScan>;
    isStreaming: boolean;
    sharePayload: import("@/lib/sharing/shareUtils").SharePayload;
    onReset: () => void;
}) {
    return (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Chemistry Score Ring */}
            {data.visual_chemistry_score !== undefined && (
                <motion.div className="text-center py-4" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                    <div className="relative w-32 h-32 mx-auto mb-3">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                            <motion.circle
                                cx="50" cy="50" r="42" fill="none"
                                stroke="#ec4899"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 42}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - data.visual_chemistry_score / 100) }}
                                transition={{ duration: 1.5, delay: 0.3 }}
                                style={{ filter: "drop-shadow(0 0 8px rgba(236,72,153,0.4))" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-bold text-pink-300">{data.visual_chemistry_score}</span>
                        </div>
                    </div>
                    <p className="text-xs text-white/30 tracking-wider uppercase">Visual Chemistry</p>
                </motion.div>
            )}

            {/* Person Cards */}
            {(data.person_a || data.person_b) && (
                <div className="grid grid-cols-2 gap-3">
                    {[data.person_a, data.person_b].map((p, i) => p && (
                        <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                            <span className="text-lg mb-1 block">👤</span>
                            <p className="text-sm font-medium text-white/70">{p.face_archetype}</p>
                            <p className="text-[10px] text-white/30">{p.dominant_element} · {p.key_energy}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Insight Sections */}
            {[
                { label: "Element Interaction", content: data.element_interaction },
                { label: "Strongest Bond", content: data.strongest_bond },
                { label: "Potential Friction", content: data.potential_friction },
                { label: "Spouse Palace", content: data.spouse_palace_reading },
                { label: "Together Energy", content: data.together_energy },
            ].filter(s => s.content).map((section, i) => (
                <motion.div
                    key={section.label}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                >
                    <h4 className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">{section.label}</h4>
                    <StreamingTypewriter text={section.content ?? ""} isLoading={isStreaming} className="text-sm text-white/55 leading-relaxed" />
                </motion.div>
            ))}

            {/* Verdict */}
            {data.verdict && (
                <motion.div
                    className="p-5 rounded-xl bg-pink-500/5 border border-pink-500/10 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <p className="text-base font-medium text-pink-200/80">{data.verdict}</p>
                </motion.div>
            )}

            {/* Share + Reset */}
            {!isStreaming && (
                <div className="flex flex-col items-center gap-3 pt-4">
                    <ShareViralButton payload={sharePayload} variant="cta" />
                    <button onClick={onReset} className="text-sm text-white/30 hover:text-white/50 transition-colors">
                        Scan Another Couple
                    </button>
                </div>
            )}
        </motion.div>
    );
}
