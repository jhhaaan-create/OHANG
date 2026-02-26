// ═══════════════════════════════════════════════════════
// OHANG Domain Adapter v3.2 — Saju Logic Translation
// Hardened: Hidden Stems, TenGod-based Secondary, Typed I/O
// ═══════════════════════════════════════════════════════

import type { HeavenlyStem, EarthlyBranch } from './types';

// ── Type Definitions ─────────────────────────────────

/** Raw output from manseryeok calculateSaju() */
export interface ManseryeokResult {
    yearStem: string;
    yearBranch: string;
    monthStem: string;
    monthBranch: string;
    dayStem: string;
    dayBranch: string;
    hourStem: string | null;
    hourBranch: string | null;
    mainTenGod?: string;
    mainArchetype?: string;
}

/** Fully typed context payload for AI Engine consumption */
export interface OHANGContext {
    four_pillars: {
        year: string;
        month: string;
        day: string;
        hour: string | null;
    };
    day_master: {
        stem: string;
        element: string;
    };
    element_balance: Record<string, number>;
    core_strength: string;
    void_element: string;
    void_reason: string;
    archetype: {
        primary: string;
        secondary: string;
    };
}

// ── Constants & Mappings ──────────────────────────────

/** Maps individual Chinese characters (Stems + Branches) to their surface element */
const ELEMENT_MAP: Record<string, string> = {
    // Korean shorthand
    '목': 'Wood', '화': 'Fire', '토': 'Earth', '금': 'Metal', '수': 'Water',
    // Heavenly Stems (천간)
    '甲': 'Wood', '乙': 'Wood', '丙': 'Fire', '丁': 'Fire',
    '戊': 'Earth', '己': 'Earth', '庚': 'Metal', '辛': 'Metal',
    '壬': 'Water', '癸': 'Water',
    // Earthly Branches (지지) — surface element only
    '寅': 'Wood', '卯': 'Wood', '巳': 'Fire', '午': 'Fire',
    '辰': 'Earth', '戌': 'Earth', '丑': 'Earth', '未': 'Earth',
    '申': 'Metal', '酉': 'Metal', '亥': 'Water', '子': 'Water',
};

/**
 * Hidden Stems (지장간/藏干) — The CRITICAL missing piece.
 * Each Earthly Branch contains 1-3 hidden Heavenly Stems.
 * These hidden stems make Saju analysis precise vs. surface-level.
 *
 * Format: [본기(Main Qi), 중기(Middle Qi), 여기(Residual Qi)]
 * 본기 carries the strongest weight, 여기 the weakest.
 */
const HIDDEN_STEMS: Record<string, string[]> = {
    '子': ['癸'],                    // Water
    '丑': ['己', '癸', '辛'],       // Earth, Water, Metal
    '寅': ['甲', '丙', '戊'],       // Wood, Fire, Earth
    '卯': ['乙'],                    // Wood
    '辰': ['戊', '乙', '癸'],       // Earth, Wood, Water
    '巳': ['丙', '庚', '戊'],       // Fire, Metal, Earth
    '午': ['丁', '己'],             // Fire, Earth
    '未': ['己', '丁', '乙'],       // Earth, Fire, Wood
    '申': ['庚', '壬', '戊'],       // Metal, Water, Earth
    '酉': ['辛'],                    // Metal
    '戌': ['戊', '辛', '丁'],       // Earth, Metal, Fire
    '亥': ['壬', '甲'],             // Water, Wood
};

/** Hidden Stem weight multipliers: 본기 1.0, 중기 0.6, 여기 0.3 */
const HIDDEN_STEM_WEIGHTS = [1.0, 0.6, 0.3] as const;

/** TenGod (십성) names -> OHANG Archetype mapping */
const ARCHETYPE_MAP: Record<string, string> = {
    '비견': 'The Peer',     '겁재': 'The Wildcard',
    '식신': 'The Muse',     '상관': 'The Icon',
    '편재': 'The Voyager',  '정재': 'The Architect',
    '편관': 'The Maverick', '정관': 'The Royal',
    '편인': 'The Enigma',   '정인': 'The Healer',
};

/** Generating cycle parent map: Which element GENERATES the key? */
const SUPPORT_MAP: Record<string, string> = {
    'Wood': 'Water', 'Fire': 'Wood', 'Earth': 'Fire',
    'Metal': 'Earth', 'Water': 'Metal',
};

/**
 * TenGod Relationship Table
 * Given a Day Master stem and another stem, returns the TenGod relationship.
 * This is the mathematical foundation for archetype determination.
 */
const TEN_GOD_TABLE: Record<string, Record<string, string>> = {
    // Yang Stems
    '甲': { '甲': '비견', '乙': '겁재', '丙': '식신', '丁': '상관', '戊': '편재', '己': '정재', '庚': '편관', '辛': '정관', '壬': '편인', '癸': '정인' },
    '丙': { '丙': '비견', '丁': '겁재', '戊': '식신', '己': '상관', '庚': '편재', '辛': '정재', '壬': '편관', '癸': '정관', '甲': '편인', '乙': '정인' },
    '戊': { '戊': '비견', '己': '겁재', '庚': '식신', '辛': '상관', '壬': '편재', '癸': '정재', '甲': '편관', '乙': '정관', '丙': '편인', '丁': '정인' },
    '庚': { '庚': '비견', '辛': '겁재', '壬': '식신', '癸': '상관', '甲': '편재', '乙': '정재', '丙': '편관', '丁': '정관', '戊': '편인', '己': '정인' },
    '壬': { '壬': '비견', '癸': '겁재', '甲': '식신', '乙': '상관', '丙': '편재', '丁': '정재', '戊': '편관', '己': '정관', '庚': '편인', '辛': '정인' },
    // Yin Stems
    '乙': { '乙': '비견', '甲': '겁재', '丁': '식신', '丙': '상관', '己': '편재', '戊': '정재', '辛': '편관', '庚': '정관', '癸': '편인', '壬': '정인' },
    '丁': { '丁': '비견', '丙': '겁재', '己': '식신', '戊': '상관', '辛': '편재', '庚': '정재', '癸': '편관', '壬': '정관', '乙': '편인', '甲': '정인' },
    '己': { '己': '비견', '戊': '겁재', '辛': '식신', '庚': '상관', '癸': '편재', '壬': '정재', '乙': '편관', '甲': '정관', '丁': '편인', '丙': '정인' },
    '辛': { '辛': '비견', '庚': '겁재', '癸': '식신', '壬': '상관', '乙': '편재', '甲': '정재', '丁': '편관', '丙': '정관', '己': '편인', '戊': '정인' },
    '癸': { '癸': '비견', '壬': '겁재', '乙': '식신', '甲': '상관', '丁': '편재', '丙': '정재', '己': '편관', '戊': '정관', '辛': '편인', '庚': '정인' },
};

// ── 1. Timezone Utility ─────────────────────────────

export function getTrueSolarTime(
    year: number, month: number, day: number,
    hour: number, minute: number,
    _timezoneOffset?: number
) {
    return { year, month, day, hour, minute };
}

// ── 2. Core Algorithms ──────────────────────────────

/**
 * Calculate Five Elements balance INCLUDING Hidden Stems.
 * This is the corrected version that accounts for the full elemental picture.
 */
function calculateElementBalance(
    stems: (string | null)[],
    branches: (string | null)[]
): Record<string, number> {
    const balance: Record<string, number> = {
        Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0,
    };

    // 1. Heavenly Stems contribute 1.0 each
    for (const stem of stems) {
        if (stem) {
            const el = ELEMENT_MAP[stem];
            if (el) balance[el] += 1.0;
        }
    }

    // 2. Earthly Branches contribute via their Hidden Stems (weighted)
    for (const branch of branches) {
        if (branch && HIDDEN_STEMS[branch]) {
            const hiddenStems = HIDDEN_STEMS[branch];
            hiddenStems.forEach((hs, idx) => {
                const el = ELEMENT_MAP[hs];
                if (el) {
                    balance[el] += HIDDEN_STEM_WEIGHTS[idx] ?? 0.3;
                }
            });
        }
    }

    return balance;
}

/**
 * Calculate Day Master Strength (신강/신약)
 * Factors: 득령(Season), 득지(Day Branch), 득세(Overall Support)
 */
function calculateStrength(
    dayMasterElement: string,
    monthBranch: string,
    dayBranch: string | null,
    balance: Record<string, number>
) {
    let score = 0;
    const parent = SUPPORT_MAP[dayMasterElement];

    // 1. 득령 (Season Support) — Month branch's main qi
    const monthHiddenMain = HIDDEN_STEMS[monthBranch]?.[0];
    if (monthHiddenMain) {
        const monthMainElement = ELEMENT_MAP[monthHiddenMain];
        if (monthMainElement === dayMasterElement) score += 2.0;
        else if (monthMainElement === parent) score += 1.5;
    }

    // 2. 득지 (Day Branch Support) — "Spouse palace" influence
    if (dayBranch && HIDDEN_STEMS[dayBranch]) {
        const dayBranchMain = HIDDEN_STEMS[dayBranch][0];
        if (dayBranchMain) {
            const dayBranchElement = ELEMENT_MAP[dayBranchMain];
            if (dayBranchElement === dayMasterElement) score += 1.5;
            else if (dayBranchElement === parent) score += 1.0;
        }
    }

    // 3. 득세 (Quantity Support) — Total friendly element weight
    const selfWeight = balance[dayMasterElement] || 0;
    const parentWeight = balance[parent] || 0;
    const totalWeight = Object.values(balance).reduce((sum, v) => sum + v, 0);
    const supportRatio = totalWeight > 0 ? (selfWeight + parentWeight) / totalWeight : 0;

    score += supportRatio * 3.0;

    const isStrong = score >= 3.5;
    return {
        isStrong,
        score: Math.round(score * 100) / 100,
        status: isStrong ? 'Strong (Shin-gang)' : 'Delicate (Shin-yak)',
    };
}

/**
 * Determine Dynamic Void (용신/Yongsin)
 */
function determineVoid(
    balance: Record<string, number>,
    dayMasterElement: string,
    isStrong: boolean
): { element: string; reason: string } {
    const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
    const meIdx = elements.indexOf(dayMasterElement);

    const candidates = isStrong
        ? [elements[(meIdx + 1) % 5], elements[(meIdx + 3) % 5], elements[(meIdx + 2) % 5]]
        : [SUPPORT_MAP[dayMasterElement], dayMasterElement];

    const sortedCandidates = [...candidates]
        .filter(Boolean)
        .sort((a, b) => (balance[a] || 0) - (balance[b] || 0));

    const weakest = sortedCandidates[0] || 'Water';

    return {
        element: weakest,
        reason: isStrong
            ? `Strong Core needs ${weakest} to vent or control excess energy.`
            : `Delicate Core needs ${weakest} for support and safety.`,
    };
}

/**
 * Determine TenGod relationship between Day Master and another Stem.
 */
function getTenGodRelation(dayMaster: string, otherStem: string): string | null {
    return TEN_GOD_TABLE[dayMaster]?.[otherStem] ?? null;
}

// ── 3. Main Adapter Export ──────────────────────────

/**
 * Convert SajuChart (from SajuEngine.compute) to ManseryeokResult shape,
 * then produce OHANGContext.
 */
export function formatChartToAiContext(
    chart: { year: { stem: string; branch: string }; month: { stem: string; branch: string }; day: { stem: string; branch: string }; hour: { stem: string; branch: string } },
    options?: { isUnknownTime?: boolean }
): OHANGContext {
    const raw: ManseryeokResult = {
        yearStem: chart.year.stem,
        yearBranch: chart.year.branch,
        monthStem: chart.month.stem,
        monthBranch: chart.month.branch,
        dayStem: chart.day.stem,
        dayBranch: chart.day.branch,
        hourStem: options?.isUnknownTime ? null : chart.hour.stem,
        hourBranch: options?.isUnknownTime ? null : chart.hour.branch,
    };
    return formatToAiContext(raw);
}

export function formatToAiContext(rawSaju: ManseryeokResult): OHANGContext {
    // 1. Extract Day Master
    const dayMaster = rawSaju.dayStem || '甲';
    const dmElement = ELEMENT_MAP[dayMaster] || 'Wood';

    // 2. Extract all stems and branches
    const stems = [rawSaju.yearStem, rawSaju.monthStem, rawSaju.dayStem, rawSaju.hourStem];
    const branches = [rawSaju.yearBranch, rawSaju.monthBranch, rawSaju.dayBranch, rawSaju.hourBranch];

    // 3. Calculate element balance WITH Hidden Stems
    const balance = calculateElementBalance(stems, branches);

    // 4. Core strength assessment (3-factor: 득령 + 득지 + 득세)
    const monthBranch = rawSaju.monthBranch || '寅';
    const dayBranch = rawSaju.dayBranch || null;
    const strength = calculateStrength(dmElement, monthBranch, dayBranch, balance);

    // 5. Determine Void Element
    const voidData = determineVoid(balance, dmElement, strength.isStrong);

    // 6. Primary Archetype — from manseryeok's TenGod or fallback calculation
    const primaryTenGod = rawSaju.mainTenGod
        || getTenGodRelation(dayMaster, rawSaju.monthStem || '甲')
        || '비견';
    const primaryArchetype = ARCHETYPE_MAP[primaryTenGod] || 'The Peer';

    // 7. Secondary Archetype — from Month Stem's TenGod with Day Master
    const monthStem = rawSaju.monthStem;
    const secondaryTenGod = monthStem ? getTenGodRelation(dayMaster, monthStem) : null;
    let secondaryArchetype: string;

    if (secondaryTenGod && secondaryTenGod !== primaryTenGod) {
        secondaryArchetype = ARCHETYPE_MAP[secondaryTenGod] || 'The Peer';
    } else {
        // If month stem produces same archetype, fallback to year stem
        const yearStem = rawSaju.yearStem;
        const yearTenGod = yearStem ? getTenGodRelation(dayMaster, yearStem) : null;
        secondaryArchetype = yearTenGod
            ? (ARCHETYPE_MAP[yearTenGod] || 'The Peer')
            : 'The Peer';
    }

    // 8. Final Payload
    return {
        four_pillars: {
            year: `${rawSaju.yearStem || ''}${rawSaju.yearBranch || ''}`,
            month: `${rawSaju.monthStem || ''}${rawSaju.monthBranch || ''}`,
            day: `${rawSaju.dayStem || ''}${rawSaju.dayBranch || ''}`,
            hour: rawSaju.hourStem ? `${rawSaju.hourStem}${rawSaju.hourBranch}` : null,
        },
        day_master: { stem: dayMaster, element: dmElement },
        element_balance: balance,
        core_strength: strength.status,
        void_element: voidData.element,
        void_reason: voidData.reason,
        archetype: { primary: primaryArchetype, secondary: secondaryArchetype },
    };
}
