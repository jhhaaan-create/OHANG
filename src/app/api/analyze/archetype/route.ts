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
// OHANG API Gateway v3.2 — Archetype Analysis
// Unified: All AI calls go through OhangEngine.
// Saju: Uses SajuEngine (astronomy-engine based).
// ═══════════════════════════════════════════════════════

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
    year: z.number().int(),
    month: z.number().int(),
    day: z.number().int(),
    hour: z.number().int().optional().nullable(),
    minute: z.number().int().optional().nullable(),
    gender: z.enum(['male', 'female']),
    tone: z.enum(['savage', 'balanced', 'gentle']).default('balanced'),
    imageUrl: z.string().url().refine(
        (url) => url.startsWith('https://') &&
            (url.includes('.vercel-storage.com') || url.includes('.public.blob.vercel-storage.com')),
        'Only Vercel Blob URLs accepted'
    ).optional(),
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const user = await getAuthenticatedUser(req);
        const userId = resolveUserId(user, req);

        const { year, month, day, hour, minute, gender, tone, imageUrl } = RequestSchema.parse(json);
        const featureName = imageUrl ? 'dual_modal' : 'archetype';

        await checkRateLimit(userId, featureName, false);

        const isUnknownTime = hour === null || hour === undefined;
        const chart = SajuEngine.compute({
            year, month, day,
            hour: isUnknownTime ? 12 : hour,
            minute: isUnknownTime ? 0 : (minute || 0),
            gender,
        });

        const context = formatChartToAiContext(chart, { isUnknownTime });

        const cacheKey = generateCacheKey(featureName, {
            ...context,
            tone,
            imageUrl: imageUrl || 'none',
        });

        const cachedData = await getCachedResult(cacheKey);
        if (cachedData) {
            await logUsage(userId, featureName);
            return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }

        const engineOptions = { userId, cacheKey, tone, isUnknownTime };

        if (imageUrl) {
            const result = await OhangEngine.streamDualModalAnalysis(context, imageUrl, engineOptions);
            return result.toTextStreamResponse({ headers: { 'X-Cache': 'MISS' } });
        } else {
            const result = await OhangEngine.streamArchetypeAnalysis(context, engineOptions);
            return result.toTextStreamResponse({ headers: { 'X-Cache': 'MISS' } });
        }

    } catch (error) {
        console.error('Gateway Error:', error);

        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({ error: 'Invalid input format.' }), { status: 400 });
        }

        const message = error instanceof Error ? error.message : 'System Error';
        const isRateLimit = message.includes('Rate Limit');
        const isUnavailable = message.includes('temporarily unavailable');

        return new Response(
            JSON.stringify({ error: message }),
            { status: isRateLimit ? 429 : isUnavailable ? 503 : 500 }
        );
    }
}
