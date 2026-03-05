// src/components/landing/BottomCTA.tsx
"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Bottom CTA — Final conversion push before footer
// ═══════════════════════════════════════════════════════

export default function BottomCTA() {
    return (
        <section className="py-20 px-6">
            <motion.div
                className="max-w-md mx-auto text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white/90">
                    Ready to decode your destiny?
                </h2>
                <p className="text-sm text-white/30 mb-8">
                    Free archetype analysis \u00b7 No sign-up required
                </p>
                <Link href="/analyze">
                    <motion.button
                        onClick={() => haptic.press()}
                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm bg-white/[0.06] text-white/80 border border-white/[0.08] transition-all"
                        whileHover={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                            boxShadow: "0 0 30px rgba(139,92,246,0.15)",
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <Sparkles size={16} /> Start Free Analysis
                    </motion.button>
                </Link>
            </motion.div>
        </section>
    );
}
