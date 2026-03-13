/**
 * ANALYZE PAGE — Sprint 1 Integration Example
 *
 * Shows how all Sprint 1 components connect:
 * 1. CelestialLoading → shown while AI streams
 * 2. TypewriterText → character-by-character reveal
 * 3. PaywallGate → blur premium sections
 * 4. ScrollReveal → progressive disclosure on scroll
 * 5. MoodTheme → auto-tint when void element is known
 * 6. Haptic → feedback on key moments
 *
 * NOTE: This is an INTEGRATION GUIDE, not a direct replacement.
 * Adapt to your existing analyze/page.tsx structure.
 */
"use client";

import { useState, useEffect } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { ArchetypeAnalysisSchema } from "@/lib/ai/schemas";
import { useMoodTheme } from "@/providers/MoodThemeProvider";
import CelestialLoading from "@/components/celestial/CelestialLoading";
import { StreamingTypewriter } from "@/components/ui/TypewriterText";
import PaywallGate from "@/components/paywall/PaywallGate";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { MoodCard, MoodAccent } from "@/providers/MoodThemeProvider";
import haptic from "@/lib/haptics";

// ── Types (from your existing schemas) ───────────────────
type AnalysisPhase = "idle" | "loading" | "streaming" | "complete";
type Tone = "savage" | "balanced" | "gentle";
type PaywallTier = "free" | "basic" | "pro" | "destiny";

interface BirthData {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
}

// ── Main Component ───────────────────────────────────────
export default function AnalyzePageExample() {
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [tone] = useState<Tone>("balanced");
  const [userTier] = useState<PaywallTier>("free");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { setElement } = useMoodTheme();

  // Simulated birth data (replace with your form)
  const [birthData] = useState<BirthData>({
    year: 1995,
    month: 3,
    day: 15,
    hour: 14,
    isLunar: false,
  });

  // ── AI Streaming Hook ────────────────────────────────
  const { object, submit, isLoading, error } = useObject({
    api: "/api/analyze/archetype",
    schema: ArchetypeAnalysisSchema,
  });

  // ── Phase Management ─────────────────────────────────
  useEffect(() => {
    if (isLoading && !object) {
      setPhase("loading");
    } else if (isLoading && object) {
      setPhase("streaming");
    } else if (object && !isLoading) {
      setPhase("complete");
    }
  }, [isLoading, object]);

  // ── Loading Progress Simulation ──────────────────────
  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Set Mood Theme when element is known ─────────────
  useEffect(() => {
    const result = object as Record<string, unknown> | undefined;
    const element = result?.day_master_element as string | undefined;
    if (element) {
      setElement(element as Parameters<typeof setElement>[0]);
      haptic.destiny(); // The moment of revelation
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(object as Record<string, unknown> | undefined)?.day_master_element]);

  // ── Start Analysis ───────────────────────────────────
  const handleAnalyze = () => {
    haptic.press();
    setLoadingProgress(0);
    submit({
      birthData,
      tone,
    });
  };

  // ── Cast streaming object for safe access ────────────
  const result = object as Record<string, unknown> | undefined;

  return (
    <div className="min-h-screen">
      {/* ═══ CELESTIAL LOADING ═══════════════════════════ */}
      {phase === "loading" && (
        <CelestialLoading
          progress={loadingProgress}
          isComplete={phase !== "loading"}
          onComplete={() => setLoadingProgress(100)}
        />
      )}

      {/* ═══ IDLE STATE (Form) ═══════════════════════════ */}
      {phase === "idle" && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <h1 className="text-3xl font-serif font-semibold mb-4">
            Discover Your Element
          </h1>
          <p className="text-white/50 text-center mb-8 max-w-xs">
            Enter your birth details and let the Five Forces reveal who you
            truly are.
          </p>
          {/* Your birth date form goes here */}
          <button
            onClick={handleAnalyze}
            className="px-8 py-3 rounded-xl font-medium text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, var(--ohang-accent, #a78bfa), var(--ohang-accent, #a78bfa)88)",
              boxShadow: "0 4px 24px var(--ohang-accent, #a78bfa)40",
            }}
          >
            Read My Chart
          </button>
        </div>
      )}

      {/* ═══ STREAMING / COMPLETE STATE ═══════════════════ */}
      {(phase === "streaming" || phase === "complete") && (
        <div className="max-w-lg mx-auto px-6 py-12 space-y-8">
          {/* ── Archetype Header ─────────────────────── */}
          <ScrollReveal>
            <div className="text-center">
              <MoodAccent as="h1" className="text-4xl font-serif font-bold">
                <StreamingTypewriter
                  text={result?.archetype as string}
                  isLoading={isLoading}
                  charDelay={30}
                />
              </MoodAccent>
              <p className="text-white/40 mt-2 text-sm">
                {result?.day_master_element as string} Element
              </p>
            </div>
          </ScrollReveal>

          {/* ── Core Identity (Free) ─────────────────── */}
          <ScrollReveal delay={0.1}>
            <MoodCard>
              <h2 className="text-sm font-medium text-white/40 mb-3 uppercase tracking-wider">
                Your Identity
              </h2>
              <div className="text-white/80 leading-relaxed">
                <StreamingTypewriter
                  text={
                    (
                      result?.user_identity as Record<string, string> | undefined
                    )?.synthesis_title ?? ""
                  }
                  isLoading={isLoading}
                  charDelay={22}
                  className="font-serif text-lg block mb-3"
                />
                <StreamingTypewriter
                  text={
                    (
                      result?.user_identity as Record<string, string> | undefined
                    )?.narrative ?? ""
                  }
                  isLoading={isLoading}
                  charDelay={20}
                  className="text-sm text-white/60"
                />
              </div>
            </MoodCard>
          </ScrollReveal>

          {/* ── Shadow Side (Premium — Cliffhanger) ──── */}
          <ScrollReveal delay={0.2}>
            <PaywallGate
              tier={userTier}
              requiredTier="basic"
              cliffhangerText="Your critical blind spot is\u2026"
              featureLabel="Shadow Analysis"
              onUpgrade={() => {
                haptic.press();
                // Navigate to pricing or open Stripe checkout
                console.log("Navigate to upgrade");
              }}
            >
              <MoodCard>
                <h2 className="text-sm font-medium text-white/40 mb-3 uppercase tracking-wider">
                  Shadow Side
                </h2>
                <div className="text-white/80 leading-relaxed text-sm">
                  <StreamingTypewriter
                    text={
                      (
                        result?.shadow_and_void as
                          | Record<string, string>
                          | undefined
                      )?.void_element_meaning ?? ""
                    }
                    isLoading={isLoading}
                    charDelay={20}
                  />
                </div>
              </MoodCard>
            </PaywallGate>
          </ScrollReveal>

          {/* ── Relationship Pattern (Premium) ────────── */}
          <ScrollReveal delay={0.3}>
            <PaywallGate
              tier={userTier}
              requiredTier="basic"
              cliffhangerText="In love, you always\u2026"
              featureLabel="Relationship Patterns"
            >
              <MoodCard>
                <h2 className="text-sm font-medium text-white/40 mb-3 uppercase tracking-wider">
                  Love Pattern
                </h2>
                <p className="text-white/60 text-sm">
                  {(
                    result?.relationship_dynamics as
                      | Record<string, string>
                      | undefined
                  )?.attachment_style ?? ""}
                </p>
              </MoodCard>
            </PaywallGate>
          </ScrollReveal>

          {/* ── Error State ───────────────────────────── */}
          {error && (
            <MoodCard className="border-red-500/20">
              <p className="text-red-400 text-sm">
                The elements are turbulent right now. Please try again in a
                moment.
              </p>
            </MoodCard>
          )}
        </div>
      )}
    </div>
  );
}
