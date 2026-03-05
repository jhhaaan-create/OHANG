"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CompatibilitySchema } from "@/lib/ai/schemas";
import { useStreamingResult } from "@/hooks/useStreamingResult";
import { useInviteRealtime } from "@/hooks/useInviteRealtime";
import { useTone } from "@/lib/tone/ToneProvider";
import { buildShareUrl, share } from "@/lib/sharing/shareUtils";
import CelestialLoading from "@/components/celestial/CelestialLoading";
import CompatibilityResult from "@/components/chemistry/organisms/CompatibilityResult";
import ErrorFallback from "@/components/ui/ErrorFallback";
import ToneSwitcher from "@/components/tone/molecules/ToneSwitcher";
import ShareSheet from "@/components/sharing/organisms/ShareSheet";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Chemistry Client — Interactive Form + Streaming
// ═══════════════════════════════════════════════════════

interface PersonForm {
    year: string;
    month: string;
    day: string;
    hour: string;
    gender: "male" | "female";
}

const EMPTY_PERSON: PersonForm = { year: "", month: "", day: "", hour: "", gender: "female" };

export default function ChemistryClient() {
    const router = useRouter();
    const [personA, setPersonA] = useState<PersonForm>(EMPTY_PERSON);
    const [personB, setPersonB] = useState<PersonForm>(EMPTY_PERSON);
    const [showShare, setShowShare] = useState(false);
    const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const { tone } = useTone();

    // ── Realtime: notify when partner completes ──
    useInviteRealtime({
        inviteId: activeInviteId ?? "",
        enabled: !!activeInviteId,
        onPartnerComplete: (partnerResultId) => {
            router.push(`/chemistry/result?b=${partnerResultId}`);
        },
    });

    const { data, isLoading, error, request, clearError } = useStreamingResult({
        api: "/api/analyze/compatibility",
        schema: CompatibilitySchema,
        onComplete: () => haptic.destiny(),
    });

    const handleSubmit = useCallback(() => {
        if (!personA.year || !personB.year) return;
        haptic.press();
        clearError();
        request({
            personA: {
                year: Number(personA.year),
                month: Number(personA.month),
                day: Number(personA.day),
                hour: personA.hour ? Number(personA.hour) : null,
                gender: personA.gender,
            },
            personB: {
                year: Number(personB.year),
                month: Number(personB.month),
                day: Number(personB.day),
                hour: personB.hour ? Number(personB.hour) : null,
                gender: personB.gender,
            },
            tone,
        });
    }, [personA, personB, tone, request, clearError]);

    if (isLoading && !data?.chemistry_label) {
        return <CelestialLoading element="Fire" />;
    }

    if (error) {
        return (
            <ErrorFallback
                type={error.type}
                message={error.message}
                retryAfterMs={error.retryAfterMs}
                onRetry={handleSubmit}
            />
        );
    }

    // ── Create invite link for partner ──
    const handleCreateInvite = useCallback(async () => {
        haptic.press();
        try {
            const res = await fetch("/api/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create",
                    resultId: "latest",
                }),
            });
            const result = await res.json();
            if (result.inviteUrl) {
                setInviteUrl(result.inviteUrl);
                setActiveInviteId(result.invite?.id ?? null);
                try {
                    await share({
                        title: "Check our chemistry on OHANG 💜",
                        text: "I just got my soul blueprint. Want to see our compatibility?",
                        url: result.inviteUrl,
                    });
                } catch {
                    // User cancelled share — URL is still available
                }
            }
        } catch {
            console.error("[ChemistryClient] Failed to create invite");
        }
    }, []);

    if (data?.chemistry_label) {
        return (
            <>
                <CompatibilityResult
                    data={data}
                    isStreaming={isLoading}
                    onShare={() => setShowShare(true)}
                />

                {/* Invite Partner CTA */}
                <div className="mt-6 space-y-3">
                    <button
                        onClick={handleCreateInvite}
                        className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white border border-white/10 shadow-lg shadow-violet-500/10 hover:brightness-110 active:scale-[0.97] transition-all"
                    >
                        💜 파트너에게 초대 링크 보내기
                    </button>
                    {inviteUrl && (
                        <p className="text-center text-[10px] text-white/30">
                            초대 링크가 생성되었습니다 — 48시간 유효
                        </p>
                    )}
                </div>

                <ShareSheet
                    isOpen={showShare}
                    onClose={() => setShowShare(false)}
                    payload={{
                        title: `OHANG 궁합: ${data.chemistry_label ?? ""}`,
                        text: data.share_line ?? "우리의 케미를 확인해보세요!",
                        url: buildShareUrl("compatibility", "latest"),
                    }}
                />
            </>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">궁합 분석</h1>
                <p className="text-sm text-white/40">두 사람의 오행 케미를 분석합니다</p>
                <div className="mt-3 flex justify-center">
                    <ToneSwitcher mode="compact" />
                </div>
            </div>

            <PersonFormSection label="나" person={personA} onChange={setPersonA} />
            <PersonFormSection label="상대방" person={personB} onChange={setPersonB} />

            <button
                onClick={handleSubmit}
                disabled={!personA.year || !personB.year || !personA.month || !personB.month || !personA.day || !personB.day}
                className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-sm transition-all hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
                케미 분석하기
            </button>
        </div>
    );
}

function PersonFormSection({ label, person, onChange }: { label: string; person: PersonForm; onChange: (p: PersonForm) => void }) {
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
