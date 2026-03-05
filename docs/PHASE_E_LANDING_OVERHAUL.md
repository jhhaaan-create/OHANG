# 🚀 PHASE E: LANDING PAGE CVR MAXIMIZATION

> **Generated**: 2026-03-03
> **Target**: Claude Code Agent (automated execution)
> **Goal**: Transform `page.tsx` from a static feature showroom into a zero-friction conversion machine
> **Architecture**: Modular components in `src/components/landing/` assembled by `src/app/page.tsx`

---

## ARCHITECTURE OVERVIEW

```
src/app/page.tsx                          ← Thin SSR/CSR assembler (< 60 lines)
src/components/landing/
├── HeroSection.tsx                       ← [CRO 1,2,6,9] Zero-friction input + typewriter
├── LiveSocialTicker.tsx                  ← [CRO 3] Fake-realtime user activity marquee
├── ParallaxElements.tsx                  ← [CRO 4] Scroll-driven elemental particles
├── CliffhangerCards.tsx                  ← [CRO 5,6] Blurred result teaser cards
├── BottomCTA.tsx                         ← [CRO 6,7] Final conversion push
└── FloatingParticles.tsx                 ← [CRO 4] Ambient particle field (extracted)
```

### CRO Directive → Component Map

| # | Directive | Component | Notes |
|---|-----------|-----------|-------|
| 1 | Zero-Friction Input | HeroSection | Birth date form + selfie drop zone IN hero |
| 2 | Typewriter Preview | HeroSection | Terminal-style typing effect |
| 3 | Live Social Proof | LiveSocialTicker | "User X just matched with..." |
| 4 | Parallax Elements | ParallaxElements + FloatingParticles | Scroll-driven 오행 icons |
| 5 | Cliffhanger Teaser | CliffhangerCards | Blurred fake results |
| 6 | Micro-Interactions | All CTAs | Glow aura + haptic on hover/tap |
| 7 | Mood-Adaptive Theme | All components | Dark glassmorphism forced |
| 8 | Dynamic OG Meta | page.tsx metadata export | High-conversion copy |
| 9 | LCP Optimization | page.tsx SSR split | SSR shell + dynamic imports |
| 10 | Mobile-First | All components | iOS/Android safe areas |

---

## COMPONENT 1: HeroSection.tsx

**File**: `src/components/landing/HeroSection.tsx`
**CRO Directives**: #1 (Zero-Friction Input), #2 (Typewriter), #6 (Micro-Interactions), #10 (Mobile-First)

### Design Rationale
- The current page has a CTA button linking to `/analyze` — that's an extra click.
- New design: embed a compact birth-date input form AND a selfie upload drop zone directly in the hero.
- Submitting the form navigates to `/analyze?year=X&month=Y&day=Z` with prefilled data (zero re-entry).
- Selfie upload uses the existing `/api/upload` route and passes the blob URL as a query param.

```tsx
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
    "Reading the Four Pillars of your fate...",
    "Mapping your void element...",
];

export default function HeroSection() {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

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
                // Pause at full text, then start deleting
                setTimeout(() => setIsDeleting(true), pauseAtEnd);
            } else if (isDeleting && charIndex > 0) {
                setCharIndex((c) => c - 1);
            } else if (isDeleting && charIndex === 0) {
                setIsDeleting(false);
                setLineIndex((l) => (l + 1) % TYPEWRITER_LINES.length);
                // Small pause before next line
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
        if (year) params.set("year", year);
        if (month) params.set("month", month);
        if (day) params.set("day", day);
        if (imageUrl) params.set("imageUrl", imageUrl);
        router.push(`/analyze?${params.toString()}`);
    }, [router, imageUrl]);

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
                    <span className="text-[11px] text-white/40 tracking-wide">K-Saju + AI Vision</span>
                </motion.div>

                {/* Hook Phrase */}
                <motion.h1
                    className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] tracking-tight mb-3"
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <span className="text-white/90">Your face. Your birth.</span>
                    <br />
                    <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                        Your truth.
                    </span>
                </motion.h1>

                {/* Typewriter Terminal Line — CRO #2 */}
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

                {/* ═══ ZERO-FRICTION INPUT FORM — CRO #1 ═══ */}
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

                    {/* Selfie Upload Drop Zone — CRO #1 */}
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.12] transition-all group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                            {imageUrl ? (
                                <Camera size={16} className="text-emerald-400" />
                            ) : isUploading ? (
                                <motion.div
                                    className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                />
                            ) : (
                                <Upload size={16} className="text-white/25 group-hover:text-white/40 transition-colors" />
                            )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <span className="text-xs text-white/40 group-hover:text-white/55 transition-colors">
                                {imageUrl ? "Selfie uploaded ✓" : "Add selfie for Face Vision (optional)"}
                            </span>
                            <p className="text-[10px] text-white/15 mt-0.5 truncate">AI compensates for missing birth time</p>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        />
                    </div>

                    {/* Submit CTA — CRO #6: Glow + Haptic */}
                    <GlowCTA label="Decode My Soul Blueprint" icon={<Zap size={16} className="fill-current" />} />
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

// ── Glow CTA Button (reusable) — CRO #6 ──
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
```

---

## COMPONENT 2: LiveSocialTicker.tsx

**File**: `src/components/landing/LiveSocialTicker.tsx`
**CRO Directive**: #3 (Live Social Proof)

### Design Rationale
- Replace static stat marquee with "live" user activity messages.
- Fake-realtime events cycle every 3.5s with slide-up animation.
- Creates urgency + social validation ("others are doing this right now").

```tsx
// src/components/landing/LiveSocialTicker.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════
// Live Social Proof Ticker — CRO #3
// Simulates real-time user activity for social validation
// ═══════════════════════════════════════════════════════

const ELEMENTS = ["Fire", "Water", "Wood", "Metal", "Earth"] as const;
const ARCHETYPES = [
    "The Maverick", "The Oracle", "The Sentinel", "The Alchemist",
    "The Phoenix", "The Wanderer", "The Mirror", "The Catalyst",
    "The Sovereign", "The Mystic", "The Ironclad", "The Tidecaller",
] as const;

const TEMPLATES = [
    (n: number, a: string, e: string) => `User ${n} just matched with ${a} · ${e} Element`,
    (n: number, a: string, e: string) => `${a} discovered in Seoul · ${e} energy detected`,
    (n: number, _: string, e: string) => `User ${n} unlocked their Soul Blueprint · ${e}`,
    (n: number, a: string, _: string) => `New ${a} revealed · "This is scary accurate"`,
    (n: number, _: string, e: string) => `Couple chemistry scan complete · ${e} × Fire = 87%`,
    (n: number, a: string, _: string) => `Red Flag Radar activated · ${a} pattern detected`,
] as const;

function generateEvent(): string {
    const n = Math.floor(100 + Math.random() * 900);
    const a = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
    const e = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const t = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    return t(n, a, e);
}

const ELEMENT_DOTS: Record<string, string> = {
    Fire: "#f97316",
    Water: "#3b82f6",
    Wood: "#22c55e",
    Metal: "#a1a1aa",
    Earth: "#eab308",
};

function dotColorFromText(text: string): string {
    for (const [el, color] of Object.entries(ELEMENT_DOTS)) {
        if (text.includes(el)) return color;
    }
    return "#a78bfa";
}

export default function LiveSocialTicker() {
    const [event, setEvent] = useState(() => generateEvent());
    const [key, setKey] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setEvent(generateEvent());
            setKey((k) => k + 1);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const dotColor = dotColorFromText(event);

    return (
        <div className="relative py-3.5 overflow-hidden border-y border-white/[0.04] bg-white/[0.01]">
            <div className="max-w-lg mx-auto px-6 flex items-center justify-center gap-3 h-5">
                {/* Live pulse dot */}
                <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: dotColor }}
                    />
                    <span
                        className="relative inline-flex rounded-full h-2 w-2"
                        style={{ backgroundColor: dotColor }}
                    />
                </span>

                {/* Sliding text */}
                <div className="relative overflow-hidden flex-1 h-5">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={key}
                            className="absolute inset-0 flex items-center text-xs text-white/30 font-medium tracking-wide whitespace-nowrap"
                            initial={{ y: 16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -16, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {event}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* Counter */}
                <span className="text-[10px] text-white/15 font-mono tabular-nums flex-shrink-0">
                    LIVE
                </span>
            </div>
        </div>
    );
}
```

---

## COMPONENT 3: ParallaxElements.tsx

**File**: `src/components/landing/ParallaxElements.tsx`
**CRO Directive**: #4 (Parallax & Progressive Disclosure)

```tsx
// src/components/landing/ParallaxElements.tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// ═══════════════════════════════════════════════════════
// Parallax Five-Element Layer — CRO #4
// Elemental icons float at different parallax speeds
// on scroll, creating depth and premium feel.
// ═══════════════════════════════════════════════════════

const ELEMENTS = [
    { emoji: "🔥", x: "10%", baseY: 200,  speed: 0.6, size: 28, opacity: 0.12 },
    { emoji: "💧", x: "85%", baseY: 350,  speed: 0.4, size: 24, opacity: 0.10 },
    { emoji: "🌿", x: "70%", baseY: 150,  speed: 0.7, size: 22, opacity: 0.08 },
    { emoji: "⚙️", x: "20%", baseY: 500,  speed: 0.3, size: 20, opacity: 0.07 },
    { emoji: "🌊", x: "50%", baseY: 650,  speed: 0.5, size: 26, opacity: 0.09 },
    { emoji: "🔥", x: "90%", baseY: 800,  speed: 0.35, size: 18, opacity: 0.06 },
    { emoji: "🪨", x: "30%", baseY: 900,  speed: 0.55, size: 20, opacity: 0.08 },
    { emoji: "💧", x: "60%", baseY: 1100, speed: 0.45, size: 22, opacity: 0.07 },
];

export default function ParallaxElements() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();

    return (
        <div ref={ref} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {ELEMENTS.map((el, i) => (
                <ParallaxItem key={i} el={el} scrollYProgress={scrollYProgress} />
            ))}
        </div>
    );
}

function ParallaxItem({
    el,
    scrollYProgress,
}: {
    el: typeof ELEMENTS[number];
    scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
    const y = useTransform(
        scrollYProgress,
        [0, 1],
        [el.baseY, el.baseY - el.speed * 600]
    );

    return (
        <motion.div
            className="absolute"
            style={{
                left: el.x,
                y,
                fontSize: el.size,
                opacity: el.opacity,
                filter: "blur(1px)",
            }}
        >
            {el.emoji}
        </motion.div>
    );
}
```

---

## COMPONENT 4: CliffhangerCards.tsx

**File**: `src/components/landing/CliffhangerCards.tsx`
**CRO Directives**: #5 (Cliffhanger Teaser), #6 (Micro-Interactions), #7 (Dark Glassmorphism)

### Design Rationale
- Show FAKE result cards for Red Flag Radar and Couple Face Scan.
- Critical text is blurred (CSS `filter: blur(6px)`) — creates irresistible curiosity.
- Each card has a "Unlock Result" CTA linking to the feature page.

```tsx
// src/components/landing/CliffhangerCards.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AlertTriangle, Heart, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Cliffhanger Cards — CRO #5
// Fake result previews with blurred reveals to drive
// curiosity-gap conversions. "The Reveal" pattern.
// ═══════════════════════════════════════════════════════

interface CliffhangerCard {
    icon: typeof AlertTriangle;
    title: string;
    subtitle: string;
    color: string;
    href: string;
    fakeScore: number;
    fakeLabel: string;
    blurredText: string;
    ctaLabel: string;
}

const CARDS: CliffhangerCard[] = [
    {
        icon: AlertTriangle,
        title: "Red Flag Radar",
        subtitle: "Relationship Pattern Detection",
        color: "#ef4444",
        href: "/features/red-flag",
        fakeScore: 73,
        fakeLabel: "RED",
        blurredText: "Your partner's Metal clashes with your Fire. The 3rd flag reveals a recurring abandonment pattern that...",
        ctaLabel: "Scan Your Relationship",
    },
    {
        icon: Heart,
        title: "Couple Face Scan",
        subtitle: "Visual Chemistry Analysis",
        color: "#ec4899",
        href: "/features/couple-scan",
        fakeScore: 84,
        fakeLabel: "HIGH CHEMISTRY",
        blurredText: "Your spouse palaces show rare Mirror alignment. The facial element dynamic suggests deep karmic...",
        ctaLabel: "Upload Two Photos",
    },
];

export default function CliffhangerCards() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.15 });

    return (
        <section ref={ref} className="py-16 px-5">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                >
                    <h2 className="text-xl sm:text-2xl font-bold text-white/85 mb-2">
                        See what others are discovering
                    </h2>
                    <p className="text-xs text-white/30">
                        Real analysis previews — your results are waiting
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {CARDS.map((card, i) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.15 * i }}
                        >
                            <CliffCard card={card} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CliffCard({ card }: { card: CliffhangerCard }) {
    const Icon = card.icon;

    return (
        <div
            className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
            style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))",
                backdropFilter: "blur(16px)",
            }}
        >
            {/* Header */}
            <div className="p-5 pb-3">
                <div className="flex items-center gap-2.5 mb-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${card.color}12`, border: `1px solid ${card.color}18` }}
                    >
                        <Icon size={14} style={{ color: card.color }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white/75">{card.title}</h3>
                        <p className="text-[10px] text-white/25">{card.subtitle}</p>
                    </div>
                </div>

                {/* Fake Score Ring (mini) */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-12 h-12">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                            <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke={card.color}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - card.fakeScore / 100)}`}
                                style={{ filter: `drop-shadow(0 0 4px ${card.color}40)` }}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: card.color }}>
                            {card.fakeScore}
                        </span>
                    </div>
                    <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide"
                        style={{ backgroundColor: `${card.color}10`, color: card.color, border: `1px solid ${card.color}20` }}
                    >
                        {card.fakeLabel}
                    </span>
                </div>
            </div>

            {/* Blurred Insight — THE CLIFFHANGER */}
            <div className="px-5 pb-3">
                <p
                    className="text-sm text-white/50 leading-relaxed"
                    style={{
                        filter: "blur(5px)",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                    }}
                >
                    {card.blurredText}
                </p>
            </div>

            {/* Lock Overlay + CTA */}
            <div className="px-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                    <Lock size={12} className="text-white/20" />
                    <span className="text-[10px] text-white/20">Full analysis locked</span>
                </div>

                <Link href={card.href}>
                    <motion.button
                        onClick={() => haptic.press()}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                        style={{
                            backgroundColor: `${card.color}12`,
                            color: card.color,
                            border: `1px solid ${card.color}18`,
                        }}
                        whileHover={{
                            backgroundColor: `${card.color}20`,
                            boxShadow: `0 0 20px ${card.color}15`,
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {card.ctaLabel}
                        <ArrowRight size={12} />
                    </motion.button>
                </Link>
            </div>
        </div>
    );
}
```

---

## COMPONENT 5: BottomCTA.tsx

**File**: `src/components/landing/BottomCTA.tsx`
**CRO Directives**: #6 (Micro-Interactions), #7 (Mood-Adaptive)

```tsx
// src/components/landing/BottomCTA.tsx
"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Bottom CTA — Final conversion push before footer
// ═══════════════════════════════════════════════════════

export default function BottomCTA() {
    return (
        <section className="py-20 px-6">
            <motion.div
                className="max-w-md mx-auto text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white/90">
                    Ready to decode your destiny?
                </h2>
                <p className="text-sm text-white/30 mb-8">
                    Free archetype analysis · No sign-up required
                </p>
                <Link href="/analyze">
                    <motion.button
                        onClick={() => haptic.press()}
                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm bg-white/[0.06] text-white/80 border border-white/[0.08] transition-all"
                        whileHover={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                            boxShadow: "0 0 30px rgba(139,92,246,0.15)",
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <Sparkles size={16} /> Start Free Analysis
                    </motion.button>
                </Link>
            </motion.div>
        </section>
    );
}
```

---

## COMPONENT 6: FloatingParticles.tsx (Extracted)

**File**: `src/components/landing/FloatingParticles.tsx`
**CRO Directive**: #4 (Ambient visual)

```tsx
// src/components/landing/FloatingParticles.tsx
"use client";

import { motion } from "framer-motion";

// ═══════════════════════════════════════════════════════
// Floating Particles — Ambient decoration layer
// Extracted from page.tsx for modularity
// ═══════════════════════════════════════════════════════

export default function FloatingParticles() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: 24 }).map((_, i) => {
                const size = 1.5 + (i % 4);
                const left = (i * 37 + 13) % 100;
                const top = (i * 53 + 7) % 100;
                const duration = 18 + (i % 8) * 4;
                const delay = (i * 0.5) % 6;

                const colors = [
                    "rgba(139,92,246,0.12)",
                    "rgba(168,85,247,0.08)",
                    "rgba(236,72,153,0.06)",
                    "rgba(59,130,246,0.08)",
                ];

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: size,
                            height: size,
                            left: `${left}%`,
                            top: `${top}%`,
                            backgroundColor: colors[i % colors.length],
                        }}
                        animate={{
                            y: [0, -25, 0],
                            opacity: [0.2, 0.6, 0.2],
                        }}
                        transition={{
                            duration,
                            delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                );
            })}
        </div>
    );
}
```

---

## ASSEMBLER: page.tsx (Rewrite)

**File**: `src/app/page.tsx`
**CRO Directives**: #8 (Dynamic OG Meta), #9 (LCP Optimization), #10 (Mobile-First)

### Design Rationale
- `page.tsx` becomes a thin SSR assembler with **exported metadata** (OG tags).
- Heavy client components are dynamically imported to optimize LCP.
- ParallaxElements + FloatingParticles are `dynamic(() => ..., { ssr: false })` to prevent server-side render of scroll-dependent code.

```tsx
// src/app/page.tsx
import type { Metadata } from "next";
import dynamic from "next/dynamic";

// ═══════════════════════════════════════════════════════
// OHANG Landing Page — CVR-Maximized Assembler
//
// Architecture: SSR metadata shell + dynamic client components
// CRO #8: High-conversion OG metadata
// CRO #9: LCP < 1s via dynamic imports
// ═══════════════════════════════════════════════════════

// ── OG Metadata — CRO #8 ──
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ohang.app";

export const metadata: Metadata = {
    title: "OHANG — Your Face. Your Birth. Your Truth.",
    description:
        "AI decodes your soul blueprint from birth data + face scan. 518,400 unique destiny profiles. Free instant analysis.",
    openGraph: {
        title: "Your Face. Your Birth. Your Truth. | OHANG",
        description:
            "518,400 unique destiny profiles. AI-powered K-Saju analysis + face reading. Discover your archetype in 30 seconds.",
        url: BASE_URL,
        siteName: "OHANG",
        images: [
            {
                url: `${BASE_URL}/api/og?mode=landing`,
                width: 1200,
                height: 630,
                alt: "OHANG — Five Element Intelligence",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Your Face. Your Birth. Your Truth. | OHANG",
        description:
            "518,400 unique profiles. AI decodes your soul blueprint. Free.",
        images: [`${BASE_URL}/api/og?mode=landing`],
    },
};

// ── Dynamic Client Components — CRO #9 (LCP Optimization) ──
// SSR: false for scroll-dependent / heavy animation components
const HeroSection = dynamic(
    () => import("@/components/landing/HeroSection"),
    { ssr: true } // Hero must SSR for LCP
);
const LiveSocialTicker = dynamic(
    () => import("@/components/landing/LiveSocialTicker"),
    { ssr: false }
);
const CliffhangerCards = dynamic(
    () => import("@/components/landing/CliffhangerCards"),
    { ssr: false }
);
const BottomCTA = dynamic(
    () => import("@/components/landing/BottomCTA"),
    { ssr: false }
);
const FloatingParticles = dynamic(
    () => import("@/components/landing/FloatingParticles"),
    { ssr: false }
);
const ParallaxElements = dynamic(
    () => import("@/components/landing/ParallaxElements"),
    { ssr: false }
);

// ── Page Assembly ──
export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
            {/* Fixed background layers */}
            <FloatingParticles />
            <ParallaxElements />

            {/* Content stack */}
            <div className="relative z-10">
                <HeroSection />
                <LiveSocialTicker />
                <CliffhangerCards />
                <BottomCTA />
            </div>
        </div>
    );
}
```

**CRITICAL**: This file is a **Server Component** (no `"use client"` directive). This enables `export const metadata` for SSR OG tags. All interactive components are imported via `dynamic()`.

---

## FILE MANIFEST

| # | Action | File Path |
|---|--------|-----------|
| 1 | CREATE | `src/components/landing/HeroSection.tsx` |
| 2 | CREATE | `src/components/landing/LiveSocialTicker.tsx` |
| 3 | CREATE | `src/components/landing/ParallaxElements.tsx` |
| 4 | CREATE | `src/components/landing/CliffhangerCards.tsx` |
| 5 | CREATE | `src/components/landing/BottomCTA.tsx` |
| 6 | CREATE | `src/components/landing/FloatingParticles.tsx` |
| 7 | REWRITE | `src/app/page.tsx` — SSR assembler with OG metadata |

## DEPENDENCY CHECK

All dependencies already installed — no `npm install` required.

## CRO COVERAGE VERIFICATION

| # | Directive | Status | Component |
|---|-----------|--------|-----------|
| 1 | Zero-Friction Input | ✅ | HeroSection (birth form + selfie in hero) |
| 2 | Typewriter Preview | ✅ | HeroSection (cycling terminal text) |
| 3 | Live Social Proof | ✅ | LiveSocialTicker (fake-realtime events) |
| 4 | Parallax Elements | ✅ | ParallaxElements + FloatingParticles |
| 5 | Cliffhanger Teaser | ✅ | CliffhangerCards (blurred fake results) |
| 6 | Micro-Interactions | ✅ | GlowCTA, haptic on all buttons |
| 7 | Mood-Adaptive Theme | ✅ | Dark glassmorphism forced on all components |
| 8 | Dynamic OG Meta | ✅ | page.tsx `export const metadata` |
| 9 | LCP Optimization | ✅ | SSR shell + `dynamic()` imports |
| 10 | Mobile-First | ✅ | All padding/type in mobile units, `100dvh`, safe-area |

---

## EXECUTION COMMAND

```bash
mkdir -p src/components/landing
```

Then apply each file from the code blocks above in manifest order (1→7).
