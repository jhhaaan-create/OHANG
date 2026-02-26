import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SajuEngine } from '@/lib/saju/engine';
import { SajuInput } from '@/lib/saju/types';

// ⚡ Edge Runtime for Performance
export const runtime = 'edge';

// 🛡️ IP-based Rate Limiter (Security Audit H-01) — 30 req/min for public endpoint
const sajuRateMap = new Map<string, { count: number; resetAt: number }>();

function checkSajuRateLimit(req: Request): boolean {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const entry = sajuRateMap.get(ip);
    if (!entry || now > entry.resetAt) {
        sajuRateMap.set(ip, { count: 1, resetAt: now + 60_000 });
        return true;
    }
    if (entry.count >= 30) return false;
    entry.count++;
    return true;
}

// 🛡️ Schema Definition
const RequestSchema = z.object({
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    gender: z.enum(['male', 'female']),
    timezone: z.string().optional().default('Asia/Seoul'),
}).refine((data) => {
    // Validate Day based on Month (e.g., Feb 30 check)
    const daysInMonth = new Date(data.year, data.month, 0).getDate();
    return data.day <= daysInMonth;
}, {
    message: "Invalid date for this month",
    path: ["day"],
});

export async function POST(req: Request) {
    try {
        // 0. Rate Limit (IP-based, 30/min)
        if (!checkSajuRateLimit(req)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Max 30 requests/min.' },
                { status: 429 }
            );
        }

        const body = await req.json();

        // 1. Validation
        const validation = RequestSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid Input', details: validation.error.format() },
                { status: 400 }
            );
        }

        const input = validation.data as SajuInput;

        // 2. Calculation
        const chart = SajuEngine.compute(input);

        // 3. Response
        return NextResponse.json({
            success: true,
            data: chart,
            meta: {
                calculatedAt: new Date().toISOString(),
                version: 'v3.2-astronomy'
            }
        });

    } catch (error) {
        console.error('[Saju Engine Error]:', error);
        return NextResponse.json(
            { error: 'Internal Calculation Error', message: (error as Error).message },
            { status: 500 }
        );
    }
}
