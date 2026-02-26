// ═══════════════════════════════════════════════════════
// OHANG AI Module — Public API Surface
// All AI calls MUST go through OhangEngine.
// ═══════════════════════════════════════════════════════

export { OhangEngine } from './engine';
export type { EngineOptions } from './engine';

export {
    ArchetypeAnalysisSchema,
    DualModalProfileSchema,
    CompatibilitySchema,
    FaceReadingSchema,
    CoupleFaceScanSchema,
    RedFlagSchema,
    RetroModeSchema,
    DailyVibeSchema,
    CelebMatchSchema,
} from './schemas';

export type {
    ArchetypeAnalysis,
    DualModalProfile,
    Compatibility,
    FaceReading,
    CoupleFaceScan,
    RedFlag,
    RetroMode,
    DailyVibe,
    CelebMatch,
} from './schemas';

export {
    generateCacheKey,
    getCachedResult,
    setCachedResult,
    checkRateLimit,
    getAuthenticatedUser,
    resolveUserId,
    logUsage,
} from './cache';
