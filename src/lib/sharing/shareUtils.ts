// ═══════════════════════════════════════════════════════
// OHANG — Share Utilities (Web Share API + Fallbacks)
// ═══════════════════════════════════════════════════════

export type SharePlatform = "native" | "clipboard" | "kakao" | "instagram" | "twitter";

export interface SharePayload {
    title: string;
    text: string;
    url: string;
    imageUrl?: string;
}

/**
 * Attempt native share. Falls back to clipboard copy.
 */
export async function share(payload: SharePayload): Promise<SharePlatform> {
    // Try Web Share API first
    if (typeof navigator !== "undefined" && navigator.share) {
        try {
            await navigator.share({
                title: payload.title,
                text: payload.text,
                url: payload.url,
            });
            return "native";
        } catch {
            // User cancelled or share failed — fall through to clipboard
        }
    }

    // Fallback: copy to clipboard
    await copyToClipboard(`${payload.text}\n${payload.url}`);
    return "clipboard";
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<void> {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
    }
}

/**
 * Build shareable URL for a result.
 */
export function buildShareUrl(
    type: "archetype" | "compatibility" | "redflag" | "vibe" | "face",
    id: string
): string {
    const base = typeof window !== "undefined" ? window.location.origin : "https://ohang.app";
    return `${base}/result/${type}/${id}`;
}

/**
 * Build OG image URL for a result.
 */
export function buildOgUrl(
    type: string,
    params: Record<string, string>
): string {
    const base = typeof window !== "undefined" ? window.location.origin : "https://ohang.app";
    const searchParams = new URLSearchParams({ mode: type, ...params });
    return `${base}/api/og?${searchParams.toString()}`;
}

/**
 * Platform-specific share (for when native share isn't enough)
 */
export function shareToTwitter(payload: SharePayload): void {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(payload.text)}&url=${encodeURIComponent(payload.url)}`;
    window.open(url, "_blank", "width=600,height=400");
}
