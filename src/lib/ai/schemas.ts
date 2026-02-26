import { z } from "zod";

// ═══════════════════════════════════════════════════════
// OHANG Output Schemas v3.2 — All 9 Features Restored
// Enterprise-grade Zod validation for every AI output
// ═══════════════════════════════════════════════════════

// ── 1. Archetype Analysis (Internal Blueprint) ──────
export const ArchetypeAnalysisSchema = z.object({
    user_name: z.string().describe("User's name or nickname"),
    archetype: z.object({
        name: z.string().describe("e.g., 'The Maverick'"),
        tagline: z.string().describe("A punchy 1-liner slogan"),
        emoji: z.string().describe("Representative emoji"),
        color_hex: z.string().describe("Theme color based on archetype element"),
    }),

    core_energy: z.object({
        element: z.enum(["Wood", "Fire", "Earth", "Metal", "Water"]),
        description: z.string().describe("Poetic description of their core nature"),
        strength: z.string().describe("Strong (Shin-gang) or Delicate (Shin-yak)"),
    }),

    the_void: z.object({
        element: z.enum(["Wood", "Fire", "Earth", "Metal", "Water"]),
        deficiency_reason: z.string().describe("Why this element is missing/needed"),
        psychological_impact: z.string().describe("How this lack manifests in behavior"),
        solution_keyword: z.string().describe("One word action to fill the void"),
    }),

    five_elements_analysis: z.object({
        wood: z.number().min(0).max(100),
        fire: z.number().min(0).max(100),
        earth: z.number().min(0).max(100),
        metal: z.number().min(0).max(100),
        water: z.number().min(0).max(100),
        balance_comment: z.string().describe("Short analysis of the overall balance"),
    }),

    personality: z.object({
        light_side: z.string().describe("Core strengths and gifts"),
        shadow_side: z.string().describe("Hidden weaknesses or dark traits"),
        love_style: z.string().describe("How they behave in relationships"),
    }),

    growth_advice: z.array(z.object({
        title: z.string(),
        content: z.string(),
        type: z.enum(["Mindset", "Action", "Habit"]),
    })).length(3).describe("Exactly 3 actionable tips for growth"),

    share_message: z.string().describe("A short, witty sentence for Instagram/TikTok sharing"),
});

// ── 2. Dual-Modal Profile (Saju + Vision) ───────────
export const DualModalProfileSchema = z.object({
    user_identity: z.object({
        name: z.string(),
        core_archetype: z.string().describe("e.g., 'The Maverick' (from Saju)"),
        visual_archetype: z.string().describe("e.g., 'The Icon' (from Face Vision)"),
        is_aligned: z.boolean().describe("Do internal and external archetypes match?"),
        synthesis_title: z.string().describe("Punchy title merging both"),
    }),

    internal_blueprint: z.object({
        the_core: z.enum(["Wood", "Fire", "Earth", "Metal", "Water"]),
        the_void: z.enum(["Wood", "Fire", "Earth", "Metal", "Water"]),
        core_strength: z.string(),
    }),

    external_projection: z.object({
        dominant_feature: z.string().describe("Facial feature holding the most energy"),
        projected_energy: z.enum(["Wood", "Fire", "Earth", "Metal", "Water"]),
        first_impression: z.string().describe("What people think in the first 3 seconds"),
    }),

    alignment_analysis: z.object({
        conflict_score: z.number().min(0).max(100),
        psychological_dynamic: z.string().describe("Analyze the gap between face and soul"),
        social_mask_strategy: z.string().describe("How to use this gap as a charm"),
    }),

    growth_advice: z.array(z.object({
        type: z.enum(["Mindset", "Action", "Style"]),
        title: z.string(),
        content: z.string(),
    })).length(3),

    share_message: z.string().describe("Instagram-ready caption about their duality"),
});

// ── 3. Compatibility (55-Pair Chemistry) ────────────
export const CompatibilitySchema = z.object({
    chemistry_label: z.string().describe("2-4 word creative title"),
    chemistry_emoji: z.string(),
    overall_score: z.number().min(5).max(95),

    dimension_scores: z.object({
        passion: z.number().min(0).max(100),
        stability: z.number().min(0).max(100),
        communication: z.number().min(0).max(100),
        growth: z.number().min(0).max(100),
        timing: z.number().min(0).max(100),
    }),

    element_dynamic: z.object({
        interaction_type: z.string().describe("generating | controlling | mirroring"),
        description: z.string(),
    }),

    void_complementarity: z.object({
        type: z.enum(["Perfect Complement", "One-Way", "Shared Void", "Power Drain", "Neutral"]),
        insight: z.string().describe("THE deepest insight about why they found each other"),
    }),

    headline: z.string().describe("Screenshot-worthy. Under 20 words."),
    dynamic_type: z.enum(["Spark", "Comfort", "War", "Growth", "Mirror", "Karmic", "Toxic", "Soulmate"]),

    narrative: z.object({
        the_meeting: z.string(),
        month_three: z.string(),
        the_crossroads: z.string(),
        the_verdict: z.string(),
    }),

    verdict: z.string(),
    survival_tip: z.string().describe("1 specific, actionable tip"),
    share_line: z.string().describe("Under 15 words. Social media ready."),
});

// ── 4. Face Reading (K-Gwansang) ────────────────────
export const FaceReadingSchema = z.object({
    dominant_element: z.enum(["Wood", "Fire", "Earth", "Metal", "Water"]),
    secondary_element: z.enum(["Wood", "Fire", "Earth", "Metal", "Water"]),
    face_archetype: z.string().describe("One of 10 OHANG Archetypes"),
    confidence: z.enum(["high", "medium", "low"]),

    zone_analysis: z.object({
        upper: z.object({ element: z.string(), reading: z.string() }),
        middle: z.object({ element: z.string(), reading: z.string() }),
        lower: z.object({ element: z.string(), reading: z.string() }),
    }),

    key_features: z.array(z.object({
        feature: z.string(),
        element: z.string(),
        officer: z.string(),
        reading: z.string(),
    })).min(3).max(5),

    palace_insights: z.object({
        spouse_palace: z.string(),
        property_palace: z.string(),
        fortune_palace: z.string(),
    }),

    personality_read: z.string().describe("3-4 sentences. Eerily accurate."),
    first_impression_vs_reality: z.string(),
    saju_cross_analysis: z.string().optional().describe("Compare face vs Saju element"),
    share_line: z.string().describe("Under 15 words."),
});

// ── 5. Couple Face Scan (Premium) ───────────────────
export const CoupleFaceScanSchema = z.object({
    person_a: z.object({
        dominant_element: z.string(),
        face_archetype: z.string(),
        key_energy: z.string(),
    }),
    person_b: z.object({
        dominant_element: z.string(),
        face_archetype: z.string(),
        key_energy: z.string(),
    }),
    visual_chemistry_score: z.number().min(0).max(100),
    element_interaction: z.string(),
    zone_complementarity: z.string(),
    spouse_palace_reading: z.string(),
    together_energy: z.string(),
    strongest_bond: z.string(),
    potential_friction: z.string(),
    verdict: z.string(),
    share_line: z.string().describe("Under 15 words."),
});

// ── 6. Red Flag Radar ───────────────────────────────
export const RedFlagSchema = z.object({
    risk_level: z.enum(["GREEN", "YELLOW", "RED", "RUN"]),
    risk_score: z.number().min(0).max(100),
    headline: z.string(),
    element_clash_summary: z.string(),

    flags: z.array(z.object({
        flag: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        element_cause: z.string(),
        how_it_shows: z.string(),
        mitigation: z.string(),
    })).min(1).max(5),

    hidden_strength: z.string(),
    the_pattern: z.string(),
    verdict: z.string(),
    if_you_proceed: z.string(),
});

// ── 7. Retro Mode (Closure Engine) ──────────────────
export const RetroModeSchema = z.object({
    pairing_label: z.string(),
    pairing_emoji: z.string(),

    element_story: z.object({
        your_element: z.string(),
        their_element: z.string(),
        interaction: z.string(),
        what_this_means: z.string(),
    }),

    the_attraction: z.string(),
    the_breaking_point: z.string(),
    the_timeline: z.string(),
    what_they_activated: z.string(),
    the_pattern: z.string(),
    closure: z.string(),
    what_to_seek: z.string(),
});

// ── 8. Daily Vibe (Retention Engine) ────────────────
export const DailyVibeSchema = z.object({
    vibe_score: z.number().min(10).max(95),
    vibe_keyword: z.string(),
    vibe_emoji: z.string(),
    today_element: z.string(),
    interaction_type: z.enum(["generates", "controls", "drains", "pressures", "mirrors"]),
    message_brief: z.string().describe("1 sentence for free users"),
    message_detailed: z.string().describe("3-4 sentences for premium"),

    peak_window: z.object({
        start: z.string(),
        end: z.string(),
        element: z.string(),
        activity: z.string(),
    }),

    avoid_window: z.object({
        start: z.string(),
        end: z.string(),
        element: z.string(),
        reason: z.string(),
    }),

    lucky_color: z.object({
        hex: z.string(),
        element: z.string(),
        tip: z.string(),
    }),

    love_forecast: z.string(),
    one_thing_to_avoid: z.string(),
});

// ── 9. Celebrity Match (Viral Feature) ──────────────
export const CelebMatchSchema = z.object({
    energy_category: z.string(),
    dominant_element: z.string(),
    archetype_match: z.string(),
    shared_traits: z.array(z.string()).min(2).max(4),
    energy_description: z.string(),
    fun_fact: z.string(),
    share_line: z.string().describe("Under 15 words."),
});

// ── Type Exports ────────────────────────────────────
export type ArchetypeAnalysis = z.infer<typeof ArchetypeAnalysisSchema>;
export type DualModalProfile = z.infer<typeof DualModalProfileSchema>;
export type Compatibility = z.infer<typeof CompatibilitySchema>;
export type FaceReading = z.infer<typeof FaceReadingSchema>;
export type CoupleFaceScan = z.infer<typeof CoupleFaceScanSchema>;
export type RedFlag = z.infer<typeof RedFlagSchema>;
export type RetroMode = z.infer<typeof RetroModeSchema>;
export type DailyVibe = z.infer<typeof DailyVibeSchema>;
export type CelebMatch = z.infer<typeof CelebMatchSchema>;
