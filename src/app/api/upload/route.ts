import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser, resolveUserId } from '@/lib/ai/cache';

// ═══════════════════════════════════════════════════════
// OHANG Blob Storage Gateway — SECURITY HARDENED
// Auth Required | 5MB Limit | Image-Only | Rate Limited
// Patched: 2026-02-23 (Security Audit C-01)
// ═══════════════════════════════════════════════════════

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

// In-memory rate limiter (per-user, 10 uploads/min)
const uploadCounts = new Map<string, { count: number; resetAt: number }>();

function checkUploadRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = uploadCounts.get(userId);
    if (!entry || now > entry.resetAt) {
        uploadCounts.set(userId, { count: 1, resetAt: now + 60_000 });
        return true;
    }
    if (entry.count >= 10) return false;
    entry.count++;
    return true;
}

export async function POST(request: Request) {
    try {
        // 1. Authentication — REQUIRED
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required.' },
                { status: 401 }
            );
        }
        const userId = resolveUserId(user, request);

        // 2. Rate Limit (10 uploads/min per user)
        if (!checkUploadRateLimit(userId)) {
            return NextResponse.json(
                { error: 'Upload rate limit exceeded. Max 10/min.' },
                { status: 429 }
            );
        }

        // 3. Validate Request Body
        if (!request.body) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 4. Validate Content-Type
        const contentType = request.headers.get('content-type') || '';
        const isAllowedType = ALLOWED_TYPES.some((t) => contentType.includes(t));

        // 5. Validate & sanitize filename
        const { searchParams } = new URL(request.url);
        const rawFilename = searchParams.get('filename') || 'user-upload.jpg';
        const sanitizedFilename = rawFilename
            .replace(/[/\\:*?"<>|]/g, '_')
            .slice(0, 100);
        const ext = sanitizedFilename.toLowerCase().slice(sanitizedFilename.lastIndexOf('.'));
        const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);

        if (!isAllowedType && !isAllowedExt) {
            return NextResponse.json(
                { error: 'Only image files allowed (JPEG, PNG, WebP, HEIC).' },
                { status: 400 }
            );
        }

        // 6. Read body and enforce size limit
        const bodyBuffer = await request.arrayBuffer();
        if (bodyBuffer.byteLength > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 413 }
            );
        }
        if (bodyBuffer.byteLength === 0) {
            return NextResponse.json({ error: 'Empty file.' }, { status: 400 });
        }

        // 7. Upload to Vercel Blob
        const blob = await put(sanitizedFilename, bodyBuffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        // 8. Return the Public URL
        return NextResponse.json(blob);
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
