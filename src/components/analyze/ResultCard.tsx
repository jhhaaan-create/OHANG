'use client';

import { motion } from 'framer-motion';
import { ShareButton } from './ShareButton';
import { Star, Zap, Droplets, Mountain, Wind, Flame } from 'lucide-react';

// Props Interface (Matches your Schema)
interface ResultCardProps {
    data: any; // Using 'any' for flexibility with StreamObject, ideally use Schema type
}

const ELEMENT_ICONS: Record<string, any> = {
    Wood: Wind, Fire: Flame, Earth: Mountain, Metal: Star, Water: Droplets
};

const ELEMENT_COLORS: Record<string, string> = {
    Wood: 'text-wood border-wood shadow-wood',
    Fire: 'text-fire border-fire shadow-fire',
    Earth: 'text-earth border-earth shadow-earth',
    Metal: 'text-metal border-metal shadow-metal',
    Water: 'text-water border-water shadow-water',
};

export function ResultCard({ data }: ResultCardProps) {
    if (!data) return null;

    const archetype = data.user_identity?.core_archetype || 'Analyzing...';
    const tagline = data.user_identity?.synthesis_title || 'Decoding soul...';
    const element = data.internal_blueprint?.the_core || 'Wood';
    const voidElement = data.internal_blueprint?.the_void || 'Fire';
    const ElementIcon = ELEMENT_ICONS[element] || Star;

    // Generate dynamic OG Image URL for sharing
    const ogUrl = `/api/og?archetype=${encodeURIComponent(archetype)}&element=${element}&void=${voidElement}&tagline=${encodeURIComponent(tagline)}`;

    return (
        <div className="w-full max-w-md mx-auto perspective-1000">
            <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
            >
                {/* 1. Holographic Floating Card */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className={`glass-card p-8 rounded-3xl border-t border-white/20 relative overflow-hidden group`}
                >
                    {/* Dynamic Glow Background */}
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none`} />

                    {/* Header: Element Icon & Name */}
                    <div className="flex items-center justify-between mb-6">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 ${ELEMENT_COLORS[element]}`}>
                            <ElementIcon className="w-4 h-4" />
                            <span className="text-sm font-bold uppercase tracking-wider">{element} CORE</span>
                        </div>
                        <div className="text-xs text-white/40 font-mono tracking-widest">OHANG-V3.2</div>
                    </div>

                    {/* Main Identity */}
                    <div className="text-center mb-8">
                        <h2 className="text-4xl md:text-5xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-2">
                            {archetype}
                        </h2>
                        <p className="text-lg text-primary italic font-light">"{tagline}"</p>
                    </div>

                    {/* Key Insight: The Void */}
                    <div className="bg-black/20 rounded-2xl p-6 mb-8 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <h3 className="text-sm font-bold text-white/80 uppercase">The Void (Your Craving)</h3>
                        </div>
                        <p className="text-white/90 leading-relaxed">
                            {data.alignment_analysis?.psychological_dynamic || data.internal_blueprint?.description}
                        </p>
                    </div>

                    {/* Share Action */}
                    <ShareButton
                        title={`I am ${archetype}`}
                        text={`My Soul Blueprint reveals that I crave ${voidElement} energy. Decode yours at OHANG.`}
                        url={typeof window !== 'undefined' ? window.location.href : undefined}
                    />

                </motion.div>

                {/* 2. Floating Shadow */}
                <motion.div
                    animate={{ scale: [1, 0.9, 1], opacity: [0.5, 0.3, 0.5] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/50 blur-xl rounded-full -z-10"
                />
            </motion.div>
        </div>
    );
}
