// ═══════════════════════════════════════════════════════
// OHANG Domain Types: The Saju Ontology
// ═══════════════════════════════════════════════════════

// 1. Heavenly Stems (천간 10자)
export const HEAVENLY_STEMS = [
    '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'
] as const;
export type HeavenlyStem = typeof HEAVENLY_STEMS[number];

// 2. Earthly Branches (지지 12자)
export const EARTHLY_BRANCHES = [
    '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'
] as const;
export type EarthlyBranch = typeof EARTHLY_BRANCHES[number];

// 3. The 60 Pillars (육십갑자)
export interface SajuPillar {
    stem: HeavenlyStem;
    branch: EarthlyBranch;
    koreanName?: string; // e.g., "갑자"
}

// 4. Solar Terms (24절기) - Critical for Month/Year Calculation
export type SolarTermName =
    | 'Ipchun' | 'Usu' | 'Gyeongchip' | 'Chunbun' | 'Cheongmyeong' | 'Gokwu'
    | 'Ipha' | 'Soman' | 'Mangjong' | 'Haji' | 'Soseo' | 'Daeseo'
    | 'Ipchu' | 'Cheoseo' | 'Baengno' | 'Chubun' | 'Hallo' | 'Sanggang'
    | 'Ipdong' | 'Soseol' | 'Daeseol' | 'Dongji' | 'Sohan' | 'Daehan';

// 5. Complete Saju Chart (사주팔자 원국)
export interface SajuChart {
    year: SajuPillar;
    month: SajuPillar;
    day: SajuPillar;
    hour: SajuPillar;
    meta: {
        solarDate: string;
        lunarDate?: string;
        solarTerm: string;
        isLeapMonth?: boolean;
        standardTimezone: string;
        specialMessage?: string;
    };
}

// 6. Input Payload Interface
export interface SajuInput {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    gender: 'male' | 'female';
    timezone?: string; // Defaults to 'Asia/Seoul'
}
