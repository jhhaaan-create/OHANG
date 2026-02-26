'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/context/ThemeContext';
import { ELEMENT_COLORS } from '@/lib/constants/archetypes';

export function MoodBackground() {
    const { currentElement } = useTheme();
    const colors = ELEMENT_COLORS[currentElement];

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#0F0F1A]">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentElement}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* 1. Primary Glow Orb (Top Left) */}
                    <div
                        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-30 mix-blend-screen"
                        style={{ backgroundColor: colors.base }}
                    />

                    {/* 2. Secondary Glow Orb (Bottom Right) */}
                    <div
                        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] opacity-20 mix-blend-screen"
                        style={{ backgroundColor: colors.base }}
                    />

                    {/* 3. Noise Overlay for Texture */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay" />
                </motion.div>
            </AnimatePresence>

            {/* 4. Vignette for Readability */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0F0F1A]/90" />
        </div>
    );
}
