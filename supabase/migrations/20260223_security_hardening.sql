-- ═══════════════════════════════════════════════════════
-- OHANG Security Hardening Migration
-- Date: 2026-02-23
-- Audit: C-02 (RLS), H-03 (user_id type mismatch)
-- ═══════════════════════════════════════════════════════

-- ─── 1. Fix user_usage.user_id type (H-03) ─────────────
-- Problem: user_id is UUID with FK to auth.users, but code sends
--          "anon:1.2.3.4" strings for anonymous users → FK violation.
-- Solution: Change to TEXT, drop FK constraint.

ALTER TABLE public.user_usage
    ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.user_usage
    DROP CONSTRAINT IF EXISTS user_usage_user_id_fkey;

-- ─── 2. Enable RLS on ai_cache (C-02) ──────────────────

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Service Role (admin) can do everything — used by server-side code
CREATE POLICY "service_role_all_ai_cache"
    ON public.ai_cache
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Anon/authenticated users cannot access cache directly
-- (All cache access goes through service_role via server API)
CREATE POLICY "deny_anon_ai_cache"
    ON public.ai_cache
    FOR ALL
    TO anon, authenticated
    USING (false);

-- ─── 3. Enable RLS on user_usage (C-02) ─────────────────

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Service Role can do everything
CREATE POLICY "service_role_all_user_usage"
    ON public.user_usage
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can only read their own usage
CREATE POLICY "users_read_own_usage"
    ON public.user_usage
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::text);

-- Anon users cannot access usage table
CREATE POLICY "deny_anon_user_usage"
    ON public.user_usage
    FOR ALL
    TO anon
    USING (false);

-- ─── 4. Add index for rate limit performance ────────────

CREATE INDEX IF NOT EXISTS user_usage_rate_limit_idx
    ON public.user_usage (user_id, feature_name, used_at DESC);

-- ─── 5. Auto-cleanup expired cache (M-05 partial) ───────
-- Note: Full solution requires pg_cron. This adds a helper function.

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.ai_cache
    WHERE expires_at < now();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- To schedule with pg_cron (run in Supabase SQL Editor):
-- SELECT cron.schedule('cleanup-expired-cache', '0 */6 * * *', 'SELECT public.cleanup_expired_cache()');
