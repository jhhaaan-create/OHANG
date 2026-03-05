import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════
// OHANG Edge Firewall v3.2
// Blocks bots and unauthorized origins BEFORE they hit the API
// Production: strict CORS, origin validation, bot detection
// ═══════════════════════════════════════════════════════

function getAllowedOrigin(req: NextRequest): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.NODE_ENV !== 'production') return '*';
    if (!appUrl) return '';

    const origin = req.headers.get('origin');
    if (origin && new URL(origin).host === new URL(appUrl).host) {
        return origin;
    }
    return '';
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        const preflight = new NextResponse(null, { status: 204 });
        const allowed = getAllowedOrigin(req);
        if (allowed) preflight.headers.set('Access-Control-Allow-Origin', allowed);
        preflight.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        preflight.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        preflight.headers.set('Access-Control-Max-Age', '86400');
        return preflight;
    }

    // 1. API Guard: Protect ALL sensitive API routes (Security Audit C-03)
    // Exemptions: /api/health (monitoring), /api/stripe/webhook (Stripe signature), /api/og (public)
    const UNGUARDED_PATHS = ['/api/health', '/api/stripe/webhook', '/api/og', '/api/og/chemistry', '/api/analyze/red-flag', '/features/red-flag', '/features/couple-scan', '/features/retro-mode', '/features/celeb-match'];
    const needsGuard = pathname.startsWith('/api/') && !UNGUARDED_PATHS.some((p) => pathname.startsWith(p));
    if (needsGuard) {
        const referer = req.headers.get('referer');
        const origin = req.headers.get('origin');
        const host = req.headers.get('host');

        if (process.env.NODE_ENV === 'production') {
            const isValidOrigin = (origin && host && origin.includes(host))
                || (referer && host && referer.includes(host));

            if (!isValidOrigin) {
                return new NextResponse(
                    JSON.stringify({ error: 'Unauthorized Origin' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // 2. Bot detection (UA-based)
        const ua = req.headers.get('user-agent') || '';
        const botPatterns = ['Python', 'Curl', 'Bot', 'Scrapy', 'HttpClient', 'axios/', 'node-fetch'];
        if (botPatterns.some((p) => ua.includes(p))) {
            return new NextResponse(
                JSON.stringify({ error: 'Humanity check failed.' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // 3. CORS — production-safe
    const res = NextResponse.next();
    const allowed = getAllowedOrigin(req);
    if (allowed) {
        res.headers.set('Access-Control-Allow-Origin', allowed);
        res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    return res;
}

export const config = {
    matcher: '/api/:path*',
};
