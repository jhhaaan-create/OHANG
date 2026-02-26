'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ResultCard } from '@/components/analyze/ResultCard';
import { useTheme } from '@/lib/context/ThemeContext';
import { ambientSound } from '@/lib/audio/ambient';
import { ElementType } from '@/lib/constants/archetypes';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ResultViewProps {
    data: any; // Ideally typed with your Zod Schema
}

export function ResultView({ data }: ResultViewProps) {
    const { setElement } = useTheme();

    useEffect(() => {
        // 🌊 Hydrate Theme & Mood on Mount
        const luckyElement = data?.internal_blueprint?.the_void as ElementType;
        if (luckyElement) {
            setElement(luckyElement);
            // Optional: Auto-play sound might be blocked, so we init on interaction
            // But we can set the visual mood immediately.
        }
    }, [data, setElement]);

    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-body relative flex flex-col items-center py-12 px-4">

            {/* 1. Navigation */}
            <div className="w-full max-w-2xl mb-8 flex justify-between items-center z-20">
                <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span>New Analysis</span>
                </Link>
                <div className="text-sm text-white/30 font-mono">ARCHIVE MODE</div>
            </div>

            {/* 2. Main Content (Holographic Card) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full flex justify-center z-10"
            >
                <ResultCard data={data} />
            </motion.div>

            {/* 3. CTA for New Users */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-12 text-center z-10"
            >
                <p className="text-white/60 mb-4">Curious about your own soul blueprint?</p>
                <Link
                    href="/analyze"
                    className="glass-button px-8 py-3 rounded-full text-white font-bold border border-white/20 hover:bg-white/10 transition-all"
                >
                    Start Your Ritual
                </Link>
            </motion.div>
        </div>
    );
}
