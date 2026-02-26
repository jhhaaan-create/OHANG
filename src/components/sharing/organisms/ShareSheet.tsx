"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Share2, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { share, copyToClipboard, shareToTwitter, type SharePayload } from "@/lib/sharing/shareUtils";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Share Sheet — Bottom sheet for sharing results
// ═══════════════════════════════════════════════════════

interface ShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    payload: SharePayload;
    locale?: "ko" | "en";
}

export default function ShareSheet({
    isOpen,
    onClose,
    payload,
    locale = "ko",
}: ShareSheetProps) {
    const [copied, setCopied] = useState(false);

    const handleNativeShare = useCallback(async () => {
        haptic.press();
        await share(payload);
    }, [payload]);

    const handleCopy = useCallback(async () => {
        haptic.tap();
        await copyToClipboard(`${payload.text}\n${payload.url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [payload]);

    const handleTwitter = useCallback(() => {
        haptic.tap();
        shareToTwitter(payload);
    }, [payload]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-[#111111] border-t border-white/[0.06] p-6 pb-10"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    >
                        {/* Handle */}
                        <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-5" />

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-white/30 hover:text-white/50"
                        >
                            <X size={18} />
                        </button>

                        {/* Preview */}
                        <div className="mb-6">
                            <h3 className="text-base font-semibold text-white mb-1">
                                {locale === "ko" ? "결과 공유하기" : "Share Result"}
                            </h3>
                            <p className="text-sm text-white/40 line-clamp-2">{payload.text}</p>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Native Share (mobile) */}
                            <button
                                onClick={handleNativeShare}
                                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
                            >
                                <Share2 size={20} className="text-white/50" />
                                <span className="text-[11px] text-white/40">
                                    {locale === "ko" ? "공유" : "Share"}
                                </span>
                            </button>

                            {/* Copy */}
                            <button
                                onClick={handleCopy}
                                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
                            >
                                {copied ? (
                                    <Check size={20} className="text-emerald-400" />
                                ) : (
                                    <Copy size={20} className="text-white/50" />
                                )}
                                <span className="text-[11px] text-white/40">
                                    {copied
                                        ? (locale === "ko" ? "복사됨!" : "Copied!")
                                        : (locale === "ko" ? "링크 복사" : "Copy Link")}
                                </span>
                            </button>

                            {/* Twitter/X */}
                            <button
                                onClick={handleTwitter}
                                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
                            >
                                <span className="text-lg">𝕏</span>
                                <span className="text-[11px] text-white/40">Twitter</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
