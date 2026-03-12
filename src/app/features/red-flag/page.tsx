"use client";

import { useState, useEffect, useMemo } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RedFlagSchema } from "@/lib/ai/schemas";
import { loadBirthData } from "@/lib/utils/birthDataStore";
import RedFlagResult from "@/components/red-flag/organisms/RedFlagResult";
import PaywallGate from "@/components/paywall/PaywallGate";
import CelestialLoading from "@/components/celestial/CelestialLoading";
import ShareViralButton from "@/components/ui/ShareViralButton";
import { triggerElementalHaptic } from "@/lib/utils/haptic";
import { buildShareUrl } from "@/lib/sharing/shareUtils";
import type { ElementType } from "@/lib/constants/archetypes";

const RISK_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
    GREEN: { bg: "#22c55e12", text: "#4ade80", ring: "#22c55e" },
    YELLOW: { bg: "#eab30812", text: "#fbbf24", ring: "#eab308" },
    RED: { bg: "#ef444412", text: "#f87171", ring: "#ef4444" },
    RUN: { bg: "#f4395e12", text: "#fb7185", ring: "#f43f5e" },
};

type Step = "input" | "loading" | "paywall" | "result";

export default function RedFlagPage() {
    const [step, setStep] = useState<Step>("input");
    const [resultId, setResultId] = useState<string | null>(null);

    // ── Form State ──
    const [myData, setMyData] = useState({ year: "", month: "", day: "", hour: "", minute: "", gender: "male" });
    const [partnerData, setPartnerData] = useState({ year: "", month: "", day: "", hour: "", minute: "", gender: "female" });
    const [tone, setTone] = useState<"savage" | "balanced" | "gentle">("balanced");

    // Pre-fill from sessionStorage
    useEffect(() => {
        const stored = loadBirthData();
        if (stored) setMyData(prev => ({ ...prev, ...stored }));
    }, []);

    // ── AI Streaming ──
    const { object, submit, isLoading, error } = useObject({
        api: "/api/analyze/red-flag",
        schema: RedFlagSchema,
        onFinish: (event) => {
            setStep("result");
            triggerElementalHaptic("Fire"); // Red flags = Fire energy
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep("loading");

        const payload = {
            user: {
                year: Number(myData.year),
                month: Number(myData.month),
                day: Number(myData.day),
                hour: myData.hour ? Number(myData.hour) : null,
                minute: myData.minute ? Number(myData.minute) : null,
                gender: myData.gender as "male" | "female",
            },
            partner: {
                year: Number(partnerData.year),
                month: Number(partnerData.month),
                day: Number(partnerData.day),
                hour: partnerData.hour ? Number(partnerData.hour) : null,
                minute: partnerData.minute ? Number(partnerData.minute) : null,
                gender: partnerData.gender as "male" | "female",
            },
            tone,
        };

        submit(payload);
    };

    // ── Share payload ──
    const sharePayload = useMemo(() => ({
        title: "OHANG Red Flag Radar",
        text: object?.headline ?? "Check your relationship red flags",
        url: resultId ? buildShareUrl("redflag", resultId) : "https://ohang.app/features/red-flag",
    }), [object, resultId]);

    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white relative overflow-hidden">
            {/* Loading Overlay */}
            <AnimatePresence>
                {step === "loading" && isLoading && (
                    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <CelestialLoading
                            element="Fire"
                            onPhaseChange={(id) => triggerElementalHaptic(id as ElementType)}
                            isComplete={!!object?.risk_level}
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
                            <AlertTriangle size={22} className="text-red-400" /> Red Flag Radar
                        </h1>
                        <p className="text-xs text-white/30">Detect hidden relationship patterns</p>
                    </div>
                </div>

                {/* ── INPUT STEP ── */}
                {step === "input" && (
                    <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Your Birth Data */}
                        <BirthDataSection
                            label="Your Birth Data"
                            icon="🔮"
                            data={myData}
                            onChange={setMyData}
                        />

                        {/* Partner Birth Data */}
                        <BirthDataSection
                            label="Partner's Birth Data"
                            icon="💀"
                            data={partnerData}
                            onChange={setPartnerData}
                        />

                        {/* Tone Selector */}
                        <ToneSelector value={tone} onChange={setTone} />

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-red-600/80 to-orange-600/80 text-white border border-red-500/20 shadow-lg shadow-red-500/10"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                        >
                            <Zap size={18} className="fill-current" />
                            Scan for Red Flags
                        </motion.button>
                    </motion.form>
                )}

                {/* ── RESULT STEP ── */}
                {(step === "result" || (step === "loading" && object)) && object && (
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {/* ── TEASER (free) — Risk Score + Headline ── */}
                        {object.risk_level && (
                            <motion.div
                                className="text-center py-6 bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring" }}
                            >
                                <div className="relative w-28 h-28 mx-auto mb-4">
                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                                        <motion.circle
                                            cx="50" cy="50" r="42" fill="none"
                                            stroke={RISK_COLORS[object.risk_level ?? "GREEN"]?.ring ?? "#22c55e"}
                                            strokeWidth="5"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 42}`}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - (object.risk_score ?? 0) / 100) }}
                                            transition={{ duration: 1.5, delay: 0.3 }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold" style={{ color: RISK_COLORS[object.risk_level ?? "GREEN"]?.text ?? "#4ade80" }}>
                                            {object.risk_score}
                                        </span>
                                    </div>
                                </div>
                                <span
                                    className="inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wide"
                                    style={{
                                        backgroundColor: RISK_COLORS[object.risk_level ?? "GREEN"]?.bg,
                                        color: RISK_COLORS[object.risk_level ?? "GREEN"]?.text,
                                    }}
                                >
                                    {object.risk_level}
                                </span>
                                {object.headline && (
                                    <p className="text-base text-white/70 mt-3 px-4">{object.headline}</p>
                                )}
                            </motion.div>
                        )}

                        {/* Element Clash (free teaser) */}
                        {object.element_clash_summary && (
                            <motion.div
                                className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.06]"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h4 className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Element Clash</h4>
                                <p className="text-sm text-white/55 leading-relaxed">{object.element_clash_summary}</p>
                            </motion.div>
                        )}

                        {/* ── GATED — Full Flag Analysis ── */}
                        <PaywallGate
                            tier="free"
                            requiredTier="basic"
                            featureLabel="Full Reading — $2.99"
                            cliffhangerText="The 3rd flag reveals a [████████] pattern"
                            shareUnlockFeature="red_flag"
                            locale="en"
                        >
                            <RedFlagResult
                                data={object as Partial<import("@/lib/ai/schemas").RedFlag>}
                                isStreaming={isLoading}
                                locale="en"
                            />
                        </PaywallGate>

                        {!isLoading && (
                            <div className="flex flex-col items-center gap-3 pt-4">
                                <ShareViralButton payload={sharePayload} variant="cta" />
                                <button
                                    onClick={() => { setStep("input"); }}
                                    className="text-sm text-white/30 hover:text-white/50 transition-colors"
                                >
                                    Scan Another Relationship
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Error */}
                {error && (
                    <motion.div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {error.message || "Something went wrong. Please try again."}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// ── Reusable Birth Data Section ──
function BirthDataSection({
    label,
    icon,
    data,
    onChange,
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

            <select
                value={data.gender}
                onChange={(e) => set("gender", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white"
            >
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
        </div>
    );
}

// ── Tone Selector ──
function ToneSelector({
    value,
    onChange,
}: {
    value: "savage" | "balanced" | "gentle";
    onChange: (t: "savage" | "balanced" | "gentle") => void;
}) {
    const tones = [
        { key: "savage" as const, label: "Savage 🔥", desc: "No mercy" },
        { key: "balanced" as const, label: "Balanced ⚖️", desc: "Fair & honest" },
        { key: "gentle" as const, label: "Gentle 🌊", desc: "Kind but real" },
    ];

    return (
        <div className="space-y-2">
            <span className="text-xs text-white/30 font-medium">Reading Tone</span>
            <div className="grid grid-cols-3 gap-2">
                {tones.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => onChange(t.key)}
                        className={`py-2.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                            value === t.key
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
