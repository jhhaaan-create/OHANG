"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

// ══════════════════════════════════════════════════════════
// OHANG TypewriterText — God-Tier Punctuation-Aware Engine
//
// Strategy: STRATEGY_GOD_TIER.md §4.1
// charDelay: 35ms | sentenceDelay: 400ms
// commaDelay: 150ms | sectionRevealDelay: 600ms
//
// Every pause is intentional. Periods feel like destiny
// settling. Commas feel like breath between revelations.
// ══════════════════════════════════════════════════════════

// ── Timing Constants (ms) ────────────────────────────────
const CHAR_DELAY = 35;       // Base character reveal speed
const COMMA_DELAY = 150;     // Pause after , ; :
const SENTENCE_DELAY = 400;  // Pause after . ! ? …
const SECTION_DELAY = 600;   // Pause after \n\n (paragraph break)
const ELLIPSIS_DELAY = 250;  // Pause after …

// ── Types ────────────────────────────────────────────────
interface TypewriterTextProps {
  /** The full text to reveal */
  text: string;
  /** Base delay per character in ms (default: CHAR_DELAY) */
  charDelay?: number;
  /** Delay before starting in ms */
  delay?: number;
  /** Whether to show the blinking cursor */
  showCursor?: boolean;
  /** Cursor color (uses mood accent by default) */
  cursorColor?: string;
  /** Callback when typing completes */
  onComplete?: () => void;
  /** Additional className */
  className?: string;
  /** If true, reveal all text immediately (for already-loaded states) */
  instant?: boolean;
  /** Enable punctuation-aware pauses (default: true) */
  smartPauses?: boolean;
  /** Callback on each character reveal (for haptic integration) */
  onChar?: (char: string, index: number) => void;
}

// ── Punctuation delay resolver ───────────────────────────
function getCharDelay(text: string, index: number, baseDelay: number): number {
  const char = text[index];
  const next = text[index + 1];
  const nextNext = text[index + 2];

  // Section break: \n\n → long pause
  if (char === "\n" && next === "\n") {
    return SECTION_DELAY;
  }

  // Sentence endings → dramatic pause
  if (".!?".includes(char)) {
    // Don't pause for abbreviations (e.g., "Dr." followed by capital)
    if (next === " " || next === "\n" || next === undefined) {
      return SENTENCE_DELAY;
    }
  }

  // Ellipsis (… or ...)
  if (char === "…") {
    return ELLIPSIS_DELAY;
  }
  if (char === "." && next === "." && nextNext === ".") {
    return ELLIPSIS_DELAY;
  }

  // Comma and soft breaks → breath pause
  if (",;:".includes(char)) {
    return COMMA_DELAY;
  }

  // Korean sentence endings (。)
  if (char === "。") {
    return SENTENCE_DELAY;
  }

  // Em dash — dramatic pause
  if (char === "—" || char === "–") {
    return COMMA_DELAY;
  }

  return baseDelay;
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function TypewriterText({
  text,
  charDelay = CHAR_DELAY,
  delay = 0,
  showCursor = true,
  cursorColor,
  onComplete,
  className = "",
  instant = false,
  smartPauses = true,
  onChar,
}: TypewriterTextProps) {
  const [displayedLength, setDisplayedLength] = useState(instant ? text.length : 0);
  const [isTyping, setIsTyping] = useState(!instant);
  const prevTextRef = useRef(text);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(true);

  // Stable callback refs
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onCharRef = useRef(onChar);
  onCharRef.current = onChar;

  // Recursive character-by-character reveal with variable delay
  const scheduleNext = useCallback(
    (currentIndex: number, currentText: string) => {
      if (!isActiveRef.current) return;
      if (currentIndex >= currentText.length) {
        setIsTyping(false);
        onCompleteRef.current?.();
        return;
      }

      const msDelay = smartPauses
        ? getCharDelay(currentText, currentIndex, charDelay)
        : charDelay;

      timeoutRef.current = setTimeout(() => {
        if (!isActiveRef.current) return;
        setDisplayedLength(currentIndex + 1);
        onCharRef.current?.(currentText[currentIndex], currentIndex);

        // Schedule next character
        scheduleNext(currentIndex + 1, currentText);
      }, msDelay);
    },
    [charDelay, smartPauses]
  );

  // Start / restart typing
  useEffect(() => {
    isActiveRef.current = true;

    if (instant) {
      setDisplayedLength(text.length);
      setIsTyping(false);
      return;
    }

    // If text grew (streaming), continue from current position
    const prevLength = prevTextRef.current.length;
    const isStreaming = text.startsWith(prevTextRef.current.slice(0, prevLength));
    prevTextRef.current = text;

    if (!isStreaming) {
      // Text changed completely — reset
      setDisplayedLength(0);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const delayTimer = setTimeout(() => {
        setIsTyping(true);
        scheduleNext(0, text);
      }, delay);

      return () => {
        clearTimeout(delayTimer);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        isActiveRef.current = false;
      };
    }

    // Streaming: if we're caught up, continue typing from where we left off
    setIsTyping(true);
    // Clear any existing schedule and restart from current displayed position
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Small delay to batch streaming updates
    const batchTimer = setTimeout(() => {
      scheduleNext(displayedLength, text);
    }, 16);

    return () => {
      clearTimeout(batchTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      isActiveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delay, instant, scheduleNext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const displayed = text.slice(0, displayedLength);
  const resolvedCursorColor = cursorColor ?? "var(--ohang-accent, #a78bfa)";

  return (
    <span className={`relative ${className}`}>
      {/* Revealed text */}
      <span>{displayed}</span>

      {/* Blinking cursor — subtle fade */}
      {showCursor && isTyping && (
        <motion.span
          className="inline-block ml-[1px] align-baseline"
          style={{
            width: "2px",
            height: "1.1em",
            backgroundColor: resolvedCursorColor,
            verticalAlign: "text-bottom",
          }}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </span>
  );
}

// ── Streaming-aware wrapper ──────────────────────────────
// Use with useObject streaming to automatically typewrite as data arrives

interface StreamingTypewriterProps {
  /** Partial or complete text from streaming */
  text: string | undefined | null;
  /** Whether the stream is still loading */
  isLoading: boolean;
  /** Fallback while waiting for first character */
  placeholder?: string;
  /** Base character delay in ms */
  charDelay?: number;
  className?: string;
  /** Callback per character (for haptics) */
  onChar?: (char: string, index: number) => void;
}

export function StreamingTypewriter({
  text,
  isLoading,
  placeholder = "\u2026",
  charDelay = CHAR_DELAY,
  className = "",
  onChar,
}: StreamingTypewriterProps) {
  const resolvedText = text ?? "";
  const isEmpty = resolvedText.length === 0;

  if (isEmpty && isLoading) {
    return (
      <span className={`text-white/30 ${className}`}>
        <motion.span
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {placeholder}
        </motion.span>
      </span>
    );
  }

  return (
    <TypewriterText
      text={resolvedText}
      charDelay={charDelay}
      showCursor={isLoading}
      instant={!isLoading && resolvedText.length > 0}
      className={className}
      onChar={onChar}
    />
  );
}
