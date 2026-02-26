import type { Metadata } from "next";
import dynamic from "next/dynamic";

const RedFlagClient = dynamic(() => import("./RedFlagClient"), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" /></div>,
});

// ═══════════════════════════════════════════════════════
// Red Flag Radar Page — Server Component Shell
// ═══════════════════════════════════════════════════════

export const metadata: Metadata = {
    title: "레드플래그 레이더 | OHANG",
    description: "상대방의 위험 신호를 오행 에너지로 분석합니다. 사귀기 전에 확인하세요.",
    openGraph: {
        title: "레드플래그 레이더 | OHANG",
        description: "이 사람, 사귀어도 될까?",
    },
};

export default function RedFlagPage() {
    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-lg mx-auto px-4 pt-12">
                <RedFlagClient />
            </div>
        </div>
    );
}
