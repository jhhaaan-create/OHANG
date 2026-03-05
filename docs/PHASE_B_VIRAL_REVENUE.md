# 🚀 PHASE B: VIRAL REVENUE — UI & Payment Wiring

> **Generated**: 2026-02-26
> **Target**: Claude Code Agent (automated execution)
> **Stack**: Next.js 14 App Router · Tailwind · shadcn/ui · Framer Motion
> **Constraints**: Mobile-first, dark mode (#0F0F1A), reuse CelestialLoading & TypewriterText

---

## MISSION 1: ShareViralButton Component

**File**: `src/components/ui/ShareViralButton.tsx`
**Purpose**: Universal share button for ALL result pages — Web Share API → Blob download → clipboard fallback with toast.

### Dependencies
- `framer-motion` (animation)
- `lucide-react` (icons: Share2, Download, Copy, Check, X)
- `sonner` (toast notifications)
- `@/lib/sharing/shareUtils` (existing `share()`, `copyToClipboard()`)
- `@/lib/haptics` (existing haptic module)

### Full Implementation

```tsx
// src/components/ui/ShareViralButton.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Download, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { share, copyToClipboard, type SharePayload } from "@/lib/sharing/shareUtils";
import haptic from "@/lib/haptics";

interface ShareViralButtonProps {
    /** For Web Share API and clipboard */
    payload: SharePayload;
    /** OG image URL for Blob download (e.g., /api/og/chemistry?...) */
    ogImageUrl?: string;
    /** Visual variant */
    variant?: "default" | "compact" | "cta";
    locale?: "ko" | "en";
    className?: string;
}

type ShareMode = "idle" | "sharing" | "success";

export default function ShareViralButton({
    payload,
    ogImageUrl,
    variant = "default",
    locale = "ko",
    className = "",
}: ShareViralButtonProps) {
    const [mode, setMode] = useState<ShareMode>("idle");
    const [showMenu, setShowMenu] = useState(false);

    const labels = {
        share: locale === "ko" ? "공유하기" : "Share",
        download: locale === "ko" ? "이미지 저장" : "Save Image",
        copy: locale === "ko" ? "링크 복사" : "Copy Link",
        copied: locale === "ko" ? "복사됨!" : "Copied!",
        saved: locale === "ko" ? "저장됨!" : "Saved!",
    };

    // ── Primary: Web Share API ──
    const handleNativeShare = useCallback(async () => {
        haptic.press();
        setMode("sharing");
        try {
            await share(payload);
            setMode("success");
            setTimeout(() => setMode("idle"), 2000);
        } catch {
            // User cancelled — silently reset
            setMode("idle");
        }
        setShowMenu(false);
    }, [payload]);

    // ── Fallback 1: Download OG Image as Blob ──
    const handleDownloadImage = useCallback(async () => {
        if (!ogImageUrl) return;
        haptic.tap();
        setMode("sharing");
        try {
            const res = await fetch(ogImageUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ohang-result.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(labels.saved);
            setMode("success");
        } catch {
            toast.error("Download failed. Try copying the link instead.");
            setMode("idle");
        }
        setTimeout(() => setMode("idle"), 2000);
        setShowMenu(false);
    }, [ogImageUrl, labels.saved]);

    // ── Fallback 2: Copy to Clipboard ──
    const handleCopyLink = useCallback(async () => {
        haptic.tap();
        await copyToClipboard(`${payload.text}\n${payload.url}`);
        toast.success(labels.copied);
        setMode("success");
        setTimeout(() => setMode("idle"), 2000);
        setShowMenu(false);
    }, [payload, labels.copied]);

    // ── CTA variant: big gradient button ──
    if (variant === "cta") {
        return (
            <div className={`relative ${className}`}>
                <motion.button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-full py-3.5 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white border border-white/10 shadow-lg shadow-violet-500/10"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <AnimatePresence mode="wait">
                        {mode === "success" ? (
                            <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                                <Check size={16} /> {labels.copied}
                            </motion.span>
                        ) : (
                            <motion.span key="share" className="flex items-center gap-2">
                                <Share2 size={16} /> {labels.share}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* Dropdown menu */}
                <AnimatePresence>
                    {showMenu && (
                        <ShareDropdown
                            onNativeShare={handleNativeShare}
                            onDownload={ogImageUrl ? handleDownloadImage : undefined}
                            onCopyLink={handleCopyLink}
                            onClose={() => setShowMenu(false)}
                            labels={labels}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ── Compact variant: icon-only ──
    if (variant === "compact") {
        return (
            <motion.button
                onClick={handleNativeShare}
                className={`p-2 rounded-lg bg-white/5 text-white/50 hover:text-white/80 transition-colors ${className}`}
                whileTap={{ scale: 0.9 }}
            >
                {mode === "success" ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            </motion.button>
        );
    }

    // ── Default variant ──
    return (
        <div className={`relative ${className}`}>
            <motion.button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/50 border border-white/10 hover:brightness-110 active:scale-[0.97] transition-all"
                whileTap={{ scale: 0.97 }}
            >
                {mode === "success" ? (
                    <><Check size={14} className="text-emerald-400" /> {labels.copied}</>
                ) : (
                    <><Share2 size={14} /> {labels.share}</>
                )}
            </motion.button>

            <AnimatePresence>
                {showMenu && (
                    <ShareDropdown
                        onNativeShare={handleNativeShare}
                        onDownload={ogImageUrl ? handleDownloadImage : undefined}
                        onCopyLink={handleCopyLink}
                        onClose={() => setShowMenu(false)}
                        labels={labels}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Shared Dropdown ──
function ShareDropdown({
    onNativeShare,
    onDownload,
    onCopyLink,
    onClose,
    labels,
}: {
    onNativeShare: () => void;
    onDownload?: () => void;
    onCopyLink: () => void;
    onClose: () => void;
    labels: Record<string, string>;
}) {
    return (
        <>
            {/* Backdrop */}
            <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <motion.div
                className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-xl bg-[#1a1a2e] border border-white/10 p-2 shadow-xl min-w-[200px]"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
            >
                <button onClick={onNativeShare} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 transition-colors">
                    <Share2 size={14} /> {labels.share}
                </button>
                {onDownload && (
                    <button onClick={onDownload} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 transition-colors">
                        <Download size={14} /> {labels.download}
                    </button>
                )}
                <button onClick={onCopyLink} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 transition-colors">
                    <Copy size={14} /> {labels.copy}
                </button>
            </motion.div>
        </>
    );
}
```

### Integration Points
- Every result page imports `ShareViralButton` and passes `payload` + optional `ogImageUrl`
- `ogImageUrl` is built using `buildOgUrl()` from `@/lib/sharing/shareUtils`
- Toast via `sonner` (already installed, see `src/components/ui/sonner.tsx`)

---

## MISSION 2: Red Flag Radar — Full Feature Page

### 2A. Feature Page

**File**: `src/app/features/red-flag/page.tsx`

```tsx
// src/app/features/red-flag/page.tsx
"use client";

import { useState, useMemo } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RedFlagSchema } from "@/lib/ai/schemas";
import RedFlagResult from "@/components/red-flag/organisms/RedFlagResult";
import { CelestialLoading } from "@/components/celestial/CelestialLoading";
import ShareViralButton from "@/components/ui/ShareViralButton";
import { PaywallGate } from "@/components/paywall/PaywallGate";
import { useTheme } from "@/lib/context/ThemeContext";
import { triggerElementalHaptic } from "@/lib/utils/haptic";
import { buildShareUrl } from "@/lib/sharing/shareUtils";

type Step = "input" | "loading" | "paywall" | "result";

export default function RedFlagPage() {
    const [step, setStep] = useState<Step>("input");
    const [resultId, setResultId] = useState<string | null>(null);
    const { element } = useTheme();

    // ── Form State ──
    const [myData, setMyData] = useState({ year: "", month: "", day: "", hour: "", minute: "", gender: "male" });
    const [partnerData, setPartnerData] = useState({ year: "", month: "", day: "", hour: "", minute: "", gender: "female" });
    const [tone, setTone] = useState<"savage" | "balanced" | "gentle">("balanced");

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
                            onPhaseChange={(id) => triggerElementalHaptic(id)}
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
                        <RedFlagResult
                            data={object}
                            isStreaming={isLoading}
                            locale="en"
                        />

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
```

### 2B. Red Flag API Route — Patch Required

The existing `/api/analyze/red-flag/route.ts` does not yet exist. It needs the same pattern as `retro-mode/route.ts` but with `user` + `partner` fields.

**File**: `src/app/api/analyze/red-flag/route.ts`

```ts
// src/app/api/analyze/red-flag/route.ts
import { z } from 'zod';
import { SajuEngine } from '@/lib/saju/engine';
import { formatChartToAiContext } from '@/lib/saju/adapter';
import {
    checkRateLimit,
    generateCacheKey,
    getCachedResult,
    logUsage,
    getAuthenticatedUser,
    resolveUserId,
} from '@/lib/ai/cache';
import { OhangEngine } from '@/lib/ai/engine';

// ═══════════════════════════════════════════════════════
// OHANG API — Red Flag Radar (Relationship Pattern Detection)
// Requires: User + Partner birth data
// ═══════════════════════════════════════════════════════

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const PersonSchema = z.object({
    year: z.number().int(),
    month: z.number().int(),
    day: z.number().int(),
    hour: z.number().int().optional().nullable(),
    minute: z.number().int().optional().nullable(),
    gender: z.enum(['male', 'female']),
});

const RequestSchema = z.object({
    user: PersonSchema,
    partner: PersonSchema,
    tone: z.enum(['savage', 'balanced', 'gentle']).default('balanced'),
});

function computeContext(person: z.infer<typeof PersonSchema>) {
    const isUnknownTime = person.hour === null || person.hour === undefined;
    const chart = SajuEngine.compute({
        year: person.year,
        month: person.month,
        day: person.day,
        hour: isUnknownTime ? 12 : (person.hour ?? 12),
        minute: isUnknownTime ? 0 : (person.minute ?? 0),
        gender: person.gender,
    });
    return formatChartToAiContext(chart, { isUnknownTime });
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const auth = await getAuthenticatedUser(req);
        const userId = resolveUserId(auth, req);

        const { user, partner, tone } = RequestSchema.parse(json);

        await checkRateLimit(userId, 'red_flag', false);

        const ctxUser = computeContext(user);
        const ctxPartner = computeContext(partner);

        const cacheKey = generateCacheKey('red_flag', {
            user: ctxUser, partner: ctxPartner, tone,
        });

        const cachedData = await getCachedResult(cacheKey);
        if (cachedData) {
            await logUsage(userId, 'red_flag');
            return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }

        const result = await OhangEngine.streamRedFlag(ctxUser, ctxPartner, {
            userId, cacheKey, tone,
        });
        return result.toTextStreamResponse({ headers: { 'X-Cache': 'MISS' } });

    } catch (error) {
        console.error('[RedFlag API]', error);

        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({ error: 'Invalid input format.' }), { status: 400 });
        }

        const message = error instanceof Error ? error.message : 'System Error';
        const isRateLimit = message.includes('Rate Limit');
        const isTimeout = message.includes('TIMEOUT') || message.includes('timed out');

        return new Response(
            JSON.stringify({
                error: isTimeout
                    ? 'Destiny is re-aligning. Please try again in a moment.'
                    : message,
            }),
            { status: isRateLimit ? 429 : isTimeout ? 504 : 500 }
        );
    }
}
```

### 2C. Engine Method Required

Add `streamRedFlag` to `src/lib/ai/engine.ts` (inside the `OhangEngine` class):

```ts
// Add to OhangEngine class in src/lib/ai/engine.ts
static async streamRedFlag(
    userContext: OHANGContext,
    partnerContext: OHANGContext,
    options: EngineOptions & { tone?: string }
) {
    const prompt = buildPrompt(RED_FLAG_RADAR_PROMPT, {
        user_context: JSON.stringify(userContext),
        partner_context: JSON.stringify(partnerContext),
        tone: options.tone ?? 'balanced',
    });

    return streamObject({
        model: resolveModel(options.tier),
        schema: RedFlagSchema,
        prompt,
        onFinish: createFinishHandler(options),
    });
}
```

**Import required**: Add `RED_FLAG_RADAR_PROMPT` from `@/lib/ai/prompts/specialModes` and `RedFlagSchema` from `@/lib/ai/schemas` to the engine imports.

---

## MISSION 3: Couple Face Scan — Full Feature Page

### 3A. Feature Page

**File**: `src/app/features/couple-scan/page.tsx`

```tsx
// src/app/features/couple-scan/page.tsx
"use client";

import { useState, useRef, useMemo } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Heart, ArrowLeft, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CoupleFaceScanSchema } from "@/lib/ai/schemas";
import { CelestialLoading } from "@/components/celestial/CelestialLoading";
import ShareViralButton from "@/components/ui/ShareViralButton";
import { StreamingTypewriter } from "@/components/ui/TypewriterText";
import { triggerElementalHaptic } from "@/lib/utils/haptic";
import { buildShareUrl } from "@/lib/sharing/shareUtils";

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
                            onPhaseChange={(id) => triggerElementalHaptic(id)}
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
                    <CoupleScanResult data={object} isStreaming={isLoading} sharePayload={sharePayload} onReset={() => setStep("input")} />
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
                            <span className="text-lg mb-1 block">{i === 0 ? "👤" : "👤"}</span>
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
```

---

## MISSION 4: Retro Mode — Full Feature Page

**File**: `src/app/features/retro-mode/page.tsx`

```tsx
// src/app/features/retro-mode/page.tsx
"use client";

import { useState, useMemo } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Rewind, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

import { RetroModeSchema } from "@/lib/ai/schemas";
import { CelestialLoading } from "@/components/celestial/CelestialLoading";
import ShareViralButton from "@/components/ui/ShareViralButton";
import { StreamingTypewriter } from "@/components/ui/TypewriterText";
import { triggerElementalHaptic } from "@/lib/utils/haptic";

type Step = "input" | "loading" | "result";

export default function RetroModePage() {
    const [step, setStep] = useState<Step>("input");
    const [myData, setMyData] = useState({ year: "", month: "", day: "", hour: "", minute: "", gender: "male" });
    const [exData, setExData] = useState({ year: "", month: "", day: "", hour: "", minute: "", gender: "female" });
    const [tone, setTone] = useState<"savage" | "balanced" | "gentle">("savage");

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
                            onPhaseChange={(id) => triggerElementalHaptic(id)}
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
                    <RetroResult data={object} isStreaming={isLoading} sharePayload={sharePayload} onReset={() => setStep("input")} />
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
```

---

## MISSION 5: Celebrity Match — Free Viral Hook

**File**: `src/app/features/celeb-match/page.tsx`

```tsx
// src/app/features/celeb-match/page.tsx
"use client";

import { useState, useRef, useMemo } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Upload, ArrowLeft, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CelebMatchSchema } from "@/lib/ai/schemas";
import { CelestialLoading } from "@/components/celestial/CelestialLoading";
import ShareViralButton from "@/components/ui/ShareViralButton";
import { StreamingTypewriter } from "@/components/ui/TypewriterText";
import { triggerElementalHaptic } from "@/lib/utils/haptic";

type Step = "input" | "loading" | "result";

export default function CelebMatchPage() {
    const [step, setStep] = useState<Step>("input");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Optional saju for richer results
    const [showSaju, setShowSaju] = useState(false);
    const [sajuData, setSajuData] = useState({ year: "", month: "", day: "", hour: "", minute: "", gender: "male" });
    const [tone, setTone] = useState<"savage" | "balanced" | "gentle">("balanced");

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
                            onPhaseChange={(id) => triggerElementalHaptic(id)}
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
                    <CelebResult data={object} isStreaming={isLoading} sharePayload={sharePayload} onReset={() => setStep("input")} />
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
```

---

## CROSS-CUTTING: Middleware & Navigation Updates

### A. Middleware — Add Feature Routes to Unguarded Paths

**File**: `src/middleware.ts`
**Action**: Add to `UNGUARDED_PATHS` array:

```ts
// Add these to UNGUARDED_PATHS in src/middleware.ts
'/api/analyze/red-flag',
'/features/red-flag',
'/features/couple-scan',
'/features/retro-mode',
'/features/celeb-match',
```

### B. Homepage Feature Grid (Optional Enhancement)

If the homepage has a feature grid or navigation, add cards pointing to the new feature pages:

```tsx
// Feature links to add to homepage navigation
const FEATURES = [
    { href: "/features/celeb-match", icon: "⭐", label: "Celebrity Match", badge: "FREE", color: "yellow" },
    { href: "/features/red-flag", icon: "🚩", label: "Red Flag Radar", badge: "$2.99", color: "red" },
    { href: "/features/couple-scan", icon: "💕", label: "Couple Scan", badge: "$2.99", color: "pink" },
    { href: "/features/retro-mode", icon: "⏪", label: "Retro Mode", badge: "$1.99", color: "blue" },
];
```

---

## FILE MANIFEST

| # | Action | File Path |
|---|--------|-----------|
| 1 | CREATE | `src/components/ui/ShareViralButton.tsx` |
| 2 | CREATE | `src/app/features/red-flag/page.tsx` |
| 3 | CREATE | `src/app/api/analyze/red-flag/route.ts` |
| 4 | CREATE | `src/app/features/couple-scan/page.tsx` |
| 5 | CREATE | `src/app/features/retro-mode/page.tsx` |
| 6 | CREATE | `src/app/features/celeb-match/page.tsx` |
| 7 | PATCH  | `src/lib/ai/engine.ts` — add `streamRedFlag()` method |
| 8 | PATCH  | `src/middleware.ts` — add feature routes to UNGUARDED_PATHS |

## DEPENDENCY CHECK

All dependencies already installed:
- `framer-motion` ✅
- `lucide-react` ✅
- `sonner` ✅
- `@ai-sdk/react` ✅
- `zod` ✅
- `next/image` ✅

No new `npm install` required.

---

## EXECUTION COMMAND

Copy-paste this single command into Claude Code terminal:

```bash
mkdir -p src/app/features/red-flag src/app/features/couple-scan src/app/features/retro-mode src/app/features/celeb-match src/app/api/analyze/red-flag
```

Then apply each file from the code blocks above in order (1→8).
