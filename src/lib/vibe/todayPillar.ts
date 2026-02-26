// ═══════════════════════════════════════════════════════
// OHANG — Today's Pillar Calculator
// Calculates today's Heavenly Stem + Earthly Branch
// using the sexagenary cycle (60-day cycle, 甲子 system).
// ═══════════════════════════════════════════════════════

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

const STEM_ELEMENT: Record<string, string> = {
    '甲': 'Wood', '乙': 'Wood', '丙': 'Fire', '丁': 'Fire',
    '戊': 'Earth', '己': 'Earth', '庚': 'Metal', '辛': 'Metal',
    '壬': 'Water', '癸': 'Water',
};

const BRANCH_ELEMENT: Record<string, string> = {
    '子': 'Water', '丑': 'Earth', '寅': 'Wood', '卯': 'Wood',
    '辰': 'Earth', '巳': 'Fire', '午': 'Fire', '未': 'Earth',
    '申': 'Metal', '酉': 'Metal', '戌': 'Earth', '亥': 'Water',
};

/**
 * Reference epoch: January 1, 1970 (甲子日 = stem index 0, branch index 0).
 * Actually, 1970-01-01 was a 庚午 day (stem=6, branch=6).
 * We offset by these known indices.
 */
const EPOCH = new Date(Date.UTC(1970, 0, 1));
const EPOCH_STEM_INDEX = 6;    // 庚 = index 6
const EPOCH_BRANCH_INDEX = 6;  // 午 = index 6

export interface TodayPillar {
    heavenly_stem: string;
    earthly_branch: string;
    stem_element: string;
    branch_element: string;
    dominant_element: string;
    pillar: string;       // e.g. "甲子"
    date: string;          // ISO date
}

/**
 * Calculate the day pillar for a given date using the sexagenary cycle.
 */
export function getTodayPillar(date: Date = new Date()): TodayPillar {
    // Calculate days since epoch (UTC)
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const daysSinceEpoch = Math.floor((utcDate.getTime() - EPOCH.getTime()) / (24 * 60 * 60 * 1000));

    const stemIndex = ((daysSinceEpoch + EPOCH_STEM_INDEX) % 10 + 10) % 10;
    const branchIndex = ((daysSinceEpoch + EPOCH_BRANCH_INDEX) % 12 + 12) % 12;

    const stem = HEAVENLY_STEMS[stemIndex];
    const branch = EARTHLY_BRANCHES[branchIndex];
    const stemEl = STEM_ELEMENT[stem];
    const branchEl = BRANCH_ELEMENT[branch];

    // Dominant = whichever of stem/branch has more "weight" (stem wins ties)
    const dominant = stemEl;

    return {
        heavenly_stem: stem,
        earthly_branch: branch,
        stem_element: stemEl,
        branch_element: branchEl,
        dominant_element: dominant,
        pillar: `${stem}${branch}`,
        date: utcDate.toISOString().split('T')[0],
    };
}

/**
 * Parse a date string like "2025-06-15" to a Date in KST context.
 */
export function parseKSTDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}
