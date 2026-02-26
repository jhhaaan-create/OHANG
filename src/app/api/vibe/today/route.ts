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
import { getTodayPillar, parseKSTDate } from '@/lib/vibe/todayPillar';

// ═══════════════════════════════════════════════════════
// OHANG API — Daily Vibe (Retention Engine)
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
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    tone: z.enum(['savage', 'balanced', 'gentle']).default('balanced'),
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const user = await getAuthenticatedUser(req);
        const userId = resolveUserId(user, req);

        const { year, month, day, hour, minute, gender, date: dateStr, tone } = RequestSchema.parse(json);

        await checkRateLimit(userId, 'daily_vibe', false);

        const isUnknownTime = hour === null || hour === undefined;
        const chart = SajuEngine.compute({
            year, month, day,
            hour: isUnknownTime ? 12 : hour,
            minute: isUnknownTime ? 0 : (minute || 0),
            gender,
        });
        const context = formatChartToAiContext(chart, { isUnknownTime });

        const targetDate = dateStr ? parseKSTDate(dateStr) : new Date();
        const todayPillar = getTodayPillar(targetDate);

        const cacheKey = generateCacheKey('daily_vibe', {
            context, today: todayPillar.pillar, tone,
        });

        const cachedData = await getCachedResult(cacheKey);
        if (cachedData) {
            await logUsage(userId, 'daily_vibe');
            return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }

        const result = await OhangEngine.streamDailyVibe(context, todayPillar, {
            userId, cacheKey, tone,
        });
        return result.toTextStreamResponse({ headers: { 'X-Cache': 'MISS' } });

    } catch (error) {
        console.error('[DailyVibe API]', error);

        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({ error: 'Invalid input format.' }), { status: 400 });
        }

        const message = error instanceof Error ? error.message : 'System Error';
        const isRateLimit = message.includes('Rate Limit');

        return new Response(
            JSON.stringify({ error: message }),
            { status: isRateLimit ? 429 : 500 }
        );
    }
}
