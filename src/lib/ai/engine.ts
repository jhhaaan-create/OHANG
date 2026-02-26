import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import {
    ArchetypeAnalysisSchema,
    DualModalProfileSchema,
    CompatibilitySchema,
    FaceReadingSchema,
    RedFlagSchema,
    DailyVibeSchema,
    RetroModeSchema,
    CelebMatchSchema,
    CoupleFaceScanSchema,
} from '@/lib/ai/schemas';
import { SAJU_INTERPRETATION_SYSTEM_PROMPT, TONE_EXAMPLES } from '@/lib/ai/prompts/archetype';
import { FACE_READING_SYSTEM_PROMPT } from '@/lib/ai/prompts/faceReading';
import { COMPATIBILITY_SYSTEM_PROMPT } from '@/lib/ai/prompts/compatibility';
import { RED_FLAG_RADAR_PROMPT, DAILY_VIBE_SYSTEM_PROMPT, RETRO_MODE_PROMPT, CELEB_MATCH_PROMPT } from '@/lib/ai/prompts/specialModes';
import { setCachedResult, logUsage } from '@/lib/ai/cache';
import type { OHANGContext } from '@/lib/saju/adapter';

// ═══════════════════════════════════════════════════════
// OHANG Core Engine v4.0 — OpenAI Tiered Routing
//
// Cost Optimization via VC Audit Strategy 3:
//   Free/Basic  → gpt-4o-mini  ($0.001/call, -85% cost)
//   Premium     → gpt-4o       (full quality)
//   Vision      → gpt-4o       (only model with vision)
//
// All Anthropic dependencies removed.
// ═══════════════════════════════════════════════════════

// ── Model Configuration ────────────────────────────────
const FREE_MODEL_ID  = 'gpt-4o-mini';   // Free & Basic tier
const PREMIUM_MODEL_ID = 'gpt-4o';      // Pro & Destiny tier
const VISION_MODEL_ID  = 'gpt-4o';      // Vision (face reading, dual-modal)
const CACHE_TTL_HOURS  = 24 * 30;       // 30 days

// ── Tier Resolver ──────────────────────────────────────
type SubscriptionTier = 'free' | 'basic' | 'pro' | 'destiny';

function resolveModel(tier: SubscriptionTier = 'free') {
    return (tier === 'pro' || tier === 'destiny')
        ? openai(PREMIUM_MODEL_ID)
        : openai(FREE_MODEL_ID);
}

function resolveModelId(tier: SubscriptionTier = 'free') {
    return (tier === 'pro' || tier === 'destiny')
        ? PREMIUM_MODEL_ID
        : FREE_MODEL_ID;
}

// ── Interfaces ───────────────────────────────────────
export interface EngineOptions {
    userId: string;
    cacheKey: string;
    tone?: 'savage' | 'balanced' | 'gentle';
    isUnknownTime?: boolean;
    tier?: SubscriptionTier;
}

// ── Engine Class ─────────────────────────────────────
export class OhangEngine {

    /**
     * Build the complete system prompt with tone injection.
     */
    private static buildSystemPrompt(
        tone: string = 'balanced',
        isUnknownTime: boolean = false,
        additionalContext?: string
    ): string {
        const toneInstruction = `\n\n## ACTIVE TONE: ${tone.toUpperCase()}\nCalibrate ALL language to the "${tone}" tone as shown in the TONE CALIBRATION examples above.`;
        const unknownTimeNote = isUnknownTime
            ? `\n\n## NOTE: User's Birth Time is UNKNOWN.\nFocus on 3 Pillars (Year/Month/Day) only. Do not speculate on late-life or hour-based analysis.`
            : '';
        const extra = additionalContext ? `\n\n${additionalContext}` : '';

        return `${SAJU_INTERPRETATION_SYSTEM_PROMPT}${toneInstruction}${unknownTimeNote}${extra}`;
    }

    /**
     * Archetype Analysis (Text-Only Mode)
     * Free/Basic → gpt-4o-mini | Pro/Destiny → gpt-4o
     */
    static async streamArchetypeAnalysis(
        context: OHANGContext,
        options: EngineOptions
    ) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("CRITICAL: OPENAI_API_KEY is missing in .env.local");
        }

        const systemPrompt = this.buildSystemPrompt(
            options.tone,
            options.isUnknownTime
        );

        const model = resolveModel(options.tier);

        return streamObject({
            model,
            schema: ArchetypeAnalysisSchema,
            system: systemPrompt,
            prompt: JSON.stringify(context),
            temperature: 0.7,
            maxOutputTokens: 4000,

            onFinish: async (event: { object: unknown }) => {
                if (event.object) {
                    await Promise.all([
                        setCachedResult(options.cacheKey, event.object, CACHE_TTL_HOURS),
                        logUsage(options.userId, 'archetype'),
                    ]);
                }
            },
        });
    }

    /**
     * Dual-Modal Analysis (Vision + Saju)
     * Always uses gpt-4o (vision required).
     */
    static async streamDualModalAnalysis(
        context: OHANGContext,
        imageUrl: string,
        options: EngineOptions
    ) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("CRITICAL: OPENAI_API_KEY is missing in .env.local");
        }

        const dualModalContext = `
## DUAL-MODAL OPERATION: VISION + SAJU
1. Analyze the User's Face provided in the image (Physiognomy/Gwansang).
2. Synthesize facial features (External) with Saju Archetype (Internal).
3. Identify if there is 'Alignment' or 'Conflict' between Face and Soul.
   - Alignment: "Your face reveals the Maverick energy that your soul possesses."
   - Conflict: "Your soul is a Wildcard, but your face projects the calm of a Healer."

## STRICT GLOSSARY ENFORCEMENT
- Use OHANG Personas (The Maverick, The Icon, etc.)
- Use "The Void", "The Core", "Life Season".`;

        const systemPrompt = this.buildSystemPrompt(
            options.tone,
            options.isUnknownTime,
            dualModalContext
        );

        return streamObject({
            model: openai(VISION_MODEL_ID),
            schema: DualModalProfileSchema,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: `Saju Context Data:\n${JSON.stringify(context)}` },
                        { type: 'image', image: imageUrl },
                        { type: 'text', text: "Analyze the harmony between this face and the internal energy based on the schema." },
                    ],
                },
            ],
            temperature: 0.5,

            onFinish: async (event: { object: unknown }) => {
                if (event.object) {
                    await Promise.all([
                        setCachedResult(options.cacheKey, event.object, CACHE_TTL_HOURS),
                        logUsage(options.userId, 'dual_modal'),
                    ]);
                }
            },
        });
    }

    // ═══════════════════════════════════════════════════
    // Phase 2 Engine Methods
    // ═══════════════════════════════════════════════════

    /**
     * Compatibility Analysis (55-Pair Chemistry)
     * Free/Basic → gpt-4o-mini | Pro/Destiny → gpt-4o
     */
    static async streamCompatibility(
        contextA: OHANGContext,
        contextB: OHANGContext,
        options: EngineOptions
    ) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("CRITICAL: OPENAI_API_KEY is missing in .env.local");
        }

        const input = {
            person_a: {
                archetype: contextA.archetype.primary,
                element_dominant: contextA.day_master.element,
                element_void: contextA.void_element,
                element_balance: contextA.element_balance,
                day_master_strength: contextA.core_strength.includes('Strong') ? 'strong' : 'weak',
            },
            person_b: {
                archetype: contextB.archetype.primary,
                element_dominant: contextB.day_master.element,
                element_void: contextB.void_element,
                element_balance: contextB.element_balance,
                day_master_strength: contextB.core_strength.includes('Strong') ? 'strong' : 'weak',
            },
            tone: options.tone || 'balanced',
        };

        const toneInstruction = `\n\n## ACTIVE TONE: ${(options.tone || 'balanced').toUpperCase()}\nCalibrate ALL language to the "${options.tone || 'balanced'}" tone.`;
        const model = resolveModel(options.tier);

        return streamObject({
            model,
            schema: CompatibilitySchema,
            system: `${COMPATIBILITY_SYSTEM_PROMPT}${toneInstruction}`,
            prompt: JSON.stringify(input),
            temperature: 0.75,
            maxOutputTokens: 5000,

            onFinish: async (event: { object: unknown }) => {
                if (event.object) {
                    await Promise.all([
                        setCachedResult(options.cacheKey, event.object, CACHE_TTL_HOURS),
                        logUsage(options.userId, 'compatibility'),
                    ]);
                }
            },
        });
    }

    /**
     * Face Reading (Vision API with Failover Chain)
     * Primary: gpt-4o → Fallback: gpt-4o-mini → Text-only estimation
     */
    static async streamFaceReading(
        imageUrl: string,
        sajuContext: OHANGContext | null,
        options: EngineOptions
    ) {
        const FAILOVER_CHAIN = [
            { model: openai('gpt-4o'), timeout: 30000, label: 'gpt-4o' },
            { model: openai('gpt-4o-mini'), timeout: 20000, label: 'gpt-4o-mini' },
        ] as const;

        const sajuText = sajuContext
            ? `Saju Cross-Reference Data:\n${JSON.stringify(sajuContext)}`
            : 'No Saju data available. Analyze face only.';

        const toneInstruction = `\n\n## ACTIVE TONE: ${(options.tone || 'balanced').toUpperCase()}`;

        for (const [index, config] of FAILOVER_CHAIN.entries()) {
            try {
                const result = await Promise.race([
                    streamObject({
                        model: config.model,
                        schema: FaceReadingSchema,
                        system: `${FACE_READING_SYSTEM_PROMPT}${toneInstruction}`,
                        messages: [
                            {
                                role: 'user' as const,
                                content: [
                                    { type: 'image' as const, image: imageUrl },
                                    { type: 'text' as const, text: sajuText },
                                ],
                            },
                        ],
                        temperature: 0.5,
                        onFinish: async (event: { object: unknown }) => {
                            if (event.object) {
                                await Promise.all([
                                    setCachedResult(options.cacheKey, event.object, CACHE_TTL_HOURS),
                                    logUsage(options.userId, 'face_reading'),
                                ]);
                            }
                        },
                    }),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('TIMEOUT')), config.timeout)
                    ),
                ]);
                return result;
            } catch (error) {
                console.error(`[FaceReading] ${config.label} failed:`, error);
                if (index === FAILOVER_CHAIN.length - 1) {
                    return this.streamTextOnlyFaceEstimation(sajuContext, options);
                }
                continue;
            }
        }

        return this.streamTextOnlyFaceEstimation(sajuContext, options);
    }

    /**
     * Text-only Face Estimation Fallback
     * When all Vision APIs fail, provide saju-based face estimation.
     * Uses gpt-4o-mini for cost efficiency (fallback = low value).
     */
    private static async streamTextOnlyFaceEstimation(
        sajuContext: OHANGContext | null,
        options: EngineOptions
    ) {
        const fallbackPrompt = sajuContext
            ? `Based ONLY on this person's Saju profile (no image available), estimate likely facial energy characteristics:\n${JSON.stringify(sajuContext)}\n\nIMPORTANT: Set confidence to "low" since no image was analyzed. Note in personality_read that this is a Saju-based estimation.`
            : 'No image or Saju data available. Provide a generic Wood-dominant reading with confidence "low".';

        return streamObject({
            model: openai(FREE_MODEL_ID),
            schema: FaceReadingSchema,
            system: `${FACE_READING_SYSTEM_PROMPT}\n\n## FALLBACK MODE: Vision API unavailable. Estimate from Saju data only. Always set confidence to "low".`,
            prompt: fallbackPrompt,
            temperature: 0.5,
            onFinish: async (event: { object: unknown }) => {
                if (event.object) {
                    await logUsage(options.userId, 'face_reading_fallback');
                }
            },
        });
    }

    /**
     * Red Flag Radar (Dating Risk Assessment)
     * Premium feature → always gpt-4o for quality
     */
    static async streamRedFlag(
        contextUser: OHANGContext,
        contextPartner: OHANGContext,
        options: EngineOptions
    ) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("CRITICAL: OPENAI_API_KEY is missing in .env.local");
        }

        const input = {
            user: {
                archetype: contextUser.archetype.primary,
                element_dominant: contextUser.day_master.element,
                element_void: contextUser.void_element,
                element_balance: contextUser.element_balance,
                day_master_strength: contextUser.core_strength.includes('Strong') ? 'strong' : 'weak',
            },
            partner: {
                archetype: contextPartner.archetype.primary,
                element_dominant: contextPartner.day_master.element,
                element_void: contextPartner.void_element,
                element_balance: contextPartner.element_balance,
                day_master_strength: contextPartner.core_strength.includes('Strong') ? 'strong' : 'weak',
            },
            tone: options.tone || 'balanced',
        };

        const toneInstruction = `\n\n## ACTIVE TONE: ${(options.tone || 'balanced').toUpperCase()}`;

        return streamObject({
            model: openai(PREMIUM_MODEL_ID),
            schema: RedFlagSchema,
            system: `${RED_FLAG_RADAR_PROMPT}${toneInstruction}`,
            prompt: JSON.stringify(input),
            temperature: 0.7,
            maxOutputTokens: 4000,

            onFinish: async (event: { object: unknown }) => {
                if (event.object) {
                    await Promise.all([
                        setCachedResult(options.cacheKey, event.object, CACHE_TTL_HOURS),
                        logUsage(options.userId, 'red_flag'),
                    ]);
                }
            },
        });
    }

    /**
     * Daily Vibe (Retention Engine)
     * Free → gpt-4o-mini (brief msg only) | Premium → gpt-4o (full details)
     */
    static async streamDailyVibe(
        userContext: OHANGContext,
        todayPillar: {
            heavenly_stem: string;
            earthly_branch: string;
            stem_element: string;
            branch_element: string;
            dominant_element: string;
        },
        options: EngineOptions
    ) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("CRITICAL: OPENAI_API_KEY is missing in .env.local");
        }

        const input = {
            user: {
                day_master_element: userContext.day_master.element,
                archetype: userContext.archetype.primary,
                void_element: userContext.void_element,
                element_balance: userContext.element_balance,
            },
            today: todayPillar,
            tone: options.tone || 'balanced',
        };

        const toneInstruction = `\n\n## ACTIVE TONE: ${(options.tone || 'balanced').toUpperCase()}`;
        const model = resolveModel(options.tier);

        return streamObject({
            model,
            schema: DailyVibeSchema,
            system: `${DAILY_VIBE_SYSTEM_PROMPT}${toneInstruction}`,
            prompt: JSON.stringify(input),
            temperature: 0.7,
            maxOutputTokens: 3000,

            onFinish: async (event: { object: unknown }) => {
                if (event.object) {
                    await Promise.all([
                        setCachedResult(options.cacheKey, event.object, 24),
                        logUsage(options.userId, 'daily_vibe'),
                    ]);
                }
            },
        });
    }

    // ═══════════════════════════════════════════════════
    // Phase 3 — Newly Connected Features
    // ═══════════════════════════════════════════════════

    /**
     * Retro Mode (Ex-Partner Closure Analysis)
     * Premium IAP feature → gpt-4o
     */
    static async streamRetroMode(
        contextUser: OHANGContext,
        contextEx: OHANGContext,
        options: EngineOptions
    ) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("CRITICAL: OPENAI_API_KEY is missing in .env.local");
        }

        const input = {
            user: {
                archetype: contextUser.archetype.primary,
                element_dominant: contextUser.day_master.element,
                element_void: contextUser.void_element,
                element_balance: contextUser.element_balance,
                day_master_strength: contextUser.core_strength.includes('Strong') ? 'strong' : 'weak',
            },
            ex: {
                archetype: contextEx.archetype.primary,
                element_dominant: contextEx.day_master.element,
                element_void: contextEx.void_element,
                element_balance: contextEx.element_balance,
                day_master_strength: contextEx.core_strength.includes('Strong') ? 'strong' : 'weak',
            },
            tone: options.tone || 'balanced',
        };

        const toneInstruction = `\n\n## ACTIVE TONE: ${(options.tone || 'balanced').toUpperCase()}`;

        return streamObject({
            model: openai(PREMIUM_MODEL_ID),
            schema: RetroModeSchema,
            system: `${RETRO_MODE_PROMPT}${toneInstruction}`,
            prompt: JSON.stringify(input),
            temperature: 0.75,
            maxOutputTokens: 4000,

            onFinish: async (event: { object: unknown }) => {
                if (event.object) {
                    await Promise.all([
                        setCachedResult(options.cacheKey, event.object, CACHE_TTL_HOURS),
                        logUsage(options.userId, 'retro_mode'),
                    ]);
                }
            },
        });
    }

    /**
     * Celebrity Energy Match (Viral Feature)
     * Vision required → gpt-4o
     */
    static async streamCelebMatch(
        imageUrl: string,
        sajuContext: OHANGContext | null,
        options: EngineOptions
    ) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("CRITICAL: OPENAI_API_KEY is missing in .env.local");
        }

        const sajuText = sajuContext
            ? `Saju Context:\n${JSON.stringify(sajuContext)}`
            : 'No Saju data. Match based on face energy only.';

        const toneInstruction = `\n\n## ACTIVE TONE: ${(options.tone || 'balanced').toUpperCase()}`;

        return streamObject({
            model: openai(VISION_MODEL_ID),
            schema: CelebMatchSchema,
            system: `${CELEB_MATCH_PROMPT}${toneInstruction}`,
            messages: [
                {
                    role: 'user' as const,
                    content: [
                        { type: 'image' as const, image: imageUrl },
                        { type: 'text' as const, text: sajuText },
                    ],
                },
            ],
            temperature: 0.8,

            onFinish: async (event: { object: unknown }) => {
                if (event.object) {
                    await Promise.all([
                        setCachedResult(options.cacheKey, event.object, CACHE_TTL_HOURS),
                        logUsage(options.userId, 'celeb_match'),
                    ]);
                }
            },
        });
    }

    /**
     * Couple Face Scan (Premium Vision Feature)
     * Both faces analyzed → gpt-4o
     */
    static async streamCoupleFaceScan(
        imageUrlA: string,
        imageUrlB: string,
        sajuContextA: OHANGContext | null,
        sajuContextB: OHANGContext | null,
        options: EngineOptions
    ) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("CRITICAL: OPENAI_API_KEY is missing in .env.local");
        }

        const sajuText = [
            sajuContextA ? `Person A Saju:\n${JSON.stringify(sajuContextA)}` : 'Person A: No Saju data.',
            sajuContextB ? `Person B Saju:\n${JSON.stringify(sajuContextB)}` : 'Person B: No Saju data.',
        ].join('\n\n');

        const toneInstruction = `\n\n## ACTIVE TONE: ${(options.tone || 'balanced').toUpperCase()}`;

        return streamObject({
            model: openai(VISION_MODEL_ID),
            schema: CoupleFaceScanSchema,
            system: `${FACE_READING_SYSTEM_PROMPT}\n\n## COUPLE FACE SCAN MODE\nAnalyze BOTH faces and compare their facial element energies for romantic compatibility. Cross-reference with Saju data if available.${toneInstruction}`,
            messages: [
                {
                    role: 'user' as const,
                    content: [
                        { type: 'text' as const, text: 'Person A:' },
                        { type: 'image' as const, image: imageUrlA },
                        { type: 'text' as const, text: 'Person B:' },
                        { type: 'image' as const, image: imageUrlB },
                        { type: 'text' as const, text: sajuText },
                    ],
                },
            ],
            temperature: 0.6,

            onFinish: async (event: { object: unknown }) => {
                if (event.object) {
                    await Promise.all([
                        setCachedResult(options.cacheKey, event.object, CACHE_TTL_HOURS),
                        logUsage(options.userId, 'couple_face_scan'),
                    ]);
                }
            },
        });
    }
}
