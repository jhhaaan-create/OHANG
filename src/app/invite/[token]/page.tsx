// src/app/invite/[token]/page.tsx
import type { Metadata } from "next";
import InviteClient from "./InviteClient";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ohang.app";

// ── Dynamic OG metadata for invite links ──
export async function generateMetadata({
    params,
}: {
    params: Promise<{ token: string }>;
}): Promise<Metadata> {
    const { token } = await params;
    return {
        title: "Someone wants to know your chemistry | OHANG",
        description:
            "Your partner invited you to discover your Five Element compatibility. Enter your birth data to reveal your cosmic connection.",
        openGraph: {
            title: "\ud83d\udc9c Someone wants to know your chemistry",
            description: "Enter your birth data. Discover your cosmic connection in 30 seconds.",
            url: `${BASE_URL}/invite/${token}`,
            images: [
                {
                    url: `${BASE_URL}/api/og?mode=invite`,
                    width: 1200,
                    height: 630,
                    alt: "OHANG Chemistry Invite",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: "\ud83d\udc9c Someone wants to know your chemistry | OHANG",
            description: "Enter your birth data. Reveal your cosmic connection.",
            images: [`${BASE_URL}/api/og?mode=invite`],
        },
    };
}

export default async function InvitePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    return <InviteClient token={token} />;
}
