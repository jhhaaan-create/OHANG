"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Lock, Sparkles, ArrowRight, X, Crown, Zap, Star, Shield } from "lucide-react";
import { useMoodTheme } from "@/providers/MoodThemeProvider";

// ══════════════════════════════════════════════════════════
// OHANG PaywallGate — God-Tier Loss Aversion Engine
//
// Strategy: "The Reveal" pattern (STRATEGY_GOD_TIER.md §2.2)
// Free content shows Archetype + Core Energy + Void name →
// then blur "당신의 치명적 약점은 [████████]입니다" →
// cliffhanger overlay → pulsing CTA.
//
// Animated paywall = 2.9× conversion vs static.
// User name display = +17% conversion.
// ══════════════════════════════════════════════════════════

type PaywallTier = "free" | "basic" | "pro" | "destiny";

interface PaywallGateProps {
  /** User's current subscription tier */
  tier: PaywallTier;
  /** Minimum tier required to see this content */
  requiredTier?: PaywallTier;
  /** User name for personalization (+17% conversion) */
  userName?: string;
  /** The "hook" text shown above the blur (the cliffhanger line) */
  cliffhangerText?: string;
  /** What feature this unlocks (for the CTA) */
  featureLabel?: string;
  /** Children = the premium content (rendered but blurred) */
  children: React.ReactNode;
  /** Callback when user clicks upgrade with selected tier */
  onUpgrade?: (selectedTier: PaywallTier) => void;
  /** Additional class */
  className?: string;
  /** Social proof count override */
  socialProofCount?: number;
  /** Locale for i18n */
  locale?: "ko" | "en";
}

// Tier hierarchy
const TIER_LEVEL: Record<PaywallTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  destiny: 3,
};

// ── 3-Tier Pricing (Strategy §2.3) ──────────────────────
interface PricingTier {
  id: PaywallTier;
  icon: typeof Zap;
  popular: boolean;
  features: { ko: string; en: string }[];
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "basic",
    icon: Star,
    popular: false,
    features: [
      { ko: "전체 성격 분석", en: "Full personality analysis" },
      { ko: "부족 원소 해석", en: "Void element interpretation" },
      { ko: "기본 궁합 1회", en: "1 basic compatibility reading" },
    ],
  },
  {
    id: "pro",
    icon: Crown,
    popular: true,
    features: [
      { ko: "모든 Basic 기능", en: "All Basic features" },
      { ko: "3가지 톤 모드", en: "3 tone modes: Savage · Balanced · Gentle" },
      { ko: "무제한 궁합 분석", en: "Unlimited compatibility" },
      { ko: "관상 + 사주 이중 분석", en: "Face + Saju dual analysis" },
    ],
  },
  {
    id: "destiny",
    icon: Shield,
    popular: false,
    features: [
      { ko: "모든 Pro 기능 영구", en: "All Pro features forever" },
      { ko: "매일 운세 알림", en: "Daily fortune push" },
      { ko: "VIP 전용 해석", en: "VIP exclusive interpretations" },
      { ko: "미래 모든 기능 포함", en: "All future features included" },
    ],
  },
];

const TIER_LABELS: Record<string, { ko: { name: string; price: string; period: string }; en: { name: string; price: string; period: string } }> = {
  basic:   { ko: { name: "Basic",   price: "₩3,900",  period: "1회" },       en: { name: "Basic",   price: "$2.99",  period: "one-time" } },
  pro:     { ko: { name: "Pro",     price: "₩9,900",  period: "/월" },       en: { name: "Pro",     price: "$7.99",  period: "/mo" } },
  destiny: { ko: { name: "Destiny", price: "₩49,900", period: "평생" },      en: { name: "Destiny", price: "$39.99", period: "lifetime" } },
};

// ── i18n ─────────────────────────────────────────────────
function t(locale: "ko" | "en") {
  return locale === "ko"
    ? {
        unlock: "당신의 운명을 열어보세요",
        hookDefault: "당신의 치명적 약점은 [████████]입니다",
        socialProof: (n: number) => `현재 ${n.toLocaleString()}명이 운명을 확인했습니다`,
        recommended: "추천",
        startTrial: "시작하기",
        cancelAnytime: "언제든 해지 가능 · 7일 무료 체험",
        bestValue: "최고 가치",
        viewPlans: "플랜 보기",
        yourFate: (name: string) => `${name}님, 운명이 당신을 기다리고 있습니다`,
        genericFate: "운명이 당신을 기다리고 있습니다",
      }
    : {
        unlock: "Unlock your destiny",
        hookDefault: "Your critical weakness is [████████]",
        socialProof: (n: number) => `${n.toLocaleString()} people have checked their fate`,
        recommended: "Recommended",
        startTrial: "Get Started",
        cancelAnytime: "Cancel anytime · 7-day free trial",
        bestValue: "Best Value",
        viewPlans: "View Plans",
        yourFate: (name: string) => `${name}, destiny is waiting for you`,
        genericFate: "Destiny is waiting for you",
      };
}

// ── Urgency Countdown (conversion booster +23%) ─────────
function UrgencyCountdown({ color, locale }: { color: string; locale: "ko" | "en" }) {
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    // Session-stable: use sessionStorage if available
    if (typeof window !== "undefined") {
      const stored = window.sessionStorage?.getItem("ohang_offer_end");
      if (stored) {
        const remaining = Math.max(0, Math.floor((parseInt(stored) - Date.now()) / 1000));
        setTimeLeft(remaining || 15 * 60);
      } else {
        const end = Date.now() + 15 * 60 * 1000;
        try { window.sessionStorage?.setItem("ohang_offer_end", String(end)); } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const label = locale === "ko" ? "특별가 종료" : "Offer ends in";
  const isUrgent = timeLeft < 300;

  return (
    <motion.div
      className="flex items-center gap-2 text-xs"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
    >
      <span className="text-white/30">{label}</span>
      <motion.span
        className="font-mono font-bold tabular-nums px-2 py-0.5 rounded-md"
        style={{
          color: isUrgent ? "#ef4444" : color,
          backgroundColor: isUrgent ? "rgba(239,68,68,0.1)" : `${color}10`,
        }}
        animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
        transition={isUrgent ? { duration: 1, repeat: Infinity } : {}}
      >
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </motion.span>
    </motion.div>
  );
}

// ── Social Proof Counter (animated) ─────────────────────
function SocialProofCounter({ count, color, locale }: { count: number; color: string; locale: "ko" | "en" }) {
  const [displayed, setDisplayed] = useState(count - 47);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        if (prev >= count) return count;
        return prev + Math.ceil((count - prev) * 0.08);
      });
    }, 60);
    return () => clearInterval(interval);
  }, [count]);

  const text = t(locale);

  return (
    <motion.div
      className="flex items-center gap-2 text-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
    >
      {/* Live indicator */}
      <span className="relative flex h-2 w-2">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ backgroundColor: color }}
        />
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ backgroundColor: color }}
        />
      </span>
      <span className="text-white/40 tabular-nums">
        {text.socialProof(displayed)}
      </span>
    </motion.div>
  );
}

// ── Animated Blur Cliffhanger ───────────────────────────
function BlurredReveal({ text, color }: { text: string; color: string }) {
  // Find the [████████] pattern and split
  const match = text.match(/\[([^\]]+)\]/);
  if (!match) {
    return <span className="text-white/90">{text}</span>;
  }

  const before = text.slice(0, match.index);
  const redacted = match[1];
  const after = text.slice((match.index ?? 0) + match[0].length);

  return (
    <span className="text-white/90">
      {before}
      <motion.span
        className="relative inline-block px-1"
        style={{ color }}
        animate={{
          textShadow: [
            `0 0 8px ${color}`,
            `0 0 20px ${color}`,
            `0 0 8px ${color}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span style={{ filter: "blur(6px)", userSelect: "none" }}>
          {redacted}
        </span>
      </motion.span>
      {after}
    </span>
  );
}

// ── Pricing Card (for modal) ────────────────────────────
function PricingCard({
  tierConfig,
  label,
  color,
  locale,
  onSelect,
}: {
  tierConfig: PricingTier;
  label: { name: string; price: string; period: string };
  color: string;
  locale: "ko" | "en";
  onSelect: () => void;
}) {
  const text = t(locale);
  const Icon = tierConfig.icon;

  return (
    <motion.div
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        backgroundColor: tierConfig.popular ? `${color}08` : "rgba(255,255,255,0.02)",
        border: tierConfig.popular ? `2px solid ${color}40` : "1px solid rgba(255,255,255,0.06)",
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Popular badge */}
      {tierConfig.popular && (
        <div
          className="text-center py-1.5 text-[10px] font-bold tracking-widest uppercase"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {text.recommended}
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-sm font-semibold text-white">{label.name}</span>
          {tierConfig.id === "destiny" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
              {text.bestValue}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-white">{label.price}</span>
          <span className="text-xs text-white/40 ml-1">{label.period}</span>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-5 flex-1">
          {tierConfig.features.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[10px] mt-0.5" style={{ color }}>✓</span>
              <span className="text-xs text-white/60">
                {locale === "ko" ? f.ko : f.en}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onSelect}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-110 active:scale-[0.97]"
          style={{
            backgroundColor: tierConfig.popular ? color : "rgba(255,255,255,0.06)",
            color: tierConfig.popular ? "#fff" : "rgba(255,255,255,0.7)",
            boxShadow: tierConfig.popular ? `0 4px 20px ${color}40` : "none",
          }}
        >
          {text.startTrial}
        </button>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
// Main PaywallGate Component
// ══════════════════════════════════════════════════════════
export default function PaywallGate({
  tier,
  requiredTier = "basic",
  userName,
  cliffhangerText,
  featureLabel = "Full Analysis",
  children,
  onUpgrade,
  className = "",
  socialProofCount = 4832,
  locale = "ko",
}: PaywallGateProps) {
  const [showModal, setShowModal] = useState(false);
  const { palette } = useMoodTheme();
  const text = t(locale);

  // Pulsing glow motion
  const glowIntensity = useMotionValue(0);
  const glowSpring = useSpring(glowIntensity, { stiffness: 40, damping: 15 });
  const glowOpacity = useTransform(glowSpring, [0, 1], [0.15, 0.4]);

  // Pulsing animation
  useEffect(() => {
    if (TIER_LEVEL[tier] >= TIER_LEVEL[requiredTier]) return;
    const interval = setInterval(() => {
      glowIntensity.set(glowIntensity.get() === 0 ? 1 : 0);
    }, 2000);
    return () => clearInterval(interval);
  }, [tier, requiredTier, glowIntensity]);

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleUpgrade = useCallback(async (selectedTier: PaywallTier) => {
    setIsCheckoutLoading(true);
    try {
      // Call Stripe Checkout API
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedTier }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error("Checkout failed:", data.error);
        onUpgrade?.(selectedTier); // Fallback to parent handler
      }
    } catch (err) {
      console.error("Checkout error:", err);
      onUpgrade?.(selectedTier); // Fallback to parent handler
    } finally {
      setIsCheckoutLoading(false);
      setShowModal(false);
    }
  }, [onUpgrade]);

  // If user has access, render children normally
  if (TIER_LEVEL[tier] >= TIER_LEVEL[requiredTier]) {
    return <>{children}</>;
  }

  const resolvedCliffhanger = cliffhangerText ?? text.hookDefault;
  const personalMessage = userName ? text.yourFate(userName) : text.genericFate;

  return (
    <div className={`relative ${className}`}>
      {/* ═══ Premium content (blurred — "The Reveal") ═══ */}
      <div className="relative">
        {/* Actual content rendered but obscured */}
        <div
          className="select-none pointer-events-none"
          style={{
            filter: "blur(8px) saturate(0.6)",
            WebkitFilter: "blur(8px) saturate(0.6)",
            opacity: 0.35,
            maskImage: "linear-gradient(to bottom, black 20%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent 90%)",
          }}
          aria-hidden="true"
        >
          {children}
        </div>

        {/* ═══ Gradient Overlay with animated glow ═══ */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${palette.gradientFrom}dd 30%, ${palette.gradientFrom} 100%)`,
            opacity: glowOpacity,
          }}
        />
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${palette.gradientFrom}ee 40%, ${palette.gradientFrom} 100%)`,
          }}
        />

        {/* ═══ The Cliffhanger — Loss Aversion Core ═══ */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          {/* Personalized message (+17% conversion) */}
          {userName && (
            <motion.p
              className="text-[11px] text-white/30 tracking-wide mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {personalMessage}
            </motion.p>
          )}

          {/* Hook text with blur reveal */}
          <motion.p
            className="text-lg font-medium text-center mb-2 max-w-xs leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <BlurredReveal text={resolvedCliffhanger} color={palette.accent} />
          </motion.p>

          {/* Animated dots — urgency pulse */}
          <motion.div
            className="flex gap-1.5 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: palette.accent }}
                animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1.4,
                  delay: i * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>

          {/* Lock icon with animated glow halo */}
          <motion.div
            className="relative mb-6"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
          >
            {/* Outer pulsing ring */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 72,
                height: 72,
                top: -10,
                left: -10,
                border: `1px solid ${palette.accent}20`,
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Glow */}
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                backgroundColor: `${palette.accent}25`,
                width: 64,
                height: 64,
                margin: -6,
              }}
            />
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${palette.accent}15, ${palette.accent}08)`,
                border: `1px solid ${palette.accent}30`,
              }}
            >
              <Lock size={20} style={{ color: palette.accent }} />
            </div>
          </motion.div>

          {/* CTA Button — pulsing shadow */}
          <motion.button
            onClick={() => setShowModal(true)}
            className="group relative flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all"
            style={{
              background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}bb)`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              boxShadow: [
                `0 4px 20px ${palette.accent}30`,
                `0 8px 40px ${palette.accent}50`,
                `0 4px 20px ${palette.accent}30`,
              ],
            }}
            transition={{
              opacity: { delay: 0.8, duration: 0.5 },
              y: { delay: 0.8, duration: 0.5 },
              boxShadow: { delay: 1.3, duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
            />
            <Sparkles size={16} className="relative z-10" />
            <span className="relative z-10">{text.viewPlans}</span>
            <ArrowRight
              size={16}
              className="relative z-10 transition-transform group-hover:translate-x-1"
            />
          </motion.button>

          {/* Urgency Countdown + Social Proof — dual conversion pressure */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <UrgencyCountdown color={palette.accent} locale={locale} />
            <SocialProofCounter count={socialProofCount} color={palette.accent} locale={locale} />
          </div>
        </div>
      </div>

      {/* ═══ 3-Tier Pricing Modal (Strategy §2.3) ═══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Container */}
            <motion.div
              className="relative w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(to bottom, #111111, ${palette.gradientFrom})`,
                border: `1px solid rgba(255,255,255,0.06)`,
              }}
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Close */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg text-white/30 hover:text-white/60 transition-colors"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="px-6 pt-8 pb-4 text-center">
                <motion.div
                  className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: `radial-gradient(circle, ${palette.accent}20, transparent)`,
                    border: `1px solid ${palette.accent}20`,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.15 }}
                >
                  <Sparkles size={24} style={{ color: palette.accent }} />
                </motion.div>

                <h3 className="text-xl font-bold text-white mb-1.5">
                  {text.unlock}
                </h3>

                {/* Cliffhanger repeat in modal */}
                <p className="text-sm text-white/40 max-w-xs mx-auto">
                  <BlurredReveal text={resolvedCliffhanger} color={palette.accent} />
                </p>
              </div>

              {/* 3-Tier Pricing Grid */}
              <div className="px-4 pb-4 grid grid-cols-3 gap-2.5">
                {PRICING_TIERS.map((tierConfig, i) => {
                  const label = TIER_LABELS[tierConfig.id]?.[locale] ?? TIER_LABELS.basic[locale];
                  return (
                    <motion.div
                      key={tierConfig.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <PricingCard
                        tierConfig={tierConfig}
                        label={label}
                        color={palette.accent}
                        locale={locale}
                        onSelect={() => handleUpgrade(tierConfig.id)}
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer — stacked conversion triggers */}
              <div className="px-6 pb-6 text-center space-y-2">
                <UrgencyCountdown color={palette.accent} locale={locale} />
                <p className="text-[11px] text-white/20">
                  {text.cancelAnytime}
                </p>
                <SocialProofCounter count={socialProofCount} color={palette.accent} locale={locale} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
