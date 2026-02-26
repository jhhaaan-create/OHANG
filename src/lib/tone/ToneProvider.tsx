"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════
// OHANG Tone Provider — 3-Mode Voice System
//
// Tones: savage | balanced | gentle
// Persisted in localStorage. Provides tone to all features.
// ═══════════════════════════════════════════════════════

export type Tone = "savage" | "balanced" | "gentle";

interface ToneContextType {
    tone: Tone;
    setTone: (tone: Tone) => void;
    cycleTone: () => void;
    toneLabel: string;
    toneEmoji: string;
}

const TONE_META: Record<Tone, { label: string; emoji: string }> = {
    savage: { label: "매운맛", emoji: "🔥" },
    balanced: { label: "중간맛", emoji: "⚖️" },
    gentle: { label: "순한맛", emoji: "🌿" },
};

const CYCLE_ORDER: Tone[] = ["balanced", "savage", "gentle"];

const ToneContext = createContext<ToneContextType | null>(null);

function getStoredTone(): Tone {
    if (typeof window === "undefined") return "balanced";
    const stored = localStorage.getItem("ohang-tone");
    if (stored === "savage" || stored === "balanced" || stored === "gentle") return stored;
    return "balanced";
}

export function ToneProvider({ children }: { children: React.ReactNode }) {
    const [tone, setToneRaw] = useState<Tone>(getStoredTone);

    const setTone = useCallback((t: Tone) => {
        setToneRaw(t);
        if (typeof window !== "undefined") {
            localStorage.setItem("ohang-tone", t);
        }
    }, []);

    const cycleTone = useCallback(() => {
        setTone(CYCLE_ORDER[(CYCLE_ORDER.indexOf(tone) + 1) % 3]);
    }, [tone, setTone]);

    const value = useMemo<ToneContextType>(() => ({
        tone,
        setTone,
        cycleTone,
        toneLabel: TONE_META[tone].label,
        toneEmoji: TONE_META[tone].emoji,
    }), [tone, setTone, cycleTone]);

    return (
        <ToneContext.Provider value={value}>
            {children}
        </ToneContext.Provider>
    );
}

export function useTone(): ToneContextType {
    const ctx = useContext(ToneContext);
    if (!ctx) throw new Error("useTone must be used within ToneProvider");
    return ctx;
}
