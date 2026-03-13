"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";

// ══════════════════════════════════════════════════════════
// OHANG Celestial Loading — God-Tier Cinematic Ritual
//
// Strategy: LOADING_SEQUENCE phase sequencer
// The first 3-5 seconds define paywall conversion rate.
// Every frame must feel like "the universe is computing."
// ══════════════════════════════════════════════════════════

type OhangElement = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

interface ElementTheme {
  bg: string;          // radial gradient base
  particle: string;    // accent color
  particleDim: string; // faded accent
  icon: string;
}

const THEMES: Record<OhangElement, ElementTheme> = {
  Wood:  { bg: "radial-gradient(ellipse at 50% 60%, #064e3b 0%, #022c22 40%, #0a0a0a 100%)", particle: "#4ade80", particleDim: "#4ade8030", icon: "\u{1F33F}" },
  Fire:  { bg: "radial-gradient(ellipse at 50% 60%, #7c2d12 0%, #431407 40%, #0a0a0a 100%)", particle: "#fb923c", particleDim: "#fb923c30", icon: "\u{1F525}" },
  Earth: { bg: "radial-gradient(ellipse at 50% 60%, #713f12 0%, #422006 40%, #0a0a0a 100%)", particle: "#fbbf24", particleDim: "#fbbf2430", icon: "\u{1F3D4}\u{FE0F}" },
  Metal: { bg: "radial-gradient(ellipse at 50% 60%, #3f3f46 0%, #18181b 40%, #0a0a0a 100%)", particle: "#d4d4d8", particleDim: "#d4d4d830", icon: "\u{2694}\u{FE0F}" },
  Water: { bg: "radial-gradient(ellipse at 50% 60%, #1e3a5f 0%, #172554 40%, #0a0a0a 100%)", particle: "#60a5fa", particleDim: "#60a5fa30", icon: "\u{1F30A}" },
};

// ── Phase Sequencer (from STRATEGY_GOD_TIER.md) ──────────
interface Phase {
  id: string;
  duration: number;  // ms
  text: string;
}

const PHASES: Phase[] = [
  { id: "gathering",  duration: 1200, text: "Reading your energy\u2026" },
  { id: "aligning",   duration: 1500, text: "Aligning the Five Forces\u2026" },
  { id: "computing",  duration: 1800, text: "Searching 518,400 blueprints\u2026" },
  { id: "revealing",  duration: 800,  text: "The gates of destiny are opening\u2026" },
];

const ELEMENT_ORDER: OhangElement[] = ["Wood", "Fire", "Earth", "Metal", "Water"];

// ── Sub-components ───────────────────────────────────────

/** Ambient floating particles — depth-layered */
function Particle({ color, i }: { color: string; i: number }) {
  // Deterministic pseudo-random from index
  const seed = (i * 7919) % 100;
  const x = seed;
  const y = 20 + ((i * 1301) % 60);
  const size = 2 + ((i * 37) % 6);
  const dur = 5 + ((i * 53) % 4);
  const del = ((i * 17) % 30) / 10;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        filter: `blur(${Math.max(1, size / 3)}px)`,
        left: `${x}%`,
        top: `${y}%`,
        willChange: "transform, opacity",
      }}
      animate={{
        opacity: [0, 0.6, 0.2, 0.5, 0],
        y: [0, -20, -10, -35, -50],
        x: [0, (i % 2 === 0 ? 8 : -8), 0, (i % 2 === 0 ? -5 : 5), 0],
        scale: [0, 1, 0.7, 1.1, 0],
      }}
      transition={{
        duration: dur,
        delay: del,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 0.5,
      }}
    />
  );
}

/** Nested orbit ring with glowing dot */
function Orbit({ r, speed, color, delay }: { r: number; speed: number; color: string; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: r * 2,
        height: r * 2,
        left: "50%",
        top: "50%",
        marginLeft: -r,
        marginTop: -r,
        border: `1px solid ${color}10`,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: speed, delay, ease: "linear", repeat: Infinity }}
    >
      {/* Orbiting dot */}
      <div
        className="absolute rounded-full"
        style={{
          width: 4,
          height: 4,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}, 0 0 16px ${color}50`,
          top: -2,
          left: "50%",
          marginLeft: -2,
        }}
      />
    </motion.div>
  );
}

/** SVG progress arc with glow */
function ProgressArc({ progress, color }: { progress: number; color: string }) {
  const R = 56;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - Math.min(1, progress));

  return (
    <svg
      className="absolute pointer-events-none"
      width={128}
      height={128}
      style={{ left: "50%", top: "50%", marginLeft: -64, marginTop: -64 }}
    >
      <circle cx={64} cy={64} r={R} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1.5} />
      <motion.circle
        cx={64}
        cy={64}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        transform="rotate(-90 64 64)"
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

/** Interactive mouse-follow glow (desktop only) */
function MouseGlow({ color }: { color: string }) {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const bgX = useTransform(springX, [0, 1], ["20%", "80%"]);
  const bgY = useTransform(springY, [0, 1], ["20%", "80%"]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(300px circle at var(--gx) var(--gy), ${color}12, transparent 70%)`,
      }}
    >
      {/* Inject CSS vars from motion values */}
      <motion.div
        className="absolute inset-0"
        style={{
          // @ts-expect-error CSS custom properties via style
          "--gx": bgX,
          "--gy": bgY,
          background: `radial-gradient(250px circle at var(--gx) var(--gy), ${color}08, transparent 60%)`,
        }}
      />
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────
interface CelestialLoadingProps {
  /** User's dominant element — colors the entire ritual */
  element?: OhangElement;
  /** External 0-100 progress (overrides phase-based progress) */
  progress?: number;
  /** Override message text */
  message?: string;
  /** Called after exit animation completes */
  onComplete?: () => void;
  /** Triggers exit sequence */
  isComplete?: boolean;
  /** Haptic callback on each phase transition */
  onPhaseChange?: (phaseId: string, index: number) => void;
}

export default function CelestialLoading({
  element,
  progress = 0,
  message,
  onComplete,
  isComplete = false,
  onPhaseChange,
}: CelestialLoadingProps) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elIdx, setElIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  // Phase sequencer — timed auto-advance
  useEffect(() => {
    if (isComplete) return;
    const phase = PHASES[phaseIdx];
    if (!phase) return;
    onPhaseChange?.(phase.id, phaseIdx);

    const t = setTimeout(() => {
      if (phaseIdx < PHASES.length - 1) setPhaseIdx((p) => p + 1);
    }, phase.duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIdx, isComplete]);

  // Element cycling when no specific element provided
  useEffect(() => {
    if (element || isComplete) return;
    const iv = setInterval(() => setElIdx((p) => (p + 1) % 5), 950);
    return () => clearInterval(iv);
  }, [element, isComplete]);

  // Exit
  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  const activeEl = element ?? ELEMENT_ORDER[elIdx];
  const theme = THEMES[activeEl];
  const currentPhase = PHASES[phaseIdx];

  // Stable particle indices
  const pIndices = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);

  // Phase-based progress (smooth)
  const phaseProgress = useCallback(() => {
    const total = PHASES.reduce((s, p) => s + p.duration, 0);
    const done = PHASES.slice(0, phaseIdx).reduce((s, p) => s + p.duration, 0);
    return Math.min(95, (done / total) * 100);
  }, [phaseIdx]);

  const effectiveProgress = progress > 0 ? Math.min(100, progress) : phaseProgress();
  const displayMsg = message ?? currentPhase?.text ?? "";

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: theme.bg }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06, filter: "blur(12px)" }}
          transition={{ duration: 0.5 }}
        >
          {/* Interactive mouse-follow glow (desktop cinematic) */}
          <MouseGlow color={theme.particle} />

          {/* Ambient particles */}
          <div className="absolute inset-0">
            {pIndices.map((i) => (
              <Particle key={i} color={theme.particleDim} i={i} />
            ))}
          </div>

          {/* ═══ Orbital System ══════════════════════════ */}
          <div className="relative w-[260px] h-[260px]">
            <Orbit r={88}  speed={10} color={theme.particle} delay={0} />
            <Orbit r={108} speed={14} color={`${theme.particle}80`} delay={0.4} />
            <Orbit r={125} speed={19} color={`${theme.particle}40`} delay={0.9} />

            <ProgressArc progress={effectiveProgress / 100} color={theme.particle} />

            {/* Center icon — spring entrance per element change */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeEl}
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.4, opacity: 0, rotate: 20 }}
                transition={{ type: "spring", stiffness: 170, damping: 13 }}
              >
                <div className="relative">
                  {/* Halo */}
                  <div
                    className="absolute rounded-full blur-2xl"
                    style={{
                      width: 80,
                      height: 80,
                      top: -16,
                      left: -16,
                      backgroundColor: theme.particleDim,
                    }}
                  />
                  {/* Breathing pulse */}
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      width: 56,
                      height: 56,
                      top: -4,
                      left: -4,
                      border: `1px solid ${theme.particle}20`,
                    }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="text-5xl relative z-10 select-none">{theme.icon}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ═══ Phase Dots ══════════════════════════════ */}
          <div className="mt-8 flex items-center gap-1.5">
            {PHASES.map((p, i) => (
              <motion.div
                key={p.id}
                className="rounded-full"
                style={{ backgroundColor: i <= phaseIdx ? theme.particle : "rgba(255,255,255,0.08)" }}
                animate={{ width: i === phaseIdx ? 22 : 6, height: 6 }}
                transition={{ duration: 0.25 }}
              />
            ))}
          </div>

          {/* ═══ Phase Message ═══════════════════════════ */}
          <AnimatePresence mode="wait">
            <motion.p
              key={displayMsg}
              className="mt-5 text-[13px] text-white/50 font-light tracking-wide text-center max-w-[280px] px-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              {displayMsg}
            </motion.p>
          </AnimatePresence>

          {/* ═══ Progress Bar ════════════════════════════ */}
          <div className="mt-4 flex items-center gap-2.5">
            <div className="w-32 h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: theme.particle }}
                animate={{ width: `${effectiveProgress}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <span className="text-[11px] text-white/25 tabular-nums w-7 text-right">
              {Math.round(effectiveProgress)}%
            </span>
          </div>

          {/* ═══ Brand ══════════════════════════════════ */}
          <motion.span
            className="absolute bottom-7 text-white/10 text-[10px] tracking-[0.35em] uppercase select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            OHANG
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
