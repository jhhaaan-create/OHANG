import type { Metadata } from "next";
import dynamic from "next/dynamic";

const DashboardClient = dynamic(() => import("./DashboardClient"), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" /></div>,
});

// ═══════════════════════════════════════════════════════
// Dashboard Page — Server Component Shell
// Daily Vibe + Feature Navigation Hub
// ═══════════════════════════════════════════════════════

export const metadata: Metadata = {
    title: "대시보드 | OHANG",
    description: "오늘의 운세와 OHANG 분석 기능을 확인하세요.",
};

export default function DashboardPage() {
    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-lg mx-auto px-4 pt-8">
                <DashboardClient />
            </div>
        </div>
    );
}
