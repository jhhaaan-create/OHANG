"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Trash2, Bell, ChevronRight } from "lucide-react";
import { useVaultStore, type VaultProfile, type VaultLabel } from "@/stores/vaultStore";
import { getDailyChemistry } from "@/lib/utils/dailyChemistry";
import { loadBirthData } from "@/lib/utils/birthDataStore";
import haptic from "@/lib/haptics";

// ══════════════════════════════════════════════════════════
// My Vault — Social Dashboard
// Track saved contacts + daily chemistry scores.
// ══════════════════════════════════════════════════════════

const LABEL_COLORS: Record<VaultLabel, string> = {
    Crush: "bg-pink-500/20 text-pink-300",
    Ex: "bg-amber-500/20 text-amber-300",
    Boss: "bg-blue-500/20 text-blue-300",
    Friend: "bg-emerald-500/20 text-emerald-300",
    Enemy: "bg-red-500/20 text-red-300",
    Partner: "bg-violet-500/20 text-violet-300",
};

const ENERGY_COLORS: Record<string, string> = {
    Wood: "#00E676",
    Fire: "#FF3D00",
    Earth: "#FFC400",
    Metal: "#B0BEC5",
    Water: "#448AFF",
};

const STATUS_EMOJI: Record<string, string> = {
    harmony: "\uD83D\uDFE2",
    volatile: "\uD83D\uDFE1",
    danger: "\uD83D\uDD34",
};

export default function MyVaultPage() {
    const profiles = useVaultStore((s) => s.profiles);
    const removeProfile = useVaultStore((s) => s.removeProfile);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const userBirth = loadBirthData();
    const userBirthData = userBirth
        ? { year: Number(userBirth.year), month: Number(userBirth.month), day: Number(userBirth.day) }
        : null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="container mx-auto px-4 py-8 max-w-lg">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Lock size={18} className="text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white/90">My Vault</h1>
                        <p className="text-xs text-white/30">
                            {profiles.length} {profiles.length === 1 ? "contact" : "contacts"} tracked
                        </p>
                    </div>
                </div>

                {/* Daily Alert Placeholder */}
                {profiles.length > 0 && (
                    <motion.div
                        className="mb-6 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-3">
                            <Bell size={16} className="text-violet-400" />
                            <div className="flex-1">
                                <p className="text-xs font-medium text-violet-300/70">
                                    Daily energy alerts for your Vault contacts
                                </p>
                                <p className="text-[10px] text-white/20 mt-0.5">
                                    Chemistry scores update at midnight
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Empty State */}
                {profiles.length === 0 && (
                    <motion.div
                        className="text-center py-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                            <Lock size={24} className="text-white/15" />
                        </div>
                        <h2 className="text-lg font-semibold text-white/40 mb-2">
                            Your universe is empty
                        </h2>
                        <p className="text-sm text-white/20 max-w-xs mx-auto">
                            Scan someone to start tracking their energy. Use Red Flag Radar, Couple Scan, or Retro Mode.
                        </p>
                    </motion.div>
                )}

                {/* Profile Cards */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {profiles.map((profile, i) => {
                            const chemistry = userBirthData
                                ? getDailyChemistry(userBirthData, profile.birthData, new Date())
                                : null;

                            return (
                                <motion.div
                                    key={profile.id}
                                    className="relative p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    {/* Color accent bar */}
                                    <div
                                        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                                        style={{ backgroundColor: ENERGY_COLORS[profile.dominantEnergy] ?? "#448AFF" }}
                                    />

                                    <div className="flex items-start gap-3 pl-2">
                                        {/* Energy icon */}
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                backgroundColor: `${ENERGY_COLORS[profile.dominantEnergy] ?? "#448AFF"}15`,
                                                border: `1px solid ${ENERGY_COLORS[profile.dominantEnergy] ?? "#448AFF"}30`,
                                            }}
                                        >
                                            <span className="text-lg">
                                                {profile.dominantEnergy === "Wood" ? "\uD83C\uDF3F" :
                                                 profile.dominantEnergy === "Fire" ? "\uD83D\uDD25" :
                                                 profile.dominantEnergy === "Earth" ? "\u26F0\uFE0F" :
                                                 profile.dominantEnergy === "Metal" ? "\u2699\uFE0F" : "\uD83D\uDCA7"}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-white/80 truncate">
                                                    {profile.name}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${LABEL_COLORS[profile.label]}`}>
                                                    {profile.label}
                                                </span>
                                            </div>

                                            <p className="text-[10px] text-white/25 mb-2">
                                                {profile.archetype} · {profile.dominantEnergy} Energy
                                            </p>

                                            {/* Daily Chemistry */}
                                            {chemistry && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs">{STATUS_EMOJI[chemistry.status]}</span>
                                                    <span
                                                        className="text-xs font-bold tabular-nums"
                                                        style={{
                                                            color: chemistry.status === "harmony" ? "#4ade80"
                                                                : chemistry.status === "volatile" ? "#fbbf24" : "#f87171",
                                                        }}
                                                    >
                                                        {chemistry.score}%
                                                    </span>
                                                    <span className="text-[10px] text-white/25 truncate">
                                                        {chemistry.message}
                                                    </span>
                                                </div>
                                            )}
                                            {!chemistry && (
                                                <p className="text-[10px] text-white/15 italic">
                                                    Enter your birth data on /analyze to see daily chemistry
                                                </p>
                                            )}
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={() => {
                                                if (deleteConfirm === profile.id) {
                                                    removeProfile(profile.id);
                                                    haptic.warning();
                                                    setDeleteConfirm(null);
                                                } else {
                                                    setDeleteConfirm(profile.id);
                                                    setTimeout(() => setDeleteConfirm(null), 3000);
                                                }
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${
                                                deleteConfirm === profile.id
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "text-white/15 hover:text-white/30"
                                            }`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
