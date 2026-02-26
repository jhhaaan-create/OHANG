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
// OHANG API — Retro Mode (Ex-Partner Closure Analysis)
// IAP: $1.99 one-time unlock
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
    user: PersonSchema,
    ex: PersonSchema,
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
    return formatChartToAiContext(chart, { isUnknownTime });
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const auth = await getAuthenticatedUser(req);
        const userId = resolveUserId(auth, req);

        const { user, ex, tone } = RequestSchema.parse(json);

        await checkRateLimit(userId, 'retro_mode', false);

        const ctxUser = computeContext(user);
        const ctxEx = computeContext(ex);

        const cacheKey = generateCacheKey('retro_mode', {
            user: ctxUser, ex: ctxEx, tone,
        });

        const cachedData = await getCachedResult(cacheKey);
        if (cachedData) {
            await logUsage(userId, 'retro_mode');
            return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }

        const result = await OhangEngine.streamRetroMode(ctxUser, ctxEx, {
            userId, cacheKey, tone,
        });
        return result.toTextStreamResponse({ headers: { 'X-Cache': 'MISS' } });

    } catch (error) {
        console.error('[RetroMode API]', error);

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
