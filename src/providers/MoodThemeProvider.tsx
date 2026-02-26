"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ── Types ────────────────────────────────────────────────
export type OhangElement = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

export interface ElementPalette {
  /** Primary accent color (hex) */
  accent: string;
  /** Subtle background tint (very low opacity) */
  tint: string;
  /** Glow/shadow color */
  glow: string;
  /** Card border highlight */
  border: string;
  /** Gradient stops for premium cards */
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  /** Text accent color */
  textAccent: string;
  /** Ring color for focus states */
  ring: string;
}

interface MoodTheme {
  element: OhangElement | null;
  palette: ElementPalette;
  setElement: (el: OhangElement) => void;
  clear: () => void;
}

// ── Palettes ─────────────────────────────────────────────
// Each void element tints the ENTIRE app with what the user NEEDS.
// If their void is Fire → the app breathes warmth to compensate.

const PALETTES: Record<OhangElement, ElementPalette> = {
  Wood: {
    accent: "#22c55e",
    tint: "rgba(34, 197, 94, 0.03)",
    glow: "0 0 40px rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.12)",
    gradientFrom: "#052e16",
    gradientVia: "#14532d",
    gradientTo: "#022c22",
    textAccent: "#4ade80",
    ring: "ring-emerald-500/30",
  },
  Fire: {
    accent: "#f97316",
    tint: "rgba(249, 115, 22, 0.03)",
    glow: "0 0 40px rgba(249, 115, 22, 0.15)",
    border: "rgba(249, 115, 22, 0.12)",
    gradientFrom: "#431407",
    gradientVia: "#7c2d12",
    gradientTo: "#451a03",
    textAccent: "#fb923c",
    ring: "ring-orange-500/30",
  },
  Earth: {
    accent: "#eab308",
    tint: "rgba(234, 179, 8, 0.03)",
    glow: "0 0 40px rgba(234, 179, 8, 0.12)",
    border: "rgba(234, 179, 8, 0.10)",
    gradientFrom: "#422006",
    gradientVia: "#713f12",
    gradientTo: "#451a03",
    textAccent: "#facc15",
    ring: "ring-amber-500/30",
  },
  Metal: {
    accent: "#a1a1aa",
    tint: "rgba(161, 161, 170, 0.04)",
    glow: "0 0 40px rgba(161, 161, 170, 0.12)",
    border: "rgba(161, 161, 170, 0.12)",
    gradientFrom: "#18181b",
    gradientVia: "#27272a",
    gradientTo: "#09090b",
    textAccent: "#d4d4d8",
    ring: "ring-zinc-400/30",
  },
  Water: {
    accent: "#3b82f6",
    tint: "rgba(59, 130, 246, 0.03)",
    glow: "0 0 40px rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.12)",
    gradientFrom: "#172554",
    gradientVia: "#1e3a5f",
    gradientTo: "#0c1929",
    textAccent: "#60a5fa",
    ring: "ring-blue-500/30",
  },
};

// Default palette (neutral dark) when no element is set
const DEFAULT_PALETTE: ElementPalette = {
  accent: "#a78bfa",
  tint: "rgba(167, 139, 250, 0.02)",
  glow: "0 0 40px rgba(167, 139, 250, 0.10)",
  border: "rgba(255, 255, 255, 0.06)",
  gradientFrom: "#0a0a0a",
  gradientVia: "#171717",
  gradientTo: "#0a0a0a",
  textAccent: "#c4b5fd",
  ring: "ring-violet-500/20",
};

// ── Context ──────────────────────────────────────────────
const MoodThemeContext = createContext<MoodTheme>({
  element: null,
  palette: DEFAULT_PALETTE,
  setElement: () => {},
  clear: () => {},
});

export function useMoodTheme() {
  return useContext(MoodThemeContext);
}

// ── CSS Variable Injector ────────────────────────────────
function injectCSSVariables(palette: ElementPalette) {
  const root = document.documentElement;
  root.style.setProperty("--ohang-accent", palette.accent);
  root.style.setProperty("--ohang-tint", palette.tint);
  root.style.setProperty("--ohang-glow", palette.glow);
  root.style.setProperty("--ohang-border", palette.border);
  root.style.setProperty("--ohang-gradient-from", palette.gradientFrom);
  root.style.setProperty("--ohang-gradient-via", palette.gradientVia);
  root.style.setProperty("--ohang-gradient-to", palette.gradientTo);
  root.style.setProperty("--ohang-text-accent", palette.textAccent);

  // Backward compatibility with old ThemeContext CSS vars
  root.style.setProperty("--theme-primary", palette.accent);
  root.style.setProperty("--theme-glow", palette.glow);
  root.style.setProperty("--theme-text", palette.accent);
}

// ── Provider ─────────────────────────────────────────────
interface MoodThemeProviderProps {
  children: ReactNode;
  /** If known at render time (e.g., from cached user profile) */
  initialElement?: OhangElement;
}

export function MoodThemeProvider({
  children,
  initialElement,
}: MoodThemeProviderProps) {
  const [element, setElementState] = useState<OhangElement | null>(
    initialElement ?? null
  );

  const palette = element ? PALETTES[element] : DEFAULT_PALETTE;

  // Inject CSS variables whenever palette changes
  useEffect(() => {
    injectCSSVariables(palette);
  }, [palette]);

  // Persist element choice to localStorage
  const setElement = useCallback((el: OhangElement) => {
    setElementState(el);
    try {
      localStorage.setItem("ohang_void_element", el);
    } catch {
      // Silent fail (SSR or privacy mode)
    }
  }, []);

  const clear = useCallback(() => {
    setElementState(null);
    try {
      localStorage.removeItem("ohang_void_element");
    } catch {
      // Silent fail
    }
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (initialElement) return;
    try {
      const stored = localStorage.getItem("ohang_void_element");
      if (stored && stored in PALETTES) {
        setElementState(stored as OhangElement);
      }
    } catch {
      // Silent fail
    }
  }, [initialElement]);

  return (
    <MoodThemeContext.Provider value={{ element, palette, setElement, clear }}>
      {children}
    </MoodThemeContext.Provider>
  );
}

// ── Utility Components ───────────────────────────────────

/** A card that auto-tints its border/glow with the mood element */
export function MoodCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { palette } = useMoodTheme();
  return (
    <div
      className={`rounded-2xl bg-white/[0.03] backdrop-blur-xl p-6 transition-all duration-700 ${className}`}
      style={{
        border: `1px solid ${palette.border}`,
        boxShadow: palette.glow,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/** Accent-colored text that adapts to mood element */
export function MoodAccent({
  children,
  as: Tag = "span",
  className = "",
}: {
  children: ReactNode;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  className?: string;
}) {
  const { palette } = useMoodTheme();
  return (
    <Tag className={className} style={{ color: palette.textAccent }}>
      {children}
    </Tag>
  );
}

/** A gradient background that shifts with the mood */
export function MoodGradientBg({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { palette } = useMoodTheme();
  return (
    <div
      className={`min-h-screen transition-colors duration-1000 ${className}`}
      style={{
        background: `linear-gradient(to bottom, ${palette.gradientFrom}, ${palette.gradientVia}, ${palette.gradientTo})`,
      }}
    >
      {children}
    </div>
  );
}

// ── Export palettes for use in other components ───────────
export { PALETTES, DEFAULT_PALETTE };
