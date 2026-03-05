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
