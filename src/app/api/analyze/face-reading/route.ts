import { z } from 'zod';
import {
    checkRateLimit,
    generateCacheKey,
    getCachedResult,
    logUsage,
    getAuthenticatedUser,
    resolveUserId,
} from '@/lib/ai/cache';
import { OhangEngine } from '@/lib/ai/engine';
import type { OHANGContext } from '@/lib/saju/adapter';

// ═══════════════════════════════════════════════════════
// OHANG API — Face Reading (K-Gwansang Vision)
// Failover chain: GPT-4o → GPT-4o-mini → Claude → Text
// ═══════════════════════════════════════════════════════

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
    imageUrl: z.string().url().refine(
        (url) => {
            const allowed = ['vercel-storage.com', 'blob.vercel-storage.com', 'supabase.co/storage'];
            try {
                const hostname = new URL(url).hostname;
                return url.startsWith('https://') && allowed.some(domain => hostname === domain || hostname.endsWith('.' + domain));
            } catch {
                return false;
            }
        },
        { message: 'Only images from verified storage providers are accepted' }
    ),
    sajuContext: z.any().optional().nullable(),
    tone: z.enum(['savage', 'balanced', 'gentle']).default('balanced'),
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const user = await getAuthenticatedUser(req);
        const userId = resolveUserId(user, req);

        const { imageUrl, sajuContext, tone } = RequestSchema.parse(json);

        await checkRateLimit(userId, 'face_reading', false);

        const cacheKey = generateCacheKey('face_reading', {
            imageUrl, sajuContext: sajuContext || 'none', tone,
        });

        const cachedData = await getCachedResult(cacheKey);
        if (cachedData) {
            await logUsage(userId, 'face_reading');
            return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }

        const result = await OhangEngine.streamFaceReading(
            imageUrl,
            sajuContext as OHANGContext | null,
            { userId, cacheKey, tone }
        );
        return result.toTextStreamResponse({
            headers: { 'X-Cache': 'MISS' },
        });

    } catch (error) {
        console.error('[FaceReading API]', error);

        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({ error: 'Invalid input format.' }), { status: 400 });
        }

        const message = error instanceof Error ? error.message : 'System Error';
        const isRateLimit = message.includes('Rate Limit');

        const isTimeout = message.includes('TIMEOUT') || message.includes('timed out');

        return new Response(
            JSON.stringify({
                error: isTimeout
                    ? 'Destiny is re-aligning. Please try again in a moment.'
                    : message,
            }),
            { status: isRateLimit ? 429 : isTimeout ? 504 : 500 }
        );
    }
}
