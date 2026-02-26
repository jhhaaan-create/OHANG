/**
 * OHANG Haptic Feedback System — God-Tier Calibrated
 *
 * Precision-tuned ms-level vibrations from STRATEGY_GOD_TIER.md §4.3
 * Each pattern is designed for specific psychological impact:
 *
 * ┌────────────────────────────────────────────────────────┐
 * │ Event              │ Pattern (ms)         │ Feel       │
 * │────────────────────│──────────────────────│────────────│
 * │ tap                │ [8]                  │ Whisper    │
 * │ press              │ [12]                 │ Confirm    │
 * │ reveal             │ [8, 25, 60]          │ Crescendo  │
 * │ success            │ [10, 10, 40]         │ Bloom      │
 * │ destiny            │ [15, 30, 100, 30, 15]│ Arrival    │
 * │ alert              │ [40, 60]             │ Wake       │
 * │ scroll             │ [4]                  │ Texture    │
 * │ celestial          │ [4, 12, 20, 50]      │ Orbit      │
 * └────────────────────────────────────────────────────────┘
 *
 * Five-Element Haptic Signatures:
 * Wood:  [6, 10, 30]        — gentle, growing
 * Fire:  [15, 8, 50, 8, 15] — sharp burst
 * Earth: [20, 40, 20]       — steady pulse
 * Metal: [4, 4, 60]         — precise strike
 * Water: [8, 20, 12, 30]    — flowing wave
 *
 * Usage:
 *   import { haptic } from "@/lib/haptics";
 *   haptic.tap();
 *   haptic.destiny();
 *   haptic.element("Fire");
 */

// ── Vibration API Guard ──────────────────────────────────
function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

function vibrate(pattern: number | number[]): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Silent fail — some browsers throw on vibrate in certain contexts
  }
}

// ── Element Type ─────────────────────────────────────────
type OhangElement = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

// ── Element Haptic Signatures ────────────────────────────
const ELEMENT_PATTERNS: Record<OhangElement, number[]> = {
  Wood:  [6, 10, 30],          // Gentle growth — soft start, builds
  Fire:  [15, 8, 50, 8, 15],   // Sharp burst — explosive center
  Earth: [20, 40, 20],         // Steady pulse — grounded rhythm
  Metal: [4, 4, 60],           // Precise strike — crisp, then ring
  Water: [8, 20, 12, 30],      // Flowing wave — undulating current
};

// ── Phase Transition Signatures ──────────────────────────
// For CelestialLoading phase sequencer integration
const PHASE_PATTERNS: Record<string, number[]> = {
  gathering:  [4, 8, 4],           // Soft awakening
  aligning:   [8, 12, 20],         // Building alignment
  computing:  [4, 4, 8, 4, 30],    // Processing rhythm
  revealing:  [15, 30, 100, 30, 15], // Same as destiny — the arrival
};

// ══════════════════════════════════════════════════════════
// Haptic API — God-Tier Calibrated
// ══════════════════════════════════════════════════════════
export const haptic = {
  /** Whisper tap — scroll picker, toggle, selection (8ms) */
  tap: () => vibrate(8),

  /** Confirm press — button press, card interaction (12ms) */
  press: () => vibrate(12),

  /** Crescendo reveal — result card flip, content unveil
   *  Pattern: soft-pause-swell [8, 25, 60] */
  reveal: () => vibrate([8, 25, 60]),

  /** Bloom success — analysis complete, payment confirmed
   *  Pattern: tick-tick-bloom [10, 10, 40] */
  success: () => vibrate([10, 10, 40]),

  /** Wake alert — rate limit hit, validation error
   *  Pattern: sharp-pause [40, 60] */
  warning: () => vibrate([40, 60]),

  /** The Arrival — the moment their archetype appears.
   *  A slow, dramatic crescendo: soft-build-PEAK-fade-whisper
   *  Pattern: [15, 30, 100, 30, 15] */
  destiny: () => vibrate([15, 30, 100, 30, 15]),

  /** Texture scroll — micro-feedback during scrolling (4ms) */
  scroll: () => vibrate(4),

  /** Orbit celestial — loading phase particle feel
   *  Pattern: tick-pulse-grow-swell [4, 12, 20, 50] */
  celestial: () => vibrate([4, 12, 20, 50]),

  /** Element pulse — when void element is revealed (3 pulses) */
  elementPulse: () => vibrate([30, 50, 30, 50, 30]),

  /** Chemistry — partner match reveal (heartbeat pattern) */
  chemistry: () => vibrate([60, 100, 60, 200, 80]),

  /** Element-specific signature — tuned per 五行 */
  element: (el: OhangElement) => {
    const pattern = ELEMENT_PATTERNS[el];
    if (pattern) vibrate(pattern);
  },

  /** Phase transition — for CelestialLoading integration */
  phase: (phaseId: string) => {
    const pattern = PHASE_PATTERNS[phaseId];
    if (pattern) vibrate(pattern);
  },

  /** Custom pattern — for one-off effects */
  custom: (pattern: number | number[]) => vibrate(pattern),

  /** Cancel any active vibration */
  cancel: () => vibrate(0),
};

export default haptic;
