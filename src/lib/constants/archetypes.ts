import {
    Users,        // The Peer (Connection)
    Zap,          // The Wildcard (Spark)
    Palette,      // The Muse (Creativity)
    Mic2,         // The Icon (Voice)
    Compass,      // The Voyager (Exploration)
    Layout,       // The Architect (Structure)
    ShieldAlert,  // The Maverick (Protection/Power)
    Crown,        // The Royal (Authority)
    Eye,          // The Enigma (Insight)
    HeartPulse,   // The Healer (Life)
    LucideIcon
} from 'lucide-react';

// ═══════════════════════════════════════════════════════
// OHANG Visual Identity System v3.1
// "Cyber-Mystic" Theme for Global Gen-Z Appeal
// ═══════════════════════════════════════════════════════

// 1. Elemental Color Palette (Neon-Pastel for Dark Mode)
export const ELEMENT_COLORS = {
    Wood: {
        base: '#00E676', // Neon Mint
        glow: '0 0 20px rgba(0, 230, 118, 0.6)',
        gradient: 'from-[#00E676] to-[#00C853]',
        text: 'text-[#00E676]'
    },
    Fire: {
        base: '#FF3D00', // Neon Orange-Red
        glow: '0 0 20px rgba(255, 61, 0, 0.6)',
        gradient: 'from-[#FF3D00] to-[#DD2C00]',
        text: 'text-[#FF3D00]'
    },
    Earth: {
        base: '#FFC400', // Neon Amber/Gold
        glow: '0 0 20px rgba(255, 196, 0, 0.6)',
        gradient: 'from-[#FFC400] to-[#FFAB00]',
        text: 'text-[#FFC400]'
    },
    Metal: {
        base: '#E0E0E0', // Platinum/Silver
        glow: '0 0 20px rgba(224, 224, 224, 0.6)',
        gradient: 'from-[#E0E0E0] to-[#9E9E9E]',
        text: 'text-[#E0E0E0]'
    },
    Water: {
        base: '#2979FF', // Electric Blue
        glow: '0 0 20px rgba(41, 121, 255, 0.6)',
        gradient: 'from-[#2979FF] to-[#2962FF]',
        text: 'text-[#2979FF]'
    }
} as const;

export type ElementType = keyof typeof ELEMENT_COLORS;

// 2. Archetype Theme Definition (UI Context Integration)
export interface ArchetypeTheme {
    id: string;          // Internal ID
    label: string;       // Display Name (The Maverick, etc.)
    icon: LucideIcon;    // Visual Symbol
    element: ElementType;
    color: string;       // Hex for Canvas/OG
    bgGradient: string;  // Tailwind Glassmorphism bg
    description: string; // Short essence for metadata
}

// 3. The Master Mapping Object
export const ARCHETYPE_THEMES: Record<string, ArchetypeTheme> = {
    // 🌲 WOOD FAMILY (Growth)
    'The Peer': {
        id: 'peer',
        label: 'The Peer',
        icon: Users,
        element: 'Wood',
        color: ELEMENT_COLORS.Wood.base,
        bgGradient: 'bg-gradient-to-br from-green-900/40 via-emerald-900/40 to-black',
        description: 'The Connector & Equal'
    },
    'The Wildcard': {
        id: 'wildcard',
        label: 'The Wildcard',
        icon: Zap,
        element: 'Wood',
        color: ELEMENT_COLORS.Wood.base, // Sharing Wood base but different gradient nuance
        bgGradient: 'bg-gradient-to-br from-lime-900/40 via-green-900/40 to-black',
        description: 'The Competitive Spark'
    },

    // 🔥 FIRE FAMILY (Passion)
    'The Muse': {
        id: 'muse',
        label: 'The Muse',
        icon: Palette,
        element: 'Fire',
        color: ELEMENT_COLORS.Fire.base,
        bgGradient: 'bg-gradient-to-br from-red-900/40 via-orange-900/40 to-black',
        description: 'The Creative Soul'
    },
    'The Icon': {
        id: 'icon',
        label: 'The Icon',
        icon: Mic2,
        element: 'Fire',
        color: ELEMENT_COLORS.Fire.base,
        bgGradient: 'bg-gradient-to-br from-orange-900/40 via-amber-900/40 to-black',
        description: 'The Rebel Voice'
    },

    // ⛰️ EARTH FAMILY (Stability)
    'The Voyager': {
        id: 'voyager',
        label: 'The Voyager',
        icon: Compass,
        element: 'Earth',
        color: ELEMENT_COLORS.Earth.base,
        bgGradient: 'bg-gradient-to-br from-yellow-900/40 via-amber-900/40 to-black',
        description: 'The Expansive Explorer'
    },
    'The Architect': {
        id: 'architect',
        label: 'The Architect',
        icon: Layout,
        element: 'Earth',
        color: ELEMENT_COLORS.Earth.base,
        bgGradient: 'bg-gradient-to-br from-amber-900/40 via-brown-900/40 to-black',
        description: 'The Strategic Builder'
    },

    // ⚔️ METAL FAMILY (Power)
    'The Maverick': {
        id: 'maverick',
        label: 'The Maverick',
        icon: ShieldAlert,
        element: 'Metal',
        color: ELEMENT_COLORS.Metal.base,
        bgGradient: 'bg-gradient-to-br from-slate-800/60 via-gray-800/60 to-black',
        description: 'The Charismatic Leader'
    },
    'The Royal': {
        id: 'royal',
        label: 'The Royal',
        icon: Crown,
        element: 'Metal',
        color: ELEMENT_COLORS.Metal.base,
        bgGradient: 'bg-gradient-to-br from-zinc-800/60 via-stone-800/60 to-black',
        description: 'The Dignified Ruler'
    },

    // 💧 WATER FAMILY (Wisdom)
    'The Enigma': {
        id: 'enigma',
        label: 'The Enigma',
        icon: Eye,
        element: 'Water',
        color: ELEMENT_COLORS.Water.base,
        bgGradient: 'bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black',
        description: 'The Intuitive Mystic'
    },
    'The Healer': {
        id: 'healer',
        label: 'The Healer',
        icon: HeartPulse,
        element: 'Water',
        color: ELEMENT_COLORS.Water.base,
        bgGradient: 'bg-gradient-to-br from-blue-900/40 via-cyan-900/40 to-black',
        description: 'The Nurturing Guardian'
    }
};

// 4. Helper Function for Safe Access (Prevents UI Crash)
export function getArchetypeTheme(name: string): ArchetypeTheme {
    // Normalize input and fallback to 'The Enigma' if not found
    return ARCHETYPE_THEMES[name] || ARCHETYPE_THEMES['The Enigma'];
}
