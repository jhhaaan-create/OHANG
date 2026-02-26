import type { Metadata } from "next";
import dynamic from "next/dynamic";

const ChemistryClient = dynamic(() => import("./ChemistryClient"), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" /></div>,
});

// ═══════════════════════════════════════════════════════
// Chemistry Page — Server Component Shell
// Imports client component for interactive form + streaming.
// ═══════════════════════════════════════════════════════

export const metadata: Metadata = {
    title: "궁합 분석 | OHANG",
    description: "두 사람의 오행 에너지를 분석하세요. 518,400가지 조합에서 당신들만의 케미를 발견하세요.",
    openGraph: {
        title: "궁합 분석 | OHANG",
        description: "우주가 설계한 두 사람의 케미를 확인하세요.",
    },
};

export default function ChemistryPage() {
    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-lg mx-auto px-4 pt-12">
                <ChemistryClient />
            </div>
        </div>
    );
}
