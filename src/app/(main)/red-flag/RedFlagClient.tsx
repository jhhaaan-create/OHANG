"use client";

import { useState, useCallback } from "react";
import { RedFlagSchema } from "@/lib/ai/schemas";
import { useStreamingResult } from "@/hooks/useStreamingResult";
import { useTone } from "@/lib/tone/ToneProvider";
import CelestialLoading from "@/components/celestial/CelestialLoading";
import RedFlagResult from "@/components/red-flag/organisms/RedFlagResult";
import ErrorFallback from "@/components/ui/ErrorFallback";
import ToneSwitcher from "@/components/tone/molecules/ToneSwitcher";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Red Flag Radar Client — Dual Input Form + Streaming
// ═══════════════════════════════════════════════════════

interface PersonForm {
    year: string;
    month: string;
    day: string;
    hour: string;
    gender: "male" | "female";
}

const EMPTY: PersonForm = { year: "", month: "", day: "", hour: "", gender: "female" };

export default function RedFlagClient() {
    const [user, setUser] = useState<PersonForm>(EMPTY);
    const [partner, setPartner] = useState<PersonForm>(EMPTY);
    const { tone } = useTone();

    const { data, isLoading, error, request, clearError } = useStreamingResult({
        api: "/api/analyze/red-flag",
        schema: RedFlagSchema,
        onComplete: () => haptic.warning(),
    });

    const handleSubmit = useCallback(() => {
        if (!user.year || !partner.year) return;
        haptic.press();
        clearError();
        request({
            user: {
                year: Number(user.year), month: Number(user.month), day: Number(user.day),
                hour: user.hour ? Number(user.hour) : null, gender: user.gender,
            },
            partner: {
                year: Number(partner.year), month: Number(partner.month), day: Number(partner.day),
                hour: partner.hour ? Number(partner.hour) : null, gender: partner.gender,
            },
            tone,
        });
    }, [user, partner, tone, request, clearError]);

    if (isLoading && !data?.risk_level) return <CelestialLoading element="Metal" />;
    if (error) return <ErrorFallback type={error.type} message={error.message} onRetry={handleSubmit} />;
    if (data?.risk_level) return <RedFlagResult data={data} isStreaming={isLoading} />;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">레드플래그 레이더</h1>
                <p className="text-sm text-white/40">이 사람, 사귀어도 될까?</p>
                <div className="mt-3 flex justify-center"><ToneSwitcher mode="compact" /></div>
            </div>

            <FormSection label="나" person={user} onChange={setUser} />
            <FormSection label="상대방" person={partner} onChange={setPartner} />

            <button
                onClick={handleSubmit}
                disabled={!user.year || !partner.year || !user.month || !partner.month || !user.day || !partner.day}
                className="w-full py-4 rounded-xl bg-red-500/10 text-red-300 font-semibold text-sm border border-red-500/20 transition-all hover:bg-red-500/15 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
                위험 신호 분석하기
            </button>
        </div>
    );
}

function FormSection({ label, person, onChange }: { label: string; person: PersonForm; onChange: (p: PersonForm) => void }) {
    const cls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors";
    return (
        <div className="space-y-3">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</h3>
            <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="년도" value={person.year} onChange={(e) => onChange({ ...person, year: e.target.value })} className={cls} />
                <input type="number" placeholder="월" value={person.month} onChange={(e) => onChange({ ...person, month: e.target.value })} className={cls} />
                <input type="number" placeholder="일" value={person.day} onChange={(e) => onChange({ ...person, day: e.target.value })} className={cls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="시 (선택)" value={person.hour} onChange={(e) => onChange({ ...person, hour: e.target.value })} className={cls} />
                <select value={person.gender} onChange={(e) => onChange({ ...person, gender: e.target.value as "male" | "female" })} className={cls}>
                    <option value="female">여성</option>
                    <option value="male">남성</option>
                </select>
            </div>
        </div>
    );
}
