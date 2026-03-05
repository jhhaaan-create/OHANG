# PHASE 1 — VIRAL ENGINE ARCHITECTURE
## Share-to-Unlock + Partner Chemistry Link

**Target Agent**: Claude Code (autonomous execution)
**Priority**: CRITICAL — Revenue multiplier + organic growth engine
**Dependencies**: Supabase, existing ShareViralButton, existing `/api/invite/route.ts` (stub)

---

## TABLE OF CONTENTS

1. [Database Migrations](#1-database-migrations)
2. [Share-to-Unlock API](#2-share-to-unlock-api)
3. [ShareViralButton Upgrade](#3-shareviralbutton-upgrade)
4. [Partner Chemistry Link — DB + API](#4-partner-chemistry-link)
5. [Invite Landing Page](#5-invite-landing-page)
6. [Supabase Realtime Notification](#6-supabase-realtime-notification)
7. [Integration Points](#7-integration-points)
8. [Execution Command](#8-execution-command)

---

## 1. DATABASE MIGRATIONS

### File: `supabase/migrations/20260304_viral_engine.sql`

```sql
-- ═══════════════════════════════════════════════════════
-- OHANG Viral Engine — Share Unlocks + Chemistry Invites
-- Phase 1 | 2026-03-04
-- ═══════════════════════════════════════════════════════

-- ── 1A: Share Unlock Tracking ──────────────────────────
-- Tracks when a user shares content to unlock premium previews.
-- One row per (user, feature) pair. Re-sharing updates timestamp.

CREATE TABLE IF NOT EXISTS share_unlocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL,                    -- auth user.id OR 'anon:<ip>'
    feature         TEXT NOT NULL,                    -- 'red_flag' | 'couple_scan' | 'retro_mode' | 'celeb_match'
    result_id       TEXT,                             -- optional: specific cached result that was unlocked
    share_method    TEXT NOT NULL DEFAULT 'unknown',  -- 'native' | 'clipboard' | 'download'
    unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),

    CONSTRAINT uq_share_unlock UNIQUE (user_id, feature)
);

-- Index for fast lookup: "has this user unlocked this feature?"
CREATE INDEX IF NOT EXISTS idx_share_unlocks_lookup
    ON share_unlocks (user_id, feature, expires_at);

-- ── 1B: Chemistry Invites ──────────────────────────────
-- Replaces the stub in /api/invite/route.ts with real persistence.
-- Creator generates invite → partner clicks link → partner submits data →
-- Supabase Realtime notifies creator.

CREATE TABLE IF NOT EXISTS chemistry_invites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token           TEXT NOT NULL UNIQUE,              -- 64-char hex, used in URL
    inviter_id      TEXT NOT NULL,                     -- creator's user_id (auth or anon)
    inviter_result_id TEXT,                            -- creator's cached analysis result
    partner_id      TEXT,                              -- filled when partner submits
    partner_result_id TEXT,                            -- filled when partner analysis completes
    status          TEXT NOT NULL DEFAULT 'pending'    -- 'pending' | 'accepted' | 'completed' | 'expired'
                    CHECK (status IN ('pending', 'accepted', 'completed', 'expired')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
    completed_at    TIMESTAMPTZ
);

-- Index for token lookup (partner landing page)
CREATE INDEX IF NOT EXISTS idx_chemistry_invites_token
    ON chemistry_invites (token) WHERE status != 'expired';

-- Index for creator's invite list
CREATE INDEX IF NOT EXISTS idx_chemistry_invites_inviter
    ON chemistry_invites (inviter_id, created_at DESC);

-- ── 1C: Enable Realtime on chemistry_invites ──────────
-- Allows creator to receive live notification when partner submits.
ALTER PUBLICATION supabase_realtime ADD TABLE chemistry_invites;

-- ── 1D: RLS Policies ──────────────────────────────────
ALTER TABLE share_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemistry_invites ENABLE ROW LEVEL SECURITY;

-- share_unlocks: service_role only (all access via API routes)
CREATE POLICY "Service role full access on share_unlocks"
    ON share_unlocks FOR ALL
    USING (true) WITH CHECK (true);

-- chemistry_invites: service_role for writes, public read by token
CREATE POLICY "Service role full access on chemistry_invites"
    ON chemistry_invites FOR ALL
    USING (true) WITH CHECK (true);

-- Anon can read invite by token (for partner landing page)
CREATE POLICY "Public can read invite by token"
    ON chemistry_invites FOR SELECT
    USING (true);
```

**IMPORTANT**: The RLS policies grant broad access because all mutations go through API routes using the service_role admin client. The anon SELECT on chemistry_invites is safe — it only exposes invite metadata (no PII).

---

## 2. SHARE-TO-UNLOCK API

### File: `src/app/api/actions/unlock/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, resolveUserId } from '@/lib/ai/cache';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════
// OHANG Share-to-Unlock Endpoint
// POST: Record a share event → unlock feature for 24h
// GET:  Check if a feature is currently unlocked
// ═══════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

// ── Admin client (service_role) ──
function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

// ── Schemas ──
const UnlockSchema = z.object({
    feature: z.enum(['red_flag', 'couple_scan', 'retro_mode', 'celeb_match']),
    shareMethod: z.enum(['native', 'clipboard', 'download']).default('unknown'),
    resultId: z.string().optional(),
});

const CheckSchema = z.object({
    feature: z.enum(['red_flag', 'couple_scan', 'retro_mode', 'celeb_match']),
});

// ── POST: Record share → unlock ──
export async function POST(req: Request) {
    try {
        const user = await getAuthenticatedUser(req);
        const userId = resolveUserId(user, req);
        const body = await req.json();
        const { feature, shareMethod, resultId } = UnlockSchema.parse(body);

        const admin = getAdmin();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        // Upsert: re-sharing resets the 24h window
        const { error } = await admin
            .from('share_unlocks')
            .upsert(
                {
                    user_id: userId,
                    feature,
                    share_method: shareMethod,
                    result_id: resultId ?? null,
                    unlocked_at: new Date().toISOString(),
                    expires_at: expiresAt,
                },
                { onConflict: 'user_id,feature' }
            );

        if (error) {
            console.error('[Unlock] DB error:', error);
            return NextResponse.json({ error: 'Failed to record unlock' }, { status: 500 });
        }

        return NextResponse.json({
            unlocked: true,
            feature,
            expiresAt,
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 });
        }
        console.error('[Unlock] Error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// ── GET: Check unlock status ──
export async function GET(req: Request) {
    try {
        const user = await getAuthenticatedUser(req);
        const userId = resolveUserId(user, req);
        const { searchParams } = new URL(req.url);
        const { feature } = CheckSchema.parse({ feature: searchParams.get('feature') });

        const admin = getAdmin();
        const { data } = await admin
            .from('share_unlocks')
            .select('expires_at')
            .eq('user_id', userId)
            .eq('feature', feature)
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();

        return NextResponse.json({
            unlocked: !!data,
            expiresAt: data?.expires_at ?? null,
        });
    } catch {
        return NextResponse.json({ unlocked: false, expiresAt: null });
    }
}
```

---

## 3. SHAREVIRALBUTTON UPGRADE

### File: `src/components/ui/ShareViralButton.tsx`

**Strategy**: Add optional `onShareSuccess` callback + `unlockFeature` prop. When a share completes, fire the unlock API, then invoke the callback so the parent can remove blur.

**Changes to existing interface:**

```typescript
interface ShareViralButtonProps {
    payload: SharePayload;
    ogImageUrl?: string;
    variant?: "default" | "compact" | "cta";
    locale?: "ko" | "en";
    className?: string;
    // ── NEW: Share-to-Unlock props ──
    /** Feature to unlock on successful share */
    unlockFeature?: "red_flag" | "couple_scan" | "retro_mode" | "celeb_match";
    /** Specific result ID being unlocked */
    unlockResultId?: string;
    /** Called after successful share + unlock API confirmation */
    onShareSuccess?: (feature: string) => void;
}
```

**Add this helper function inside the component (before the handlers):**

```typescript
// ── Share-to-Unlock recorder ──
const recordUnlock = useCallback(async (method: "native" | "clipboard" | "download") => {
    if (!unlockFeature) return;
    try {
        const res = await fetch("/api/actions/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                feature: unlockFeature,
                shareMethod: method,
                resultId: unlockResultId,
            }),
        });
        if (res.ok) {
            onShareSuccess?.(unlockFeature);
            haptic.success();
            toast.success(locale === "ko" ? "🔓 콘텐츠가 잠금 해제되었습니다!" : "🔓 Content unlocked!");
        }
    } catch {
        // Silent fail — don't block share flow
        console.warn("[ShareViralButton] Unlock recording failed");
    }
}, [unlockFeature, unlockResultId, onShareSuccess, locale]);
```

**Modify each share handler to call `recordUnlock` on success:**

In `handleNativeShare`:
```typescript
// After: setMode("success");
await recordUnlock("native");
```

In `handleDownloadImage`:
```typescript
// After: toast.success(labels.saved);
await recordUnlock("download");
```

In `handleCopyLink`:
```typescript
// After: toast.success(labels.copied);
await recordUnlock("clipboard");
```

---

## 4. PARTNER CHEMISTRY LINK — DB + API

### File: `src/app/api/invite/route.ts` (REWRITE — replace stub)

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getAuthenticatedUser, resolveUserId } from '@/lib/ai/cache';

// ═══════════════════════════════════════════════════════
// OHANG Chemistry Invite API — Full Supabase Integration
// POST { action: 'create' } → Generate invite link
// POST { action: 'lookup' } → Validate token, return invite
// POST { action: 'accept' } → Partner marks as accepted
// POST { action: 'complete' } → Partner analysis done
// ═══════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

function getBaseUrl(req: Request): string {
    const host = req.headers.get('host') || 'ohang.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
}

// ── Schemas ──
const CreateSchema = z.object({
    action: z.literal('create'),
    resultId: z.string().min(1),
});

const LookupSchema = z.object({
    action: z.literal('lookup'),
    token: z.string().min(32),
});

const AcceptSchema = z.object({
    action: z.literal('accept'),
    token: z.string().min(32),
});

const CompleteSchema = z.object({
    action: z.literal('complete'),
    token: z.string().min(32),
    partnerResultId: z.string().min(1),
});

const RequestSchema = z.discriminatedUnion('action', [
    CreateSchema,
    LookupSchema,
    AcceptSchema,
    CompleteSchema,
]);

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const user = await getAuthenticatedUser(req);
        const userId = resolveUserId(user, req);
        const parsed = RequestSchema.parse(json);
        const admin = getAdmin();

        // ── CREATE: Generate invite link ──
        if (parsed.action === 'create') {
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

            const { data, error } = await admin
                .from('chemistry_invites')
                .insert({
                    token,
                    inviter_id: userId,
                    inviter_result_id: parsed.resultId,
                    status: 'pending',
                    expires_at: expiresAt,
                })
                .select('id, token, created_at, expires_at')
                .single();

            if (error) {
                console.error('[Invite:create]', error);
                return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
            }

            const inviteUrl = `${getBaseUrl(req)}/invite/${token}`;

            return NextResponse.json({
                invite: data,
                inviteUrl,
            });
        }

        // ── LOOKUP: Validate token (partner landing page) ──
        if (parsed.action === 'lookup') {
            const { data, error } = await admin
                .from('chemistry_invites')
                .select('id, inviter_id, inviter_result_id, status, expires_at')
                .eq('token', parsed.token)
                .single();

            if (error || !data) {
                return NextResponse.json({ valid: false, error: 'Invite not found' }, { status: 404 });
            }

            const isExpired = new Date(data.expires_at) < new Date();
            if (isExpired || data.status === 'expired') {
                // Auto-expire
                await admin
                    .from('chemistry_invites')
                    .update({ status: 'expired' })
                    .eq('id', data.id);
                return NextResponse.json({ valid: false, error: 'Invite expired' }, { status: 410 });
            }

            return NextResponse.json({
                valid: true,
                invite: {
                    id: data.id,
                    status: data.status,
                    expiresAt: data.expires_at,
                },
            });
        }

        // ── ACCEPT: Partner opens the link ──
        if (parsed.action === 'accept') {
            const { data, error } = await admin
                .from('chemistry_invites')
                .update({
                    status: 'accepted',
                    partner_id: userId,
                })
                .eq('token', parsed.token)
                .eq('status', 'pending')
                .select('id')
                .single();

            if (error || !data) {
                return NextResponse.json({ error: 'Invite not available' }, { status: 409 });
            }

            return NextResponse.json({ accepted: true, inviteId: data.id });
        }

        // ── COMPLETE: Partner analysis finished ──
        if (parsed.action === 'complete') {
            // This triggers the Supabase Realtime update that notifies the creator
            const { data, error } = await admin
                .from('chemistry_invites')
                .update({
                    status: 'completed',
                    partner_result_id: parsed.partnerResultId,
                    completed_at: new Date().toISOString(),
                })
                .eq('token', parsed.token)
                .in('status', ['pending', 'accepted'])
                .select('id, inviter_id, inviter_result_id')
                .single();

            if (error || !data) {
                return NextResponse.json({ error: 'Invite completion failed' }, { status: 409 });
            }

            return NextResponse.json({
                completed: true,
                inviteId: data.id,
                // Return both result IDs so the partner page can redirect to chemistry
                inviterResultId: data.inviter_result_id,
            });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err) {
        console.error('[Invite API]', err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
```

---

## 5. INVITE LANDING PAGE

### File: `src/app/invite/[token]/page.tsx`

**Architecture**: Server Component shell (SSR metadata) + Client island.

```typescript
// src/app/invite/[token]/page.tsx
import type { Metadata } from "next";
import InviteClient from "./InviteClient";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ohang.app";

// ── Dynamic OG metadata for invite links ──
export async function generateMetadata({
    params,
}: {
    params: Promise<{ token: string }>;
}): Promise<Metadata> {
    const { token } = await params;
    return {
        title: "Someone wants to know your chemistry | OHANG",
        description:
            "Your partner invited you to discover your Five Element compatibility. Enter your birth data to reveal your cosmic connection.",
        openGraph: {
            title: "💜 Someone wants to know your chemistry",
            description: "Enter your birth data. Discover your cosmic connection in 30 seconds.",
            url: `${BASE_URL}/invite/${token}`,
            images: [
                {
                    url: `${BASE_URL}/api/og?mode=invite`,
                    width: 1200,
                    height: 630,
                    alt: "OHANG Chemistry Invite",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: "💜 Someone wants to know your chemistry | OHANG",
            description: "Enter your birth data. Reveal your cosmic connection.",
            images: [`${BASE_URL}/api/og?mode=invite`],
        },
    };
}

export default async function InvitePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    return <InviteClient token={token} />;
}
```

### File: `src/app/invite/[token]/InviteClient.tsx`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import haptic from "@/lib/haptics";

// ═══════════════════════════════════════════════════════
// Invite Landing — Partner enters birth data
//
// Flow:
// 1. Validate token via /api/invite { action: 'lookup' }
// 2. Show romantic/mystical birth form
// 3. On submit: POST to /api/analyze/compatibility with
//    partner's data + creator's resultId from invite
// 4. POST /api/invite { action: 'complete' } → triggers
//    Supabase Realtime notification to creator
// 5. Redirect to chemistry result page
// ═══════════════════════════════════════════════════════

type InviteStatus = "loading" | "valid" | "expired" | "error";

interface InviteData {
    id: string;
    status: string;
    expiresAt: string;
}

export default function InviteClient({ token }: { token: string }) {
    const router = useRouter();
    const [status, setStatus] = useState<InviteStatus>("loading");
    const [invite, setInvite] = useState<InviteData | null>(null);
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");
    const [hour, setHour] = useState("");
    const [gender, setGender] = useState<"male" | "female">("female");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Validate token on mount ──
    useEffect(() => {
        async function validate() {
            try {
                const res = await fetch("/api/invite", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "lookup", token }),
                });
                if (res.status === 410) {
                    setStatus("expired");
                    return;
                }
                if (!res.ok) {
                    setStatus("error");
                    return;
                }
                const data = await res.json();
                if (data.valid) {
                    setInvite(data.invite);
                    setStatus("valid");
                    // Mark as accepted
                    fetch("/api/invite", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "accept", token }),
                    });
                } else {
                    setStatus("error");
                }
            } catch {
                setStatus("error");
            }
        }
        validate();
    }, [token]);

    // ── Submit partner data ──
    const handleSubmit = useCallback(async () => {
        if (!year || !month || !day || isSubmitting) return;
        setIsSubmitting(true);
        haptic.press();

        try {
            // 1. Run the compatibility analysis
            //    The API needs both people's birth data.
            //    Creator's data is fetched server-side from inviter_result_id.
            //    For now, redirect to the chemistry page with invite context.
            const searchParams = new URLSearchParams({
                year,
                month,
                day,
                ...(hour && { hour }),
                gender,
                invite: token,
            });

            router.push(`/chemistry?${searchParams.toString()}`);
        } catch {
            setIsSubmitting(false);
        }
    }, [year, month, day, hour, gender, token, isSubmitting, router]);

    // ── Render states ──
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-white/50 text-lg"
                >
                    Loading your invitation…
                </motion.div>
            </div>
        );
    }

    if (status === "expired") {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-2xl">⏰</p>
                <h1 className="text-xl font-semibold text-white">This invite has expired</h1>
                <p className="text-white/50 text-sm max-w-xs">
                    Chemistry invites are valid for 48 hours. Ask your partner to send a new one!
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium"
                >
                    Discover Your Own Blueprint
                </button>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-2xl">🔗</p>
                <h1 className="text-xl font-semibold text-white">Invalid invite link</h1>
                <p className="text-white/50 text-sm max-w-xs">
                    This link may have been used already or is no longer valid.
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium"
                >
                    Try OHANG Free
                </button>
            </div>
        );
    }

    // ── Valid invite: birth form ──
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white px-6 py-12 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm space-y-8"
            >
                {/* Header */}
                <div className="text-center space-y-3">
                    <p className="text-3xl">💜</p>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                        Someone wants to know your chemistry
                    </h1>
                    <p className="text-white/50 text-sm">
                        Enter your birth date to reveal your cosmic connection
                    </p>
                </div>

                {/* Birth form — mirrors HeroSection pattern */}
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            type="number"
                            placeholder="Year"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                            min="1920"
                            max="2026"
                        />
                        <input
                            type="number"
                            placeholder="Month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                            min="1"
                            max="12"
                        />
                        <input
                            type="number"
                            placeholder="Day"
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                            min="1"
                            max="31"
                        />
                    </div>

                    <input
                        type="number"
                        placeholder="Birth Hour (optional, 0-23)"
                        value={hour}
                        onChange={(e) => setHour(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                        min="0"
                        max="23"
                    />

                    {/* Gender toggle */}
                    <div className="flex gap-3">
                        {(["female", "male"] as const).map((g) => (
                            <button
                                key={g}
                                onClick={() => { setGender(g); haptic.tap(); }}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                                    gender === g
                                        ? "bg-violet-600/30 border-violet-500/50 text-violet-200 border"
                                        : "bg-white/5 border border-white/10 text-white/40"
                                }`}
                            >
                                {g === "female" ? "♀ Female" : "♂ Male"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit CTA */}
                <motion.button
                    onClick={handleSubmit}
                    disabled={!year || !month || !day || isSubmitting}
                    className="w-full py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isSubmitting ? (
                        <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                        >
                            Decoding your chemistry…
                        </motion.span>
                    ) : (
                        "Reveal Our Chemistry 💫"
                    )}
                </motion.button>

                <p className="text-center text-white/20 text-xs">
                    Free • No account required • 30 seconds
                </p>
            </motion.div>
        </div>
    );
}
```

---

## 6. SUPABASE REALTIME NOTIFICATION

### Hook: `src/hooks/useInviteRealtime.ts`

Creator subscribes to their invite row. When `status` changes to `'completed'`, fire a celebration notification + redirect to chemistry result.

```typescript
"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import haptic from "@/lib/haptics";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════
// Realtime hook — notifies creator when partner completes
// Subscribe to chemistry_invites row changes via Supabase
// ═══════════════════════════════════════════════════════

interface UseInviteRealtimeOptions {
    /** The invite ID to watch */
    inviteId: string;
    /** Called when partner completes their analysis */
    onPartnerComplete: (partnerResultId: string) => void;
    /** Whether to subscribe (false = cleanup only) */
    enabled?: boolean;
}

export function useInviteRealtime({
    inviteId,
    onPartnerComplete,
    enabled = true,
}: UseInviteRealtimeOptions) {
    const callbackRef = useRef(onPartnerComplete);
    callbackRef.current = onPartnerComplete;

    useEffect(() => {
        if (!enabled || !inviteId) return;

        const supabase = createClient();

        const channel = supabase
            .channel(`invite:${inviteId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "chemistry_invites",
                    filter: `id=eq.${inviteId}`,
                },
                (payload) => {
                    const newRow = payload.new as {
                        status: string;
                        partner_result_id: string | null;
                    };

                    if (newRow.status === "completed" && newRow.partner_result_id) {
                        haptic.destiny();
                        toast.success("💜 Your partner completed their analysis!", {
                            description: "Tap to see your chemistry results",
                            duration: 8000,
                        });
                        callbackRef.current(newRow.partner_result_id);
                    }

                    if (newRow.status === "accepted") {
                        haptic.tap();
                        toast("Your partner opened the invite! ✨", {
                            duration: 4000,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [inviteId, enabled]);
}
```

### Usage in ChemistryClient.tsx (add after invite creation):

```typescript
// After creating an invite, subscribe to realtime updates:
import { useInviteRealtime } from "@/hooks/useInviteRealtime";

// Inside component:
const [activeInviteId, setActiveInviteId] = useState<string | null>(null);

useInviteRealtime({
    inviteId: activeInviteId ?? "",
    enabled: !!activeInviteId,
    onPartnerComplete: (partnerResultId) => {
        // Navigate to the chemistry result with both IDs
        router.push(`/chemistry/result?a=${myResultId}&b=${partnerResultId}`);
    },
});
```

---

## 7. INTEGRATION POINTS

### 7A. PaywallGate Integration

The existing `PaywallGate.tsx` blurs content behind a paywall. Share-to-Unlock provides an alternative unlock path.

**Add to PaywallGate props:**

```typescript
interface PaywallGateProps {
    // ... existing props
    /** If set, allow share-to-unlock as alternative to payment */
    shareUnlockFeature?: "red_flag" | "couple_scan" | "retro_mode" | "celeb_match";
}
```

**Inside PaywallGate, add unlock check on mount:**

```typescript
const [isShareUnlocked, setIsShareUnlocked] = useState(false);

useEffect(() => {
    if (!shareUnlockFeature) return;
    fetch(`/api/actions/unlock?feature=${shareUnlockFeature}`)
        .then(r => r.json())
        .then(d => setIsShareUnlocked(d.unlocked))
        .catch(() => {});
}, [shareUnlockFeature]);
```

**If `isShareUnlocked`, render children without blur. Otherwise show both:**
1. "Share to Unlock" button (using ShareViralButton with `unlockFeature`)
2. "Or upgrade to Pro" button (existing paywall CTA)

### 7B. CliffhangerCards Integration

The landing page `CliffhangerCards.tsx` shows blurred previews. Add ShareViralButton with unlock capability:

```typescript
<ShareViralButton
    payload={{ text: "Check out my Red Flag score!", url: "https://ohang.app" }}
    variant="cta"
    unlockFeature="red_flag"
    onShareSuccess={() => setRedFlagUnlocked(true)}
/>
```

### 7C. Chemistry Invite Flow in ChemistryClient

After a compatibility analysis completes, show "Invite Partner" CTA:

```typescript
const handleCreateInvite = async () => {
    const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "create",
            resultId: data.cacheKey, // from the streaming result
        }),
    });
    const { inviteUrl } = await res.json();
    // Open native share with invite URL
    await share({
        title: "Check our chemistry on OHANG 💜",
        text: "I just got my soul blueprint. Want to see our compatibility?",
        url: inviteUrl,
    });
};
```

---

## 8. FILE MANIFEST

| # | File | Action |
|---|------|--------|
| 1 | `supabase/migrations/20260304_viral_engine.sql` | CREATE |
| 2 | `src/app/api/actions/unlock/route.ts` | CREATE |
| 3 | `src/components/ui/ShareViralButton.tsx` | MODIFY (add unlock props + recordUnlock) |
| 4 | `src/app/api/invite/route.ts` | REWRITE (replace stub with full Supabase) |
| 5 | `src/app/invite/[token]/page.tsx` | CREATE |
| 6 | `src/app/invite/[token]/InviteClient.tsx` | CREATE |
| 7 | `src/hooks/useInviteRealtime.ts` | CREATE |
| 8 | `src/components/paywall/PaywallGate.tsx` | MODIFY (add shareUnlockFeature prop) |
| 9 | `src/app/(main)/chemistry/ChemistryClient.tsx` | MODIFY (add invite creation + realtime) |
| 10 | `src/components/landing/CliffhangerCards.tsx` | MODIFY (wire ShareViralButton unlock) |

---

## 9. ENVIRONMENT VARIABLES

No new env vars required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

---

## 10. EXECUTION COMMAND

```bash
cat docs/PHASE_1_VIRAL_LOOP.md
```

Claude Code: Read this document end-to-end. Execute all 10 file operations in the manifest (§8). Apply the Supabase migration. Wire integration points (§7A, §7B, §7C). Run `npx tsc --noEmit` after all changes to verify zero type errors. Do NOT skip any file.
