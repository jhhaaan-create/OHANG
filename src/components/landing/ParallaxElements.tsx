// src/components/landing/ParallaxElements.tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// ═══════════════════════════════════════════════════════
// Parallax Five-Element Layer — CRO #4
// Elemental icons float at different parallax speeds
// on scroll, creating depth and premium feel.
// ═══════════════════════════════════════════════════════

const ELEMENTS = [
    { emoji: "\uD83D\uDD25", x: "10%", baseY: 200,  speed: 0.6, size: 28, opacity: 0.12 },
    { emoji: "\uD83D\uDCA7", x: "85%", baseY: 350,  speed: 0.4, size: 24, opacity: 0.10 },
    { emoji: "\uD83C\uDF3F", x: "70%", baseY: 150,  speed: 0.7, size: 22, opacity: 0.08 },
    { emoji: "\u2699\uFE0F", x: "20%", baseY: 500,  speed: 0.3, size: 20, opacity: 0.07 },
    { emoji: "\uD83C\uDF0A", x: "50%", baseY: 650,  speed: 0.5, size: 26, opacity: 0.09 },
    { emoji: "\uD83D\uDD25", x: "90%", baseY: 800,  speed: 0.35, size: 18, opacity: 0.06 },
    { emoji: "\uD83E\uDEA8", x: "30%", baseY: 900,  speed: 0.55, size: 20, opacity: 0.08 },
    { emoji: "\uD83D\uDCA7", x: "60%", baseY: 1100, speed: 0.45, size: 22, opacity: 0.07 },
];

export default function ParallaxElements() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();

    return (
        <div ref={ref} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {ELEMENTS.map((el, i) => (
                <ParallaxItem key={i} el={el} scrollYProgress={scrollYProgress} />
            ))}
        </div>
    );
}

function ParallaxItem({
    el,
    scrollYProgress,
}: {
    el: typeof ELEMENTS[number];
    scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
    const y = useTransform(
        scrollYProgress,
        [0, 1],
        [el.baseY, el.baseY - el.speed * 600]
    );

    return (
        <motion.div
            className="absolute"
            style={{
                left: el.x,
                y,
                fontSize: el.size,
                opacity: el.opacity,
                filter: "blur(1px)",
            }}
        >
            {el.emoji}
        </motion.div>
    );
}
