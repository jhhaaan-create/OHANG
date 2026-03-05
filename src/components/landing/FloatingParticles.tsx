// src/components/landing/FloatingParticles.tsx
"use client";

import { motion } from "framer-motion";

// ═══════════════════════════════════════════════════════
// Floating Particles — Ambient decoration layer
// Extracted from page.tsx for modularity
// ═══════════════════════════════════════════════════════

export default function FloatingParticles() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: 24 }).map((_, i) => {
                const size = 1.5 + (i % 4);
                const left = (i * 37 + 13) % 100;
                const top = (i * 53 + 7) % 100;
                const duration = 18 + (i % 8) * 4;
                const delay = (i * 0.5) % 6;

                const colors = [
                    "rgba(139,92,246,0.12)",
                    "rgba(168,85,247,0.08)",
                    "rgba(236,72,153,0.06)",
                    "rgba(59,130,246,0.08)",
                ];

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: size,
                            height: size,
                            left: `${left}%`,
                            top: `${top}%`,
                            backgroundColor: colors[i % colors.length],
                        }}
                        animate={{
                            y: [0, -25, 0],
                            opacity: [0.2, 0.6, 0.2],
                        }}
                        transition={{
                            duration,
                            delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                );
            })}
        </div>
    );
}
