import { z } from 'zod';
import crypto from 'crypto';
import {
    getAuthenticatedUser,
    resolveUserId,
} from '@/lib/ai/cache';

// ═══════════════════════════════════════════════════════
// OHANG API — Partner Invite Token (Share-to-Unlock)
// Creates a unique invite link so partner can enter their data.
// ═══════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
    action: z.literal('create'),
    resultId: z.string().min(1),
});

const LookupSchema = z.object({
    action: z.literal('lookup'),
    token: z.string().min(32),
});

const RequestSchema = z.discriminatedUnion('action', [CreateSchema, LookupSchema]);

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const user = await getAuthenticatedUser(req);
        const userId = resolveUserId(user, req);

        const parsed = RequestSchema.parse(json);

        if (parsed.action === 'create') {
            // Generate a unique invite token
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 48); // 48-hour expiry

            const invite = {
                id: crypto.randomUUID(),
                inviter_id: userId,
                token,
                result_id: parsed.resultId,
                status: 'pending' as const,
                created_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
            };

            // In production, this would be stored in Supabase.
            // For now, we return the invite data to the client.
            const inviteUrl = `${getBaseUrl(req)}/chemistry?invite=${token}`;

            return new Response(JSON.stringify({
                invite,
                inviteUrl,
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (parsed.action === 'lookup') {
            // In production, look up the token in Supabase.
            // For now, return a placeholder response.
            return new Response(JSON.stringify({
                valid: true,
                message: 'Token lookup requires Supabase integration.',
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });

    } catch (error) {
        console.error('[Invite API]', error);

        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({ error: 'Invalid request.' }), { status: 400 });
        }

        return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500 }
        );
    }
}

function getBaseUrl(req: Request): string {
    const host = req.headers.get('host') || 'ohang.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
}
