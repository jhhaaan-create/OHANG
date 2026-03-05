import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════
// OHANG Infrastructure v3.2 — Cache, Rate Limiter, Auth
// Security Hardened: Fail-Close, IP-based Anon, Private Admin
// ═══════════════════════════════════════════════════════

// ── Supabase Admin (PRIVATE — lazy singleton) ────────
// Lazy initialization prevents build-time crash when env vars
// are not available (e.g., during `next build` static analysis).

let _supabaseAdmin: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
    if (_supabaseAdmin) return _supabaseAdmin;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('FATAL: Supabase credentials missing. Check .env.local');
    }

    _supabaseAdmin = createClient(url, key, {
        auth: { persistSession: false },
    });
    return _supabaseAdmin;
}

// ── Auth Helper (Replaces direct supabaseAdmin.auth usage) ──

/**
 * Extracts the authenticated user from the request's Authorization header.
 * Returns the user object or null if unauthenticated.
 */
export async function getAuthenticatedUser(req: Request) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) return null;

    const { data: { user }, error } = await getAdmin().auth.getUser(token);
    if (error || !user) return null;
    return user;
}

/**
 * Derives a stable identifier for rate limiting.
 * Authenticated users -> user.id
 * Anonymous users -> IP address (prevents the "all anonymous = one ID" bug)
 */
export function resolveUserId(
    user: { id: string } | null,
    req: Request
): string {
    if (user?.id) return user.id;

    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        const firstIp = forwarded.split(',')[0]?.trim();
        if (firstIp) return `anon:${firstIp}`;
    }

    const realIp = req.headers.get('x-real-ip');
    if (realIp) return `anon:${realIp}`;

    return `anon:${crypto.randomUUID()}`;
}

// ── 1. Cache Key Generator (SHA-256 Deterministic Hash) ──

export function generateCacheKey(prefix: string, context: Record<string, unknown>): string {
    const sortedKeys = Object.keys(context).sort();
    const canonicalString = JSON.stringify(context, sortedKeys);
    const hash = crypto.createHash('sha256').update(canonicalString).digest('hex');
    return `${prefix}:${hash}`;
}

// ── 2. Cache Operations ─────────────────────────────

export async function getCachedResult<T>(cacheKey: string): Promise<T | null> {
    try {
        const { data, error } = await getAdmin()
            .from('ai_cache')
            .select('result_json, expires_at')
            .eq('cache_key', cacheKey)
            .single();

        if (error || !data) return null;

        if (new Date(data.expires_at) < new Date()) {
            getAdmin().from('ai_cache').delete().eq('cache_key', cacheKey).then();
            return null;
        }

        return data.result_json as T;
    } catch (err) {
        console.warn('Cache Read Warning:', err);
        return null;
    }
}

export async function setCachedResult(
    cacheKey: string,
    result: unknown,
    ttlHours = 24
): Promise<void> {
    try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + ttlHours);

        await getAdmin().from('ai_cache').upsert(
            {
                cache_key: cacheKey,
                result_json: result,
                expires_at: expiresAt.toISOString(),
            },
            { onConflict: 'cache_key' }
        );
    } catch (err) {
        console.error('Cache Write Error:', err);
    }
}

// ── 3. Rate Limiting (Fail-Close Policy) ────────────

/**
 * Rate limiter with FAIL-CLOSE policy.
 * If Supabase is unreachable, requests are BLOCKED (not allowed through).
 * This prevents cost-bomb attacks when DB is under load.
 */
export async function checkRateLimit(
    identifier: string,
    feature: string,
    isPremium: boolean
): Promise<void> {
    const WINDOW_MINUTES = 1;
    const LIMIT = isPremium ? 20 : 5;

    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - WINDOW_MINUTES);

    const { count, error } = await getAdmin()
        .from('user_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', identifier)
        .eq('feature_name', feature)
        .gte('used_at', timeWindow.toISOString());

    // FAIL-CLOSE: DB errors block the request
    if (error) {
        console.error('Rate Limit Check Failed (Fail-Close):', error);
        throw new Error('Service temporarily unavailable. Please retry.');
    }

    if ((count || 0) >= LIMIT) {
        throw new Error(`Rate Limit Exceeded: Max ${LIMIT} requests/min.`);
    }
}

// ── 4. Usage Logging ────────────────────────────────

export async function logUsage(identifier: string, feature: string): Promise<void> {
    const { error } = await getAdmin().from('user_usage').insert({
        user_id: identifier,
        feature_name: feature,
    });

    // FAIL-CLOSE: If usage insert fails, the rate-limit counter won't increment,
    // allowing unlimited requests. Block to prevent bypass.
    if (error) {
        console.error('Usage Log Failed (fail-close):', error);
        throw new Error('Service temporarily unavailable. Please retry in a moment.');
    }
}
