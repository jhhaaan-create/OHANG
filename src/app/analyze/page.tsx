'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Zap, Eye } from 'lucide-react';
import { DualModalProfileSchema } from '@/lib/ai/schemas';
import { LoadingRitual, RitualState } from '@/components/ui/LoadingRitual'; // Import Updated Component
import { ResultCard } from '@/components/analyze/ResultCard';

// Sensory Engines
import { useTheme } from '@/lib/context/ThemeContext';
import { ambientSound } from '@/lib/audio/ambient';
import { triggerElementalHaptic } from '@/lib/utils/haptic';
import { ElementType } from '@/lib/constants/archetypes';

export default function AnalyzePage() {
    const [step, setStep] = useState<'input' | 'ritual' | 'result'>('input');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { setElement } = useTheme();

    // ── AI Hooks (Streaming) ────────────────────────────
    const { object, submit, isLoading } = useObject({
        api: '/api/analyze/archetype',
        schema: DualModalProfileSchema,
        onFinish: (event: { object: Record<string, unknown> | undefined }) => {
            setStep('result');
            const obj = event.object as { internal_blueprint?: { the_void?: string } } | undefined;
            const luckyElement = obj?.internal_blueprint?.the_void as ElementType | undefined;
            if (luckyElement) {
                setElement(luckyElement);
                triggerElementalHaptic(luckyElement);
                ambientSound.play(luckyElement);
            }
        },
    });

    // ── 🧠 State Mapping Logic (The Brain) ──────────────
    // Determines the exact ritual step based on streaming data presence
    const ritualState: RitualState = useMemo(() => {
        if (!object) return 'initializing';

        // Cast to flexible record for streaming partial access
        const o = object as Record<string, Record<string, unknown> | undefined>;

        if ((o.user_identity as Record<string, unknown> | undefined)?.synthesis_title) return 'finalizing';
        if ((o.external_projection as Record<string, unknown> | undefined)?.dominant_feature) return 'vision_analyzing';
        if (imageUrl && !o.external_projection) return 'vision_analyzing';
        if ((o.internal_blueprint as Record<string, unknown> | undefined)?.the_core) return 'saju_decoding';

        return 'initializing';
    }, [object, imageUrl]);

    // ── Handlers (Same as before) ───────────────────────
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const response = await fetch(`/api/upload?filename=${file.name}`, { method: 'POST', body: file });
        const blob = await response.json();
        setImageUrl(blob.url);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        ambientSound.init();
        ambientSound.resume();
        setStep('ritual');

        const formData = new FormData(e.currentTarget);
        const data = {
            year: Number(formData.get('year')),
            month: Number(formData.get('month')),
            day: Number(formData.get('day')),
            hour: formData.get('hour') ? Number(formData.get('hour')) : null,
            minute: formData.get('minute') ? Number(formData.get('minute')) : null,
            gender: formData.get('gender'),
            imageUrl: imageUrl,
        };
        submit(data);
    };

    // ── Render ──────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-body overflow-hidden relative">

            {/* 1. Ritual Overlay with Dynamic State */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50"
                    >
                        <LoadingRitual state={ritualState} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container mx-auto px-4 py-12 relative z-10 max-w-2xl">
                {step === 'input' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <header className="text-center space-y-4">
                            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient-ohang">Soul Blueprint</h1>
                            <p className="text-muted-foreground">Decode your internal energy and external destiny.</p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-6 glass-card p-8">
                            {/* Inputs Omitted for Brevity - Copy from previous step if needed */}
                            <div className="grid grid-cols-3 gap-4">
                                <input name="year" type="number" placeholder="YYYY" required className="bg-white/5 border-white/10 rounded-lg p-3 text-center" />
                                <input name="month" type="number" placeholder="MM" required className="bg-white/5 border-white/10 rounded-lg p-3 text-center" />
                                <input name="day" type="number" placeholder="DD" required className="bg-white/5 border-white/10 rounded-lg p-3 text-center" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="hour" type="number" placeholder="Hour (0-23)" className="bg-white/5 border-white/10 rounded-lg p-3 text-center" />
                                <input name="minute" type="number" placeholder="Min (0-59)" className="bg-white/5 border-white/10 rounded-lg p-3 text-center" />
                            </div>
                            <p className="text-xs text-white/30 -mt-2 px-1">
                                Don&apos;t know your birth time? No problem — we analyze 3 Pillars (Year/Month/Day) instead of 4.
                                Adding a <span className="text-white/50 font-medium">Face Photo below</span> lets our Vision AI compensate for the missing Hour pillar by reading your facial element energy.
                            </p>
                            <select name="gender" className="w-full bg-white/5 border-white/10 rounded-lg p-3 text-white">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>

                            <div className="pt-4 border-t border-white/10">
                                <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gradient-mystic">
                                    <Eye className="w-4 h-4" /> Add Face Vision (Optional)
                                </label>
                                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group">
                                    {imageUrl ? (
                                        <Image src={imageUrl} alt="Face preview" width={128} height={128} className="h-32 w-32 object-cover rounded-full border-2 border-primary shadow-neon" />
                                    ) : (
                                        <div className="text-center text-white/50 group-hover:text-white transition-colors">
                                            <Upload className="w-8 h-8 mx-auto mb-2" />
                                            <span className="text-sm">Tap to upload selfie</span>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
                                </div>
                            </div>

                            <button type="submit" className="w-full glass-button bg-primary/20 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-primary/30 transition-all" disabled={isLoading}>
                                <Zap className="w-5 h-5 fill-current" />
                                {isLoading ? 'Connecting to Source...' : 'Reveal My Blueprint'}
                            </button>
                        </form>
                    </motion.div>
                )}

                {(step === 'result' || (step === 'ritual' && object)) && object && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 flex flex-col items-center">
                        <ResultCard data={object} />
                        <button onClick={() => window.location.reload()} className="mt-8 py-3 px-6 rounded-full border border-white/10 hover:bg-white/5 text-sm text-white/50 hover:text-white transition-colors">
                            Analyze Another Soul
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
