"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Invite Landing — Partner enters birth data
//
// Flow:
// 1. Validate token via /api/invite { action: 'lookup' }
// 2. Show romantic/mystical birth form
// 3. On submit: redirect to /chemistry with invite context
// 4. POST /api/invite { action: 'complete' } → triggers
//    Supabase Realtime notification to creator
// ═══════════════════════════════════════════════════════

type InviteStatus = "loading" | "valid" | "expired" | "error";

interface InviteData {
    id: string;
    status: string;
    expiresAt: string;
}

export default function InviteClient({ token }: { token: string }) {
    const router = useRouter();
    const [status, setStatus] = useState<InviteStatus>("loading");
    const [, setInvite] = useState<InviteData | null>(null);
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");
    const [hour, setHour] = useState("");
    const [gender, setGender] = useState<"male" | "female">("female");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Validate token on mount ──
    useEffect(() => {
        async function validate() {
            try {
                const res = await fetch("/api/invite", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "lookup", token }),
                });
                if (res.status === 410) {
                    setStatus("expired");
                    return;
                }
                if (!res.ok) {
                    setStatus("error");
                    return;
                }
                const data = await res.json();
                if (data.valid) {
                    setInvite(data.invite);
                    setStatus("valid");
                    // Mark as accepted
                    fetch("/api/invite", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "accept", token }),
                    });
                } else {
                    setStatus("error");
                }
            } catch {
                setStatus("error");
            }
        }
        validate();
    }, [token]);

    // ── Submit partner data ──
    const handleSubmit = useCallback(async () => {
        if (!year || !month || !day || isSubmitting) return;
        setIsSubmitting(true);
        haptic.press();

        try {
            const searchParams = new URLSearchParams({
                year,
                month,
                day,
                ...(hour && { hour }),
                gender,
                invite: token,
            });

            router.push(`/chemistry?${searchParams.toString()}`);
        } catch {
            setIsSubmitting(false);
        }
    }, [year, month, day, hour, gender, token, isSubmitting, router]);

    // ── Render states ──
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-white/50 text-lg"
                >
                    Loading your invitation\u2026
                </motion.div>
            </div>
        );
    }

    if (status === "expired") {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-2xl">\u23f0</p>
                <h1 className="text-xl font-semibold text-white">This invite has expired</h1>
                <p className="text-white/50 text-sm max-w-xs">
                    Chemistry invites are valid for 48 hours. Ask your partner to send a new one!
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium"
                >
                    Discover Your Own Blueprint
                </button>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-2xl">\ud83d\udd17</p>
                <h1 className="text-xl font-semibold text-white">Invalid invite link</h1>
                <p className="text-white/50 text-sm max-w-xs">
                    This link may have been used already or is no longer valid.
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium"
                >
                    Try OHANG Free
                </button>
            </div>
        );
    }

    // ── Valid invite: birth form ──
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white px-6 py-12 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm space-y-8"
            >
                {/* Header */}
                <div className="text-center space-y-3">
                    <p className="text-3xl">\ud83d\udc9c</p>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                        Someone wants to know your chemistry
                    </h1>
                    <p className="text-white/50 text-sm">
                        Enter your birth date to reveal your cosmic connection
                    </p>
                </div>

                {/* Birth form */}
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            type="number"
                            placeholder="Year"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                            min="1920"
                            max="2026"
                        />
                        <input
                            type="number"
                            placeholder="Month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                            min="1"
                            max="12"
                        />
                        <input
                            type="number"
                            placeholder="Day"
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                            min="1"
                            max="31"
                        />
                    </div>

                    <input
                        type="number"
                        placeholder="Birth Hour (optional, 0-23)"
                        value={hour}
                        onChange={(e) => setHour(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                        min="0"
                        max="23"
                    />

                    {/* Gender toggle */}
                    <div className="flex gap-3">
                        {(["female", "male"] as const).map((g) => (
                            <button
                                key={g}
                                onClick={() => { setGender(g); haptic.tap(); }}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                                    gender === g
                                        ? "bg-violet-600/30 border-violet-500/50 text-violet-200 border"
                                        : "bg-white/5 border border-white/10 text-white/40"
                                }`}
                            >
                                {g === "female" ? "\u2640 Female" : "\u2642 Male"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit CTA */}
                <motion.button
                    onClick={handleSubmit}
                    disabled={!year || !month || !day || isSubmitting}
                    className="w-full py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isSubmitting ? (
                        <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                        >
                            Decoding your chemistry\u2026
                        </motion.span>
                    ) : (
                        "Reveal Our Chemistry \ud83d\udcab"
                    )}
                </motion.button>

                <p className="text-center text-white/20 text-xs">
                    Free \u00b7 No account required \u00b7 30 seconds
                </p>
            </motion.div>
        </div>
    );
}
