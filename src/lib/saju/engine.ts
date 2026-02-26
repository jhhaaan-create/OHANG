import {
    HEAVENLY_STEMS,
    EARTHLY_BRANCHES,
    SajuPillar,
    SajuChart,
    SajuInput
} from './types';
import * as Astronomy from 'astronomy-engine';

// ═══════════════════════════════════════════════════════
// OHANG Saju Core Engine v4.1 (Astronomical Precision)
// Powered by 'astronomy-engine' (Solar Longitude)
// ═══════════════════════════════════════════════════════

const BASE_GAN_IDX = 0; // 1900-01-01 was 甲 (Gap)
const BASE_JI_IDX = 10; // 1900-01-01 was 戌 (Sul) -> 甲戌 (Gap-Sul) Day

/**
 * Solar Terms Definition (Ecliptic Longitude)
 * 24 Terms, starting from Chunbun (0°).
 * Saju Year starts at Ipchun (315°).
 */
const SOLAR_TERMS_DEG = {
    IPCHUN: 315,
    GYEONGCHIP: 345,
    CHEONGMYEONG: 15,
    IPHA: 45,
    MANGJONG: 75,
    SOSEO: 105,
    IPCHU: 135,
    BAENGNO: 165,
    HALLO: 195,
    IPDONG: 225,
    DAESEOL: 255,
    SOHAN: 285
};

export class SajuEngine {

    private static getExactSolarTermTime(year: number, targetLongitude: number): Date {
        const approxDate = new Date(Date.UTC(year, 0, 1));
        const astroTime = Astronomy.SearchSunLongitude(targetLongitude, approxDate, 365);

        if (!astroTime) {
            throw new Error(`Failed to calculate solar term for longitude ${targetLongitude} in year ${year}`);
        }

        return astroTime.date;
    }

    /**
     * Calculate Equation of Time (EoT) in minutes.
     * EoT = MeanSolarTime - ApparentSolarTime
     * Derived from the sun's ecliptic longitude vs mean longitude.
     */
    private static calculateEoT(dateUTC: Date): number {
        const sunPos = Astronomy.SunPosition(dateUTC);
        const eclipticLongDeg = sunPos.elon;

        // Mean longitude of the sun (approximate)
        // Days since J2000.0 (2000-01-12T12:00:00Z)
        const j2000 = new Date('2000-01-01T12:00:00Z').getTime();
        const daysSinceJ2000 = (dateUTC.getTime() - j2000) / (86400 * 1000);
        const meanLongDeg = (280.46646 + 0.9856474 * daysSinceJ2000) % 360;

        // Right Ascension from ecliptic longitude (simplified)
        const obliquity = 23.4393; // degrees (approximate)
        const oblRad = obliquity * Math.PI / 180;
        const eclRad = eclipticLongDeg * Math.PI / 180;

        const ra = Math.atan2(
            Math.cos(oblRad) * Math.sin(eclRad),
            Math.cos(eclRad)
        ) * 180 / Math.PI;

        // Normalize RA to 0-360
        const raNorm = ((ra % 360) + 360) % 360;
        const meanNorm = ((meanLongDeg % 360) + 360) % 360;

        // EoT in degrees, then convert to minutes (360° = 1440 min)
        let eotDeg = meanNorm - raNorm;
        if (eotDeg > 180) eotDeg -= 360;
        if (eotDeg < -180) eotDeg += 360;

        return eotDeg * 4; // 1 degree = 4 minutes of time
    }

    private static getPillar(stemIdx: number, branchIdx: number): SajuPillar {
        const s = HEAVENLY_STEMS[(stemIdx % 10 + 10) % 10];
        const b = EARTHLY_BRANCHES[(branchIdx % 12 + 12) % 12];
        return { stem: s, branch: b, koreanName: `${s}${b}` };
    }

    public static compute(input: SajuInput): SajuChart {
        // 1. Parse Input Date to UTC (assume KST if not specified)
        const tzOffset = 9;
        const offsetStr = `+${String(tzOffset).padStart(2, '0')}:00`;
        const birthISO = `${input.year}-${String(input.month).padStart(2, '0')}-${String(input.day).padStart(2, '0')}T${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')}:00${offsetStr}`;
        const birthDateUTC = new Date(birthISO);
        const userLongitude = 127.0; // Seoul center

        // 2. YEAR PILLAR (Based on Ipchun 315°)
        const ipchunDate = this.getExactSolarTermTime(input.year, SOLAR_TERMS_DEG.IPCHUN);
        let sajuYear = input.year;

        const diffSeconds = Math.abs((birthDateUTC.getTime() - ipchunDate.getTime()) / 1000);
        const isSolarTransitionMoment = diffSeconds < 60;

        if (birthDateUTC < ipchunDate) {
            sajuYear = input.year - 1;
        }

        const yearOffset = sajuYear - 1984;
        const yearPillar = this.getPillar(yearOffset, yearOffset);

        // 3. MONTH PILLAR (Based on 12 Solar Terms)
        const monthTerms = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285];
        let passedTermIdx = -1;

        for (let i = 0; i < 12; i++) {
            const searchStart = new Date(Date.UTC(sajuYear, 0, 1));
            const termDate = Astronomy.SearchSunLongitude(monthTerms[i], searchStart, 400)?.date;
            if (termDate && birthDateUTC >= termDate) {
                passedTermIdx = i;
            }
        }

        const rawMonthBranch = passedTermIdx + 2;
        const startStemOffset = (HEAVENLY_STEMS.indexOf(yearPillar.stem) % 5) * 2 + 2;
        const monthPillar = this.getPillar(startStemOffset + passedTermIdx, rawMonthBranch);

        // 4. DAY PILLAR (Absolute Days from 1900-01-01)
        const baseDate = new Date('1900-01-01T00:00:00Z');
        const diffDays = Math.floor((birthDateUTC.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        const dayPillar = this.getPillar(BASE_GAN_IDX + diffDays, BASE_JI_IDX + diffDays);

        // 5. HOUR PILLAR (True Solar Time)
        const eotMin = this.calculateEoT(birthDateUTC);
        const longOffsetMin = (userLongitude - (tzOffset * 15)) * 4;
        const totalCorrection = eotMin + longOffsetMin;

        let dayMinutes = input.hour * 60 + input.minute + totalCorrection;
        if (dayMinutes < 0) dayMinutes += 1440;
        if (dayMinutes >= 1440) dayMinutes -= 1440;

        const hourBranchIdx = Math.floor((dayMinutes + 30) / 120) % 12;
        const dayStemIndex = HEAVENLY_STEMS.indexOf(dayPillar.stem);
        const hourStartStem = (dayStemIndex % 5) * 2;
        const hourPillar = this.getPillar(hourStartStem + hourBranchIdx, hourBranchIdx);

        return {
            year: yearPillar,
            month: monthPillar,
            day: dayPillar,
            hour: hourPillar,
            meta: {
                solarDate: birthDateUTC.toISOString(),
                solarTerm: passedTermIdx >= 0 ? 'Normal Term' : 'Pre-Ipchun',
                isLeapMonth: false,
                standardTimezone: input.timezone || 'Asia/Seoul',
                specialMessage: isSolarTransitionMoment
                    ? 'Born at a Solar Transition moment. Pure transformative energy.'
                    : undefined
            }
        };
    }
}
