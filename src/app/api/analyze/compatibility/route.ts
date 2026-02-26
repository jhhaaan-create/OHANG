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
// OHANG API — Compatibility Analysis (55-Pair Chemistry)
// ═══════════════════════════════════════════════════════

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const PersonSchema = z.object({
    year: z.number().int(),
    month: z.number().int(),
    day: z.number().int(),
    hour: z.number().int().optional().nullable(),
    minute: z.number().int().optional().nullable(),
    gender: z.enum(['male', 'female']),
});

const RequestSchema = z.object({
    personA: PersonSchema,
    personB: PersonSchema,
    tone: z.enum(['savage', 'balanced', 'gentle']).default('balanced'),
});

function computeContext(person: z.infer<typeof PersonSchema>) {
    const isUnknownTime = person.hour === null || person.hour === undefined;
    const chart = SajuEngine.compute({
        year: person.year,
        month: person.month,
        day: person.day,
        hour: isUnknownTime ? 12 : (person.hour ?? 12),
        minute: isUnknownTime ? 0 : (person.minute ?? 0),
        gender: person.gender,
    });
    return { context: formatChartToAiContext(chart, { isUnknownTime }), isUnknownTime };
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const user = await getAuthenticatedUser(req);
        const userId = resolveUserId(user, req);

        const { personA, personB, tone } = RequestSchema.parse(json);

        await checkRateLimit(userId, 'compatibility', false);

        const { context: ctxA } = computeContext(personA);
        const { context: ctxB } = computeContext(personB);

        const cacheKey = generateCacheKey('compatibility', {
            a: ctxA, b: ctxB, tone,
        });

        const cachedData = await getCachedResult(cacheKey);
        if (cachedData) {
            await logUsage(userId, 'compatibility');
            return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }

        const result = await OhangEngine.streamCompatibility(ctxA, ctxB, {
            userId, cacheKey, tone,
        });
        return result.toTextStreamResponse({ headers: { 'X-Cache': 'MISS' } });

    } catch (error) {
        console.error('[Compatibility API]', error);

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
