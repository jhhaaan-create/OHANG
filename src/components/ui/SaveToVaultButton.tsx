"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Check, X } from "lucide-react";
import { useVaultStore, type VaultLabel } from "@/stores/vaultStore";
import haptic from "@/lib/haptics";

const LABELS: VaultLabel[] = ["Crush", "Ex", "Boss", "Friend", "Enemy", "Partner"];

const LABEL_COLORS: Record<VaultLabel, string> = {
  Crush: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Ex: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Boss: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Friend: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Enemy: "bg-red-500/20 text-red-300 border-red-500/30",
  Partner: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

interface SaveToVaultButtonProps {
  birthData: { year: number; month: number; day: number };
  dominantEnergy: string;
  archetype: string;
}

export default function SaveToVaultButton({
  birthData,
  dominantEnergy,
  archetype,
}: SaveToVaultButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [label, setLabel] = useState<VaultLabel>("Crush");
  const addProfile = useVaultStore((s) => s.addProfile);

  const handleSave = () => {
    if (!name.trim()) return;
    addProfile({ name: name.trim(), label, birthData, dominantEnergy, archetype });
    haptic.success();
    setSaved(true);
    setShowForm(false);
  };

  if (saved) {
    return (
      <motion.div
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <Check size={14} />
        Saved to Vault
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => { haptic.tap(); setShowForm(true); }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 hover:text-white/70 transition-all"
        whileTap={{ scale: 0.96 }}
      >
        <Bookmark size={14} />
        Save to My Vault
      </motion.button>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-4 rounded-2xl bg-[#111]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/40">Save to Vault</span>
              <button onClick={() => setShowForm(false)} className="text-white/20 hover:text-white/50">
                <X size={14} />
              </button>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Their name..."
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:outline-none mb-3"
            />

            <div className="flex flex-wrap gap-1.5 mb-3">
              {LABELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLabel(l)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                    label === l ? LABEL_COLORS[l] : "bg-white/[0.02] border-white/[0.06] text-white/30"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full py-2 rounded-lg text-sm font-medium bg-violet-600/80 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-violet-600 transition-colors"
            >
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
