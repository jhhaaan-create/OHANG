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
// OHANG API Gateway v3.2 — Dual-Modal Analysis
// Dedicated Vision + Saju endpoint
// Saju: Uses SajuEngine (astronomy-engine based).
// ═══════════════════════════════════════════════════════

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
    birthData: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
        hour: z.number().optional().nullable(),
        minute: z.number().optional().nullable(),
        gender: z.enum(['male', 'female']),
    }),
    image: z.string()
        .max(10 * 1024 * 1024, 'Image data too large. Maximum 10MB.') // Security Audit H-02
        .refine(
            (val) => val.startsWith('data:image/') ||
                (val.startsWith('https://') &&
                    (val.includes('.vercel-storage.com') || val.includes('.public.blob.vercel-storage.com'))),
            'Only Base64 image data or Vercel Blob URLs accepted'
        ),
    tone: z.enum(['savage', 'balanced', 'gentle']).default('balanced'),
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const user = await getAuthenticatedUser(req);
        const userId = resolveUserId(user, req);

        await checkRateLimit(userId, 'dual_modal', false);

        const { birthData, image, tone } = RequestSchema.parse(json);

        const isUnknownTime = birthData.hour == null;
        const calcHour: number = isUnknownTime ? 12 : (birthData.hour as number);
        const calcMinute: number = isUnknownTime ? 0 : ((birthData.minute as number) ?? 0);
        const chart = SajuEngine.compute({
            year: birthData.year,
            month: birthData.month,
            day: birthData.day,
            hour: calcHour,
            minute: calcMinute,
            gender: birthData.gender,
        });

        const context = formatChartToAiContext(chart, { isUnknownTime });

        const cacheKey = generateCacheKey('dual_modal', {
            ...context,
            tone,
            image_preview: image.slice(0, 50),
        });

        const cachedData = await getCachedResult(cacheKey);
        if (cachedData) {
            await logUsage(userId, 'dual_modal');
            return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }

        const result = await OhangEngine.streamDualModalAnalysis(
            context,
            image,
            { userId, cacheKey, tone, isUnknownTime }
        );

        return result.toTextStreamResponse({ headers: { 'X-Cache': 'MISS' } });

    } catch (error) {
        console.error('[Dual-Modal API Error]:', error);

        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({ error: 'Invalid data format.' }), { status: 400 });
        }

        const message = error instanceof Error ? error.message : 'System Error';
        const isRateLimit = message.includes('Rate Limit');
        const isUnavailable = message.includes('temporarily unavailable');
        const isTimeout = message.includes('TIMEOUT') || message.includes('timed out');

        return new Response(
            JSON.stringify({
                error: isTimeout
                    ? 'Destiny is re-aligning. Please try again in a moment.'
                    : message,
            }),
            { status: isRateLimit ? 429 : isTimeout ? 504 : isUnavailable ? 503 : 500 }
        );
    }
}
