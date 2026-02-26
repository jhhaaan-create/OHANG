'use client';

import { Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareButtonProps {
    title: string;
    text: string;
    url?: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    const handleShare = async () => {
        // 1. Mobile Native Share
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                console.log('Share canceled or failed', err);
            }
        }

        // 2. Desktop Fallback (Clipboard)
        try {
            await navigator.clipboard.writeText(`${title}\n${text}\n${shareUrl}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <button
            onClick={handleShare}
            className="glass-button w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white group relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

            <AnimatePresence mode='wait'>
                {copied ? (
                    <motion.div
                        key="copied"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="flex items-center gap-2"
                    >
                        <Check className="w-5 h-5 text-green-400" />
                        <span>Link Copied</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="share"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="flex items-center gap-2"
                    >
                        {typeof navigator !== 'undefined' && 'share' in navigator ? (
                            <Share2 className="w-5 h-5" />
                        ) : (
                            <Copy className="w-5 h-5" />
                        )}
                        <span>Share My Blueprint</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}
