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
    shareMethod: z.enum(['native', 'clipboard', 'download']).optional().default('native'),
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
            return NextResponse.json({ error: 'Invalid request', details: err.issues }, { status: 400 });
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
