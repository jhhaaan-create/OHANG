import { z } from 'zod';
import { SajuEngine } from '@/lib/saju/engine';
import { formatChartToAiContext } from '@/lib/saju/adapter';
import {
    checkRateLimit,
    generateCacheKey,
    getCachedResult,
    logUsage,
    getAuthenticatedUser,
    resolveUserId,
} from '@/lib/ai/cache';
import { OhangEngine } from '@/lib/ai/engine';

// ═══════════════════════════════════════════════════════
// OHANG API — Celebrity Energy Match (Viral Feature)
// Requires: Face image + optional Saju data
// ═══════════════════════════════════════════════════════

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
    image: z.string().max(10 * 1024 * 1024, 'Image too large. Max 10MB.'),
    saju: z.object({
        year: z.number().int(),
        month: z.number().int(),
        day: z.number().int(),
        hour: z.number().int().optional().nullable(),
        minute: z.number().int().optional().nullable(),
        gender: z.enum(['male', 'female']),
    }).optional(),
    tone: z.enum(['savage', 'balanced', 'gentle']).default('balanced'),
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const auth = await getAuthenticatedUser(req);
        const userId = resolveUserId(auth, req);

        const { image, saju, tone } = RequestSchema.parse(json);

        await checkRateLimit(userId, 'celeb_match', false);

        let sajuContext = null;
        if (saju) {
            const isUnknownTime = saju.hour === null || saju.hour === undefined;
            const chart = SajuEngine.compute({
                year: saju.year,
                month: saju.month,
                day: saju.day,
                hour: isUnknownTime ? 12 : (saju.hour ?? 12),
                minute: isUnknownTime ? 0 : (saju.minute ?? 0),
                gender: saju.gender,
            });
            sajuContext = formatChartToAiContext(chart, { isUnknownTime });
        }

        const cacheKey = generateCacheKey('celeb_match', {
            imageHash: image.slice(0, 64), // partial hash for cache key
            saju: sajuContext,
            tone,
        });

        const cachedData = await getCachedResult(cacheKey);
        if (cachedData) {
            await logUsage(userId, 'celeb_match');
            return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }

        const result = await OhangEngine.streamCelebMatch(image, sajuContext, {
            userId, cacheKey, tone,
        });
        return result.toTextStreamResponse({ headers: { 'X-Cache': 'MISS' } });

    } catch (error) {
        console.error('[CelebMatch API]', error);

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
