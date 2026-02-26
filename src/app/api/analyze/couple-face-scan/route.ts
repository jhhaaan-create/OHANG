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
// OHANG API — Couple Face Scan ($2.99 IAP)
// Two face images → visual chemistry analysis
// ═══════════════════════════════════════════════════════

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const PersonSajuSchema = z.object({
    year: z.number().int(),
    month: z.number().int(),
    day: z.number().int(),
    hour: z.number().int().optional().nullable(),
    minute: z.number().int().optional().nullable(),
    gender: z.enum(['male', 'female']),
}).optional();

const RequestSchema = z.object({
    imageA: z.string().max(10 * 1024 * 1024, 'Image A too large. Max 10MB.'),
    imageB: z.string().max(10 * 1024 * 1024, 'Image B too large. Max 10MB.'),
    sajuA: PersonSajuSchema,
    sajuB: PersonSajuSchema,
    tone: z.enum(['savage', 'balanced', 'gentle']).default('balanced'),
});

function computeContextOptional(saju?: z.infer<typeof PersonSajuSchema>) {
    if (!saju) return null;
    const isUnknownTime = saju.hour === null || saju.hour === undefined;
    const chart = SajuEngine.compute({
        year: saju.year,
        month: saju.month,
        day: saju.day,
        hour: isUnknownTime ? 12 : (saju.hour ?? 12),
        minute: isUnknownTime ? 0 : (saju.minute ?? 0),
        gender: saju.gender,
    });
    return formatChartToAiContext(chart, { isUnknownTime });
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const auth = await getAuthenticatedUser(req);
        const userId = resolveUserId(auth, req);

        const { imageA, imageB, sajuA, sajuB, tone } = RequestSchema.parse(json);

        await checkRateLimit(userId, 'couple_face_scan', false);

        const ctxA = computeContextOptional(sajuA);
        const ctxB = computeContextOptional(sajuB);

        const cacheKey = generateCacheKey('couple_face_scan', {
            imgA: imageA.slice(0, 64),
            imgB: imageB.slice(0, 64),
            sajuA: ctxA,
            sajuB: ctxB,
            tone,
        });

        const cachedData = await getCachedResult(cacheKey);
        if (cachedData) {
            await logUsage(userId, 'couple_face_scan');
            return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }

        const result = await OhangEngine.streamCoupleFaceScan(
            imageA, imageB, ctxA, ctxB,
            { userId, cacheKey, tone }
        );
        return result.toTextStreamResponse({ headers: { 'X-Cache': 'MISS' } });

    } catch (error) {
        console.error('[CoupleFaceScan API]', error);

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
