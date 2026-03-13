import { create } from "zustand";
import { persist } from "zustand/middleware";

// ══════════════════════════════════════════════════════════
// OHANG Social Vault — Zustand + localStorage
// Zero-friction storage for saved profiles & contacts.
// ══════════════════════════════════════════════════════════

export type VaultLabel = "Crush" | "Ex" | "Boss" | "Friend" | "Enemy" | "Partner";

export interface VaultProfile {
  id: string;
  name: string;
  label: VaultLabel;
  birthData: { year: number; month: number; day: number };
  dominantEnergy: string;
  archetype: string;
  savedAt: string; // ISO date
}

interface VaultState {
  profiles: VaultProfile[];
  addProfile: (profile: Omit<VaultProfile, "id" | "savedAt">) => string;
  removeProfile: (id: string) => void;
  getProfiles: () => VaultProfile[];
  getProfileById: (id: string) => VaultProfile | undefined;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      profiles: [],

      addProfile: (profile) => {
        const id = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const newProfile: VaultProfile = {
          ...profile,
          id,
          savedAt: new Date().toISOString(),
        };
        set((state) => ({ profiles: [...state.profiles, newProfile] }));
        return id;
      },

      removeProfile: (id) => {
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
        }));
      },

      getProfiles: () => get().profiles,

      getProfileById: (id) => get().profiles.find((p) => p.id === id),
    }),
    {
      name: "ohang-vault",
    }
  )
);
