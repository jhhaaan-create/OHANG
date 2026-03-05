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
// OHANG API — Red Flag Radar (Dating Risk Assessment)
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
    partner: PersonSchema,
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

        const { user, partner, tone } = RequestSchema.parse(json);

        await checkRateLimit(userId, 'red_flag', false);

        const ctxUser = computeContext(user);
        const ctxPartner = computeContext(partner);

        const cacheKey = generateCacheKey('red_flag', {
            user: ctxUser, partner: ctxPartner, tone,
        });

        const cachedData = await getCachedResult(cacheKey);
        if (cachedData) {
            await logUsage(userId, 'red_flag');
            return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }

        const result = await OhangEngine.streamRedFlag(ctxUser, ctxPartner, {
            userId, cacheKey, tone,
        });
        return result.toTextStreamResponse({ headers: { 'X-Cache': 'MISS' } });

    } catch (error) {
        console.error('[RedFlag API]', error);

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
