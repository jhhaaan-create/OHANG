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
            return NextResponse.json({ error: 'Invalid request', details: err.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
