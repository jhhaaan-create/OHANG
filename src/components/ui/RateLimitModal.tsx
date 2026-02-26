"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Battery, Clock } from "lucide-react";
import { useMoodTheme } from "@/providers/MoodThemeProvider";
import { useEffect, useState } from "react";

interface RateLimitModalProps {
  /** Whether to show the modal */
  isVisible: boolean;
  /** Seconds until rate limit resets */
  retryAfter?: number;
  /** Close handler */
  onClose: () => void;
}

export default function RateLimitModal({
  isVisible,
  retryAfter = 60,
  onClose,
}: RateLimitModalProps) {
  const { palette } = useMoodTheme();
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(retryAfter);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isVisible, retryAfter, onClose]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative max-w-sm w-full rounded-2xl p-8 text-center"
            style={{
              background: `linear-gradient(to bottom, ${palette.gradientFrom}, ${palette.gradientVia})`,
              border: `1px solid ${palette.border}`,
            }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
          >
            {/* Animated battery icon */}
            <motion.div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
              style={{
                background: `${palette.accent}10`,
                border: `1px solid ${palette.border}`,
              }}
              animate={{
                boxShadow: [
                  `0 0 0 0 ${palette.accent}00`,
                  `0 0 20px 5px ${palette.accent}20`,
                  `0 0 0 0 ${palette.accent}00`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Battery size={28} style={{ color: palette.accent }} />
            </motion.div>

            <h3 className="text-lg font-medium text-white mb-2">
              Your energy is recharging
            </h3>

            <p className="text-sm text-white/50 mb-6">
              The Five Elements need a moment to realign. Your next reading will
              be ready soon.
            </p>

            {/* Countdown */}
            <div
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl mx-auto w-fit"
              style={{
                background: `${palette.accent}08`,
                border: `1px solid ${palette.border}`,
              }}
            >
              <Clock size={14} style={{ color: palette.accent }} />
              <span
                className="text-sm font-mono tabular-nums"
                style={{ color: palette.textAccent }}
              >
                {minutes > 0
                  ? `${minutes}:${seconds.toString().padStart(2, "0")}`
                  : `${seconds}s`}
              </span>
            </div>

            {/* Tip */}
            <p className="mt-6 text-xs text-white/30">
              Tip: OHANG+ members get unlimited readings
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
