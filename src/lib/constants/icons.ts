import {
    Users,        // The Peer
    Zap,          // The Wildcard
    Palette,      // The Muse
    Mic2,         // The Icon
    Compass,      // The Voyager
    Layout,       // The Architect
    ShieldAlert,  // The Maverick
    Crown,        // The Royal
    Eye,          // The Enigma
    HeartPulse,   // The Healer
    LucideIcon    // Type Definition
} from 'lucide-react';

// ═══════════════════════════════════════════════════════
// OHANG Visual Identity System
// Maps 10 Archetypes to unique Lucide Icons & Brand Colors
// ═══════════════════════════════════════════════════════

export type ArchetypeName =
    | 'The Peer' | 'The Wildcard'
    | 'The Muse' | 'The Icon'
    | 'The Voyager' | 'The Architect'
    | 'The Maverick' | 'The Royal'
    | 'The Enigma' | 'The Healer';

interface ArchetypeVisual {
    icon: LucideIcon;
    color: string;
    description: string; // Internal design note
}

export const ARCHETYPE_VISUALS: Record<ArchetypeName, ArchetypeVisual> = {
    // 🌲 WOOD FAMILY (Growth & Connection)
    'The Peer': {
        icon: Users,
        color: '#4CAF50', // Fresh Green
        description: 'Loyal companion, networker, equal'
    },
    'The Wildcard': {
        icon: Zap,
        color: '#8BC34A', // Electric Lime
        description: 'Competitive spark, sudden change, intensity'
    },

    // 🔥 FIRE FAMILY (Expression & Passion)
    'The Muse': {
        icon: Palette,
        color: '#FF5722', // Deep Orange
        description: 'Creative soul, artist, pleasure seeker'
    },
    'The Icon': {
        icon: Mic2,
        color: '#FF9800', // Vivid Orange
        description: 'Rebel voice, amplifier, trendsetter'
    },

    // ⛰️ EARTH FAMILY (Stability & Expansion)
    'The Voyager': {
        icon: Compass,
        color: '#FFC107', // Amber
        description: 'Risk taker, explorer, big picture'
    },
    'The Architect': {
        icon: Layout,
        color: '#795548', // Grounded Brown
        description: 'Strategic planner, builder, detail-oriented'
    },

    // ⚔️ METAL FAMILY (Authority & Principle)
    'The Maverick': {
        icon: ShieldAlert,
        color: '#607D8B', // Blue Grey
        description: 'Natural leader, charismatic protector'
    },
    'The Royal': {
        icon: Crown,
        color: '#9E9E9E', // Noble Grey/Silver
        description: 'Dignified authority, standard bearer'
    },

    // 💧 WATER FAMILY (Wisdom & Care)
    'The Enigma': {
        icon: Eye,
        color: '#673AB7', // Mystic Purple
        description: 'Intuitive mystic, insight, mystery'
    },
    'The Healer': {
        icon: HeartPulse,
        color: '#2196F3', // Calming Blue
        description: 'Nurturing presence, unconditional support'
    }
};

/**
 * Helper to get visual props safely
 * Fallback to 'The Enigma' (Mystery) if mapping fails
 */
export function getArchetypeVisual(name: string): ArchetypeVisual {
    // Normalize string just in case
    const key = name as ArchetypeName;
    return ARCHETYPE_VISUALS[key] || ARCHETYPE_VISUALS['The Enigma'];
}
