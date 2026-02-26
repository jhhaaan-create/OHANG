"use client";

import { useState, useCallback, useRef } from "react";
import { Camera, X } from "lucide-react";
import { FaceReadingSchema } from "@/lib/ai/schemas";
import { useStreamingResult } from "@/hooks/useStreamingResult";
import { useTone } from "@/lib/tone/ToneProvider";
import { buildShareUrl } from "@/lib/sharing/shareUtils";
import CelestialLoading from "@/components/celestial/CelestialLoading";
import FaceReadingResult from "@/components/face-reading/organisms/FaceReadingResult";
import ErrorFallback from "@/components/ui/ErrorFallback";
import ToneSwitcher from "@/components/tone/molecules/ToneSwitcher";
import ShareSheet from "@/components/sharing/organisms/ShareSheet";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Face Reading Client — Upload + Vision Analysis
// ═══════════════════════════════════════════════════════

export default function FaceReadingClient() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [isFallback, setIsFallback] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { tone } = useTone();

    const { data, isLoading, error, request, clearError } = useStreamingResult({
        api: "/api/analyze/face-reading",
        schema: FaceReadingSchema,
        onComplete: (result) => {
            haptic.reveal();
            if (result.confidence === "low") setIsFallback(true);
        },
    });

    const handleUpload = useCallback(async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Upload failed");
            const { url } = await res.json();
            setImageUrl(url);
            haptic.success();
        } catch {
            haptic.warning();
        } finally {
            setUploading(false);
        }
    }, []);

    const handleAnalyze = useCallback(() => {
        if (!imageUrl) return;
        haptic.press();
        clearError();
        setIsFallback(false);
        request({ imageUrl, tone });
    }, [imageUrl, tone, request, clearError]);

    if (isLoading && !data?.face_archetype) {
        return <CelestialLoading element="Water" />;
    }

    if (error) {
        return <ErrorFallback type={error.type} message={error.message} onRetry={handleAnalyze} />;
    }

    if (data?.face_archetype) {
        return (
            <>
                <FaceReadingResult
                    data={data}
                    isStreaming={isLoading}
                    isFallback={isFallback}
                    onShare={() => setShowShare(true)}
                />
                <ShareSheet
                    isOpen={showShare}
                    onClose={() => setShowShare(false)}
                    payload={{
                        title: `OHANG 관상: ${data.face_archetype ?? ""}`,
                        text: data.share_line ?? "내 관상을 확인해보세요!",
                        url: buildShareUrl("face", "latest"),
                    }}
                />
            </>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">AI 관상 분석</h1>
                <p className="text-sm text-white/40">얼굴 사진에서 오행 에너지를 읽어냅니다</p>
                <div className="mt-3 flex justify-center">
                    <ToneSwitcher mode="compact" />
                </div>
            </div>

            <div className="relative">
                {imageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="Uploaded face" className="w-full aspect-square object-cover" />
                        <button
                            onClick={() => { setImageUrl(null); haptic.tap(); }}
                            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white/70 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 bg-white/[0.02] flex flex-col items-center justify-center gap-3 transition-colors"
                    >
                        {uploading ? (
                            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                                    <Camera size={24} className="text-white/30" />
                                </div>
                                <p className="text-sm text-white/50">사진 업로드</p>
                                <p className="text-xs text-white/20">정면 사진을 권장합니다</p>
                            </>
                        )}
                    </button>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }}
                />
            </div>

            {imageUrl && (
                <button
                    onClick={handleAnalyze}
                    className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-sm transition-all hover:bg-white/15 active:scale-[0.98]"
                >
                    관상 분석하기
                </button>
            )}

            <p className="text-[10px] text-center text-white/15 px-6">
                사진은 분석 후 즉시 삭제됩니다. 인종, 나이, 외모 평가는 하지 않습니다.
            </p>
        </div>
    );
}
