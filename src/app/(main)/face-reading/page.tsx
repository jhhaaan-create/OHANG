import type { Metadata } from "next";
import dynamic from "next/dynamic";

const FaceReadingClient = dynamic(() => import("./FaceReadingClient"), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" /></div>,
});

// ═══════════════════════════════════════════════════════
// Face Reading Page — Server Component Shell
// ═══════════════════════════════════════════════════════

export const metadata: Metadata = {
    title: "관상 분석 | OHANG",
    description: "AI가 당신의 얼굴에서 오행 에너지를 읽어냅니다. K-관상의 새로운 경험.",
    openGraph: {
        title: "관상 분석 | OHANG",
        description: "당신의 얼굴이 말하는 오행 에너지를 확인하세요.",
    },
};

export default function FaceReadingPage() {
    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-lg mx-auto px-4 pt-12">
                <FaceReadingClient />
            </div>
        </div>
    );
}
