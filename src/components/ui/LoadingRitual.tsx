'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles, Eye, Scroll, Fingerprint } from 'lucide-react';

// ═══════════════════════════════════════════════════════
// OHANG Ritual UI
// Synchronized Loading State & Latency Masking
// ═══════════════════════════════════════════════════════

export type RitualState = 'initializing' | 'saju_decoding' | 'vision_analyzing' | 'finalizing';

interface LoadingRitualProps {
    state: RitualState;
}

const RITUAL_CONFIG = {
    initializing: {
        icon: Sparkles,
        color: 'text-white',
        messages: [
            "Connecting to Universal Server...",
            "Calculating Solar Terms...",
            "Aligning Time Pillars...",
        ]
    },
    saju_decoding: {
        icon: Scroll,
        color: 'text-green-400',
        messages: [
            "Decoding Internal Blueprint...",
            "Identifying Core Elements...",
            "Measuring Energy Balance...",
        ]
    },
    vision_analyzing: {
        icon: Eye,
        color: 'text-purple-400',
        messages: [
            "Scanning Facial Features...",
            "Reading External Projection...",
            "Synthesizing Soul & Face...",
            "This may take a moment...", // Latency Masking
        ]
    },
    finalizing: {
        icon: Fingerprint,
        color: 'text-blue-400',
        messages: [
            "Generating Soul Profile...",
            "Finalizing Your Archetype...",
            "Preparing Revelation...",
        ]
    }
};

export function LoadingRitual({ state }: LoadingRitualProps) {
    const [msgIndex, setMsgIndex] = useState(0);
    const config = RITUAL_CONFIG[state];
    const Icon = config.icon;

    // 🔄 Rolling Text Logic (Latency Masking)
    useEffect(() => {
        setMsgIndex(0); // Reset on state change
        const interval = setInterval(() => {
            setMsgIndex((prev) => (prev + 1) % config.messages.length);
        }, 2500); // Rotate message every 2.5s
        return () => clearInterval(interval);
    }, [state, config.messages.length]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
            {/* 1. Pulsing Orb Animation */}
            <div className="relative mb-12">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-32 h-32 rounded-full blur-3xl bg-white/20`}
                />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <div className="w-24 h-24 rounded-full border-t-2 border-r-2 border-white/30" />
                </motion.div>

                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className={`w-10 h-10 ${config.color} animate-pulse`} />
                </div>
            </div>

            {/* 2. Text Streaming with AnimatePresence */}
            <div className="h-20 flex items-center justify-center w-full max-w-md text-center px-4">
                <AnimatePresence mode='wait'>
                    <motion.p
                        key={`${state}-${msgIndex}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="text-xl md:text-2xl font-heading font-light tracking-wider text-white/90"
                    >
                        {config.messages[msgIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* 3. Progress Indicator */}
            <div className="mt-8 flex gap-2">
                {(Object.keys(RITUAL_CONFIG) as RitualState[]).map((s, i) => {
                    const isActive = s === state;
                    const isPast = Object.keys(RITUAL_CONFIG).indexOf(state) > i;

                    return (
                        <motion.div
                            key={s}
                            animate={{
                                height: isActive ? 8 : 4,
                                width: isActive ? 24 : 4,
                                backgroundColor: isActive || isPast ? '#ffffff' : '#333333'
                            }}
                            className="rounded-full transition-all duration-500"
                        />
                    );
                })}
            </div>
        </div>
    );
}
