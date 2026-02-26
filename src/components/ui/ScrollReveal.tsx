"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

// ══════════════════════════════════════════════════════════
// OHANG ScrollReveal — God-Tier Parallax Depth Engine
//
// Strategy: STRATEGY_GOD_TIER.md §4.4
// parallaxFactor: 0.3 | particleParallax: 0.15
// sectionFadeDistance: 60px | staggerDelay: 0.08s
//
// Every scroll feels like peeling back layers of the cosmos.
// ══════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────
const DEFAULT_PARALLAX_FACTOR = 0.3;
const DEFAULT_PARTICLE_PARALLAX = 0.15;
const DEFAULT_SECTION_FADE_DISTANCE = 60; // px
const DEFAULT_STAGGER_DELAY = 0.08;       // seconds

// ── Types ────────────────────────────────────────────────
type RevealDirection = "up" | "down" | "left" | "right" | "none";

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Direction the element slides in from */
  direction?: RevealDirection;
  /** Delay in seconds (useful for staggering siblings) */
  delay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** How much of the element must be visible to trigger (0-1) */
  threshold?: number;
  /** Whether to animate only once or every time it enters view */
  once?: boolean;
  /** Additional className */
  className?: string;
  /** Distance to travel in pixels (default: 30) */
  distance?: number;
  /** Enable parallax depth on scroll (default: false) */
  parallax?: boolean;
  /** Parallax intensity — 0 = none, 1 = full scroll distance (default: 0.3) */
  parallaxFactor?: number;
  /** Tag to render as (default: div) */
  as?: "div" | "section" | "article" | "aside" | "header" | "footer";
}

// ── Direction → Offset Map ───────────────────────────────
function getOffset(direction: RevealDirection, distance: number) {
  switch (direction) {
    case "up":
      return { x: 0, y: distance };
    case "down":
      return { x: 0, y: -distance };
    case "left":
      return { x: distance, y: 0 };
    case "right":
      return { x: -distance, y: 0 };
    case "none":
      return { x: 0, y: 0 };
  }
}

// ══════════════════════════════════════════════════════════
// ScrollReveal — with optional parallax depth
// ══════════════════════════════════════════════════════════
export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  threshold = 0.15,
  once = true,
  className = "",
  distance = 30,
  parallax = false,
  parallaxFactor = DEFAULT_PARALLAX_FACTOR,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });

  // Parallax scroll tracking
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Parallax transforms — subtle depth shift
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    parallax ? [distance * parallaxFactor, -distance * parallaxFactor] : [0, 0]
  );
  const parallaxScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    parallax ? [0.97, 1, 0.97] : [1, 1, 1]
  );

  const offset = getOffset(direction, distance);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
        filter: "blur(4px)",
      }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" }
          : { opacity: 0, x: offset.x, y: offset.y, filter: "blur(4px)" }
      }
      style={parallax ? { y: parallaxY, scale: parallaxScale } : undefined}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Smooth cubic
      }}
    >
      {children}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
// ParallaxLayer — pure scroll-driven parallax (no reveal)
// For floating decorative elements, background particles, etc.
// ══════════════════════════════════════════════════════════
interface ParallaxLayerProps {
  children: React.ReactNode;
  /** Parallax speed factor. Positive = moves slower (depth), Negative = moves faster (foreground) */
  speed?: number;
  /** Additional className */
  className?: string;
}

export function ParallaxLayer({
  children,
  speed = DEFAULT_PARTICLE_PARALLAX,
  className = "",
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      className={`${className} will-change-transform`}
      style={{ y, opacity }}
    >
      {children}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
// Stagger Container — auto-stagger children with God-Tier delay
// ══════════════════════════════════════════════════════════
interface StaggerContainerProps {
  children: React.ReactNode;
  /** Base delay between each child (default: 0.08s per strategy) */
  stagger?: number;
  /** Direction for all children */
  direction?: RevealDirection;
  /** Enable parallax on children */
  parallax?: boolean;
  /** Additional className */
  className?: string;
}

export function StaggerContainer({
  children,
  stagger = DEFAULT_STAGGER_DELAY,
  direction = "up",
  parallax = false,
  className = "",
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <ScrollReveal
              key={i}
              direction={direction}
              delay={isInView ? i * stagger : 0}
              parallax={parallax}
            >
              {child}
            </ScrollReveal>
          ))
        : children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Section Fade — Parallax-aware section divider
// sectionFadeDistance: 60px per strategy
// ══════════════════════════════════════════════════════════
interface SectionFadeProps {
  className?: string;
  /** Fade height in pixels (default: 60 per strategy) */
  height?: number;
}

export function SectionFade({
  className = "",
  height = DEFAULT_SECTION_FADE_DISTANCE,
}: SectionFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.5, 0]);

  return (
    <motion.div
      ref={ref}
      className={`pointer-events-none ${className}`}
      style={{
        height: height + 40,
        background:
          "linear-gradient(to bottom, transparent, var(--ohang-gradient-from, #0a0a0a) 50%, transparent)",
        opacity,
      }}
    />
  );
}

// ══════════════════════════════════════════════════════════
// DepthReveal — Cinematic z-axis entrance
// Elements appear to emerge from deep space
// ══════════════════════════════════════════════════════════
interface DepthRevealProps {
  children: React.ReactNode;
  /** Delay in seconds */
  delay?: number;
  /** Duration in seconds */
  duration?: number;
  /** How far "back" the element starts (default: 50) */
  depth?: number;
  /** Only animate once */
  once?: boolean;
  className?: string;
}

export function DepthReveal({
  children,
  delay = 0,
  duration = 0.8,
  depth = 50,
  once = true,
  className = "",
}: DepthRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.15 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ perspective: 1000 }}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.85,
          z: -depth,
          filter: "blur(6px)",
          rotateX: 8,
        }}
        animate={
          isInView
            ? { opacity: 1, scale: 1, z: 0, filter: "blur(0px)", rotateX: 0 }
            : { opacity: 0, scale: 0.85, z: -depth, filter: "blur(6px)", rotateX: 8 }
        }
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1], // Custom ease — fast start, smooth land
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
