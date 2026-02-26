import { z } from "zod";

// ═══════════════════════════════════════════════════════
// OHANG Phase 2 — Server Action Input Schemas
// Validation for all incoming requests before engine calls.
// ═══════════════════════════════════════════════════════

const ElementEnum = z.enum(["Wood", "Fire", "Earth", "Metal", "Water"]);
const ToneEnum = z.enum(["savage", "balanced", "gentle"]).default("balanced");
const GenderEnum = z.enum(["male", "female"]);

// ── Birth Data (reusable) ──────────────────────────────
const BirthDataSchema = z.object({
  name: z.string().min(1).max(50),
  birthYear: z.number().int().min(1940).max(2010),
  birthMonth: z.number().int().min(1).max(12),
  birthDay: z.number().int().min(1).max(31),
  birthHour: z.number().int().min(-1).max(23), // -1 = unknown
  gender: GenderEnum,
  isLunar: z.boolean().default(false),
});

// ── Feature 1: Compatibility ───────────────────────────
export const CompatibilityInputSchema = z.object({
  personA: z.object({
    userId: z.string(),
    archetype: z.string(),
    element_dominant: ElementEnum,
    element_void: ElementEnum,
    element_balance: z.object({
      wood: z.number(), fire: z.number(), earth: z.number(),
      metal: z.number(), water: z.number(),
    }),
    day_master_strength: z.enum(["strong", "weak"]),
  }),
  personB: BirthDataSchema,
  tone: ToneEnum,
});

// ── Feature 2: Face Reading ────────────────────────────
export const FaceReadingInputSchema = z.object({
  imageUrl: z.string().url().refine(
    (url) => url.startsWith("https://") &&
      (url.includes("vercel-storage.com") || url.includes("blob.vercel-storage.com")),
    { message: "Image must be hosted on Vercel Blob" }
  ),
  includesSajuData: z.boolean().default(false),
  sajuResultId: z.string().optional(),
  tone: ToneEnum,
});

// ── Feature 3: Red Flag ────────────────────────────────
export const RedFlagInputSchema = z.object({
  userId: z.string(),
  partnerData: BirthDataSchema,
  myArchetypeResultId: z.string().optional(),
  tone: ToneEnum,
});

// ── Feature 4: Daily Vibe ──────────────────────────────
export const DailyVibeInputSchema = z.object({
  userId: z.string(),
  timezone: z.string().default("Asia/Seoul"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ── Feature 4: Streak ──────────────────────────────────
export const StreakSchema = z.object({
  current_streak: z.number().int().min(0),
  longest_streak: z.number().int().min(0),
  reward_tier: z.enum(["none", "bronze", "silver", "gold"]),
  next_reward_at: z.number().int(),
  is_today_visited: z.boolean(),
});

// ── Feature 5: Partner Invite ──────────────────────────
export const PartnerInviteSchema = z.object({
  id: z.string(),
  inviter_id: z.string(),
  token: z.string().min(32).max(128),
  status: z.enum(["pending", "completed", "expired"]),
  partner_result_id: z.string().nullable(),
  created_at: z.string(),
  expires_at: z.string(),
});

// ── Feature 5: Share Event ─────────────────────────────
export const ShareEventSchema = z.object({
  userId: z.string(),
  contentType: z.enum(["archetype", "compatibility", "redflag", "vibe", "face"]),
  contentId: z.string(),
  platform: z.enum(["native", "clipboard", "kakao", "instagram", "twitter"]),
});

// ── Feature 6: Tone Input (common) ─────────────────────
export const ToneInputSchema = z.object({
  tone: ToneEnum,
});

// ── Type Exports ───────────────────────────────────────
export type CompatibilityInput = z.infer<typeof CompatibilityInputSchema>;
export type FaceReadingInput = z.infer<typeof FaceReadingInputSchema>;
export type RedFlagInput = z.infer<typeof RedFlagInputSchema>;
export type DailyVibeInput = z.infer<typeof DailyVibeInputSchema>;
export type Streak = z.infer<typeof StreakSchema>;
export type PartnerInvite = z.infer<typeof PartnerInviteSchema>;
export type ShareEvent = z.infer<typeof ShareEventSchema>;
export type Tone = z.infer<typeof ToneInputSchema>["tone"];
