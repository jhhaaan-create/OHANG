// src/components/landing/HeroSection.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Upload, Camera, ArrowRight, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Hero Section — Zero-Friction Conversion Engine
//
// CRO #1: Birth input + selfie upload INSIDE hero
// CRO #2: Terminal typewriter hook text
// CRO #6: Glow aura + haptic on all interactions
// ═══════════════════════════════════════════════════════

// ── Typewriter Strings (cycling) ──
const TYPEWRITER_LINES = [
    "Decoding your soul blueprint...",
    "Scanning elemental energy signature...",
    "Analyzing 518,400 destiny combinations...",
    "Reading the Four Frequencies of your fate...",
    "Mapping your void element...",
];

export default function HeroSection() {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [unknownTime, setUnknownTime] = useState(true);

    // ── Typewriter State ──
    const [lineIndex, setLineIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    const currentLine = TYPEWRITER_LINES[lineIndex];
    const displayedText = currentLine.slice(0, charIndex);

    useEffect(() => {
        const typeSpeed = isDeleting ? 20 : 45;
        const pauseAtEnd = 2000;
        const pauseAtStart = 400;

        const timer = setTimeout(() => {
            if (!isDeleting && charIndex < currentLine.length) {
                setCharIndex((c) => c + 1);
            } else if (!isDeleting && charIndex === currentLine.length) {
                setTimeout(() => setIsDeleting(true), pauseAtEnd);
            } else if (isDeleting && charIndex > 0) {
                setCharIndex((c) => c - 1);
            } else if (isDeleting && charIndex === 0) {
                setIsDeleting(false);
                setLineIndex((l) => (l + 1) % TYPEWRITER_LINES.length);
                return;
            }
        }, charIndex === 0 && !isDeleting ? pauseAtStart : typeSpeed);

        return () => clearTimeout(timer);
    }, [charIndex, isDeleting, currentLine, lineIndex]);

    // ── Image Upload ──
    const handleImageUpload = useCallback(async (file: File) => {
        setIsUploading(true);
        try {
            const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                method: "POST",
                body: file,
            });
            const blob = await res.json();
            if (blob.url) {
                setImageUrl(blob.url);
                haptic.success();
            }
        } catch {
            // Silent fail — selfie is optional
        } finally {
            setIsUploading(false);
        }
    }, []);

    // ── Form Submit → /analyze with prefilled params ──
    const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        haptic.destiny();
        const fd = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        const year = fd.get("year") as string;
        const month = fd.get("month") as string;
        const day = fd.get("day") as string;
        const hour = fd.get("hour") as string;
        const minute = fd.get("minute") as string;
        if (year) params.set("year", year);
        if (month) params.set("month", month);
        if (day) params.set("day", day);
        if (!unknownTime && hour) params.set("hour", hour);
        if (!unknownTime && minute) params.set("minute", minute);
        if (imageUrl) params.set("imageUrl", imageUrl);
        router.push(`/analyze?${params.toString()}`);
    }, [router, imageUrl, unknownTime]);

    return (
        <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-5 pt-safe-top">
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/[0.04] blur-[120px]" />
                <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
                <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-fuchsia-500/[0.03] blur-[80px]" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-auto text-center">
                {/* Badge */}
                <motion.div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] mb-6"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400" />
                    </span>
                    <span className="text-[11px] text-white/40 tracking-wide">Cosmic Blueprint Engine</span>
                </motion.div>

                {/* Hook Phrase - ULTIMATE COPY APPLIED */}
                <motion.h1
                    className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] tracking-tight mb-4"
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <span className="text-white/90">Your face holds the timestamp</span>
                    <br />
                    <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent text-[0.85em]">
                        the universe forgot to give you.
                    </span>
                </motion.h1>

                {/* Subtext - NEWLY ADDED */}
                <motion.p
                    className="text-sm sm:text-base text-white/60 mb-6 max-w-md mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    Most apps stop at your birthday. We read the energy architecture written into your bone structure to reconstruct the missing piece of your Cosmic DNA.
                </motion.p>

                {/* Typewriter Terminal Line */}
                <motion.div
                    className="h-7 mb-8 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <span className="font-mono text-xs sm:text-sm tracking-wide">
                        <span className="text-violet-400/60">$</span>
                        <span className="text-white/30 ml-2">{displayedText}</span>
                        <motion.span
                            className="inline-block w-[2px] h-[14px] bg-violet-400/60 ml-[1px] align-text-bottom"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    </span>
                </motion.div>

                {/* ═══ ZERO-FRICTION INPUT FORM ═══ */}
                <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    {/* Birth Date Row */}
                    <div className="flex gap-2">
                        <input
                            name="year"
                            type="number"
                            placeholder="YYYY"
                            required
                            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-3 text-center text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
                        />
                        <input
                            name="month"
                            type="number"
                            placeholder="MM"
                            required
                            className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-3 text-center text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
                        />
                        <input
                            name="day"
                            type="number"
                            placeholder="DD"
                            required
                            className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-3 text-center text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
                        />
                    </div>

                    {/* Unknown Time Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer select-none -mt-1">
                        <input
                            type="checkbox"
                            checked={unknownTime}
                            onChange={(e) => setUnknownTime(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/30 focus:ring-offset-0"
                        />
                        <span className="text-xs text-violet-400">I don&apos;t know my exact birth time</span>
                    </label>

                    {/* Hour/Minute Inputs (shown when time is known) */}
                    <AnimatePresence>
                        {!unknownTime && (
                            <motion.div
                                className="flex gap-2"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <input
                                    name="hour"
                                    type="number"
                                    placeholder="Hour (0-23)"
                                    min={0}
                                    max={23}
                                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-3 text-center text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
                                />
                                <input
                                    name="minute"
                                    type="number"
                                    placeholder="Min (0-59)"
                                    min={0}
                                    max={59}
                                    className="w-28 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-3 text-center text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Face Frequency Upload Zone (expanded when time unknown) */}
                    <AnimatePresence>
                        {unknownTime && (
                            <motion.div
                                onClick={() => fileRef.current?.click()}
                                className="relative flex flex-col items-center gap-3 px-5 py-5 rounded-xl border-2 border-dashed cursor-pointer hover:bg-violet-500/[0.04] transition-all group overflow-hidden"
                                style={{
                                    borderColor: imageUrl ? "rgba(52,211,153,0.3)" : undefined,
                                }}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{
                                    opacity: 1,
                                    height: "auto",
                                    borderColor: imageUrl
                                        ? "rgba(52,211,153,0.3)"
                                        : ["rgba(139,92,246,0.25)", "rgba(139,92,246,0.5)", "rgba(139,92,246,0.25)"],
                                }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                    borderColor: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                    opacity: { duration: 0.3 },
                                    height: { duration: 0.3 },
                                }}
                            >
                                <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                    {imageUrl ? (
                                        <Camera size={18} className="text-emerald-400" />
                                    ) : isUploading ? (
                                        <motion.div
                                            className="w-5 h-5 border-2 border-violet-400/30 border-t-violet-400 rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                        />
                                    ) : (
                                        <Camera size={18} className="text-violet-400" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium text-violet-300/80">
                                        {imageUrl ? "Face uploaded \u2713" : "Your face holds the missing frequency"}
                                    </p>
                                    <p className="text-[10px] text-white/20 mt-0.5">
                                        {imageUrl ? "AI will reconstruct your lost timestamp" : "AI reconstructs your lost timestamp from bone architecture"}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />

                    {/* Submit CTA — UPDATED COPY */}
                    <GlowCTA label="Scan My Face to Decode Timeline" icon={<Zap size={16} className="fill-current" />} />
                </motion.form>

                {/* Micro-copy */}
                <motion.p
                    className="text-[10px] text-white/15 mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    Free · No sign-up · 30 second analysis
                </motion.p>
            </div>
        </section>
    );
}

// ── Glow CTA Button (reusable) ──
export function GlowCTA({
    label,
    icon,
    onClick,
    type = "submit",
    className = "",
}: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    type?: "submit" | "button";
    className?: string;
}) {
    return (
        <motion.button
            type={type}
            onClick={() => {
                haptic.press();
                onClick?.();
            }}
            className={`group relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm text-white overflow-hidden ${className}`}
            style={{
                background: "linear-gradient(135deg, #8b5cf6, #a855f7, #d946ef)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            animate={{
                boxShadow: [
                    "0 4px 25px rgba(139,92,246,0.25)",
                    "0 8px 45px rgba(168,85,247,0.45)",
                    "0 4px 25px rgba(139,92,246,0.25)",
                ],
            }}
            transition={{
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
        >
            {/* Shimmer sweep */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
            />
            {icon && <span className="relative z-10">{icon}</span>}
            <span className="relative z-10">{label}</span>
            <ArrowRight size={16} className="relative z-10 transition-transform group-hover:translate-x-1" />
        </motion.button>
    );
}