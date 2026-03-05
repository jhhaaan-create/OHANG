"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Download, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { share, copyToClipboard, type SharePayload } from "@/lib/sharing/shareUtils";
import haptic from "@/lib/haptics";

interface ShareViralButtonProps {
    /** For Web Share API and clipboard */
    payload: SharePayload;
    /** OG image URL for Blob download (e.g., /api/og/chemistry?...) */
    ogImageUrl?: string;
    /** Visual variant */
    variant?: "default" | "compact" | "cta";
    locale?: "ko" | "en";
    className?: string;
    // ── Share-to-Unlock props ──
    /** Feature to unlock on successful share */
    unlockFeature?: "red_flag" | "couple_scan" | "retro_mode" | "celeb_match";
    /** Specific result ID being unlocked */
    unlockResultId?: string;
    /** Called after successful share + unlock API confirmation */
    onShareSuccess?: (feature: string) => void;
}

type ShareMode = "idle" | "sharing" | "success";

export default function ShareViralButton({
    payload,
    ogImageUrl,
    variant = "default",
    locale = "ko",
    className = "",
    unlockFeature,
    unlockResultId,
    onShareSuccess,
}: ShareViralButtonProps) {
    const [mode, setMode] = useState<ShareMode>("idle");
    const [showMenu, setShowMenu] = useState(false);

    const labels = {
        share: locale === "ko" ? "공유하기" : "Share",
        download: locale === "ko" ? "이미지 저장" : "Save Image",
        copy: locale === "ko" ? "링크 복사" : "Copy Link",
        copied: locale === "ko" ? "복사됨!" : "Copied!",
        saved: locale === "ko" ? "저장됨!" : "Saved!",
    };

    // ── Share-to-Unlock recorder ──
    const recordUnlock = useCallback(async (method: "native" | "clipboard" | "download") => {
        if (!unlockFeature) return;
        try {
            const res = await fetch("/api/actions/unlock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feature: unlockFeature,
                    shareMethod: method,
                    resultId: unlockResultId,
                }),
            });
            if (res.ok) {
                onShareSuccess?.(unlockFeature);
                haptic.success();
                toast.success(locale === "ko" ? "🔓 콘텐츠가 잠금 해제되었습니다!" : "🔓 Content unlocked!");
            }
        } catch {
            // Silent fail — don't block share flow
            console.warn("[ShareViralButton] Unlock recording failed");
        }
    }, [unlockFeature, unlockResultId, onShareSuccess, locale]);

    // ── Primary: Web Share API ──
    const handleNativeShare = useCallback(async () => {
        haptic.press();
        setMode("sharing");
        try {
            await share(payload);
            setMode("success");
            await recordUnlock("native");
            setTimeout(() => setMode("idle"), 2000);
        } catch {
            // User cancelled — silently reset
            setMode("idle");
        }
        setShowMenu(false);
    }, [payload, recordUnlock]);

    // ── Fallback 1: Download OG Image as Blob ──
    const handleDownloadImage = useCallback(async () => {
        if (!ogImageUrl) return;
        haptic.tap();
        setMode("sharing");
        try {
            const res = await fetch(ogImageUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ohang-result.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(labels.saved);
            await recordUnlock("download");
            setMode("success");
        } catch {
            toast.error("Download failed. Try copying the link instead.");
            setMode("idle");
        }
        setTimeout(() => setMode("idle"), 2000);
        setShowMenu(false);
    }, [ogImageUrl, labels.saved, recordUnlock]);

    // ── Fallback 2: Copy to Clipboard ──
    const handleCopyLink = useCallback(async () => {
        haptic.tap();
        await copyToClipboard(`${payload.text}\n${payload.url}`);
        toast.success(labels.copied);
        await recordUnlock("clipboard");
        setMode("success");
        setTimeout(() => setMode("idle"), 2000);
        setShowMenu(false);
    }, [payload, labels.copied, recordUnlock]);

    // ── CTA variant: big gradient button ──
    if (variant === "cta") {
        return (
            <div className={`relative ${className}`}>
                <motion.button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-full py-3.5 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white border border-white/10 shadow-lg shadow-violet-500/10"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <AnimatePresence mode="wait">
                        {mode === "success" ? (
                            <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                                <Check size={16} /> {labels.copied}
                            </motion.span>
                        ) : (
                            <motion.span key="share" className="flex items-center gap-2">
                                <Share2 size={16} /> {labels.share}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* Dropdown menu */}
                <AnimatePresence>
                    {showMenu && (
                        <ShareDropdown
                            onNativeShare={handleNativeShare}
                            onDownload={ogImageUrl ? handleDownloadImage : undefined}
                            onCopyLink={handleCopyLink}
                            onClose={() => setShowMenu(false)}
                            labels={labels}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ── Compact variant: icon-only ──
    if (variant === "compact") {
        return (
            <motion.button
                onClick={handleNativeShare}
                className={`p-2 rounded-lg bg-white/5 text-white/50 hover:text-white/80 transition-colors ${className}`}
                whileTap={{ scale: 0.9 }}
            >
                {mode === "success" ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            </motion.button>
        );
    }

    // ── Default variant ──
    return (
        <div className={`relative ${className}`}>
            <motion.button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/50 border border-white/10 hover:brightness-110 active:scale-[0.97] transition-all"
                whileTap={{ scale: 0.97 }}
            >
                {mode === "success" ? (
                    <><Check size={14} className="text-emerald-400" /> {labels.copied}</>
                ) : (
                    <><Share2 size={14} /> {labels.share}</>
                )}
            </motion.button>

            <AnimatePresence>
                {showMenu && (
                    <ShareDropdown
                        onNativeShare={handleNativeShare}
                        onDownload={ogImageUrl ? handleDownloadImage : undefined}
                        onCopyLink={handleCopyLink}
                        onClose={() => setShowMenu(false)}
                        labels={labels}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Shared Dropdown ──
function ShareDropdown({
    onNativeShare,
    onDownload,
    onCopyLink,
    onClose,
    labels,
}: {
    onNativeShare: () => void;
    onDownload?: () => void;
    onCopyLink: () => void;
    onClose: () => void;
    labels: Record<string, string>;
}) {
    return (
        <>
            {/* Backdrop */}
            <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <motion.div
                className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-xl bg-[#1a1a2e] border border-white/10 p-2 shadow-xl min-w-[200px]"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
            >
                <button onClick={onNativeShare} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 transition-colors">
                    <Share2 size={14} /> {labels.share}
                </button>
                {onDownload && (
                    <button onClick={onDownload} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 transition-colors">
                        <Download size={14} /> {labels.download}
                    </button>
                )}
                <button onClick={onCopyLink} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 transition-colors">
                    <Copy size={14} /> {labels.copy}
                </button>
            </motion.div>
        </>
    );
}
