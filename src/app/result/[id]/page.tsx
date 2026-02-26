import { Metadata, ResolvingMetadata } from 'next';
import { getCachedResultById } from '@/lib/db/cached-result';
import { ResultView } from '@/components/analyze/ResultView';
import { resultJsonLd } from '@/lib/metadata';
import { notFound } from 'next/navigation';

// ⚡ Edge Runtime for Global Speed (0.1s TTFB)
export const runtime = 'edge';

// 🔄 Revalidation Strategy (Optional: Cache DB results for 1 hour)
// export const revalidate = 3600;

interface Props {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
}

// ═══════════════════════════════════════════════════════
// 1. Dynamic Metadata Generator (With Cache Busting)
// ═══════════════════════════════════════════════════════
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = params.id;
    const data = await getCachedResultById(id);

    // Fallback for invalid ID
    if (!data) {
        return {
            title: 'Soul Blueprint | OHANG',
            description: 'Decode your internal energy and external destiny.',
        };
    }

    // Extract Key Info
    const archetype = data.user_identity?.core_archetype || 'The Mystery';
    const name = data.user_identity?.name || 'Someone';
    const tagline = data.user_identity?.synthesis_title || 'Decoder of the Unknown';
    const element = data.internal_blueprint?.the_core || 'Water';
    const voidElement = data.internal_blueprint?.the_void || 'Fire';

    // 🛡️ OG Cache Busting Strategy
    // Append current timestamp to force social platforms to fetch a fresh image
    // This bypasses the sticky cache of Instagram/Facebook in-app browsers
    const timestamp = Date.now();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ohang.ai';

    const ogImage = `${baseUrl}/api/og?archetype=${encodeURIComponent(archetype)}&element=${element}&void=${voidElement}&tagline=${encodeURIComponent(tagline)}&ts=${timestamp}`;

    return {
        metadataBase: new URL(baseUrl),
        title: `${name} is ${archetype} | OHANG`,
        description: `Discover your Soul Blueprint. ${tagline}`,
        openGraph: {
            title: `${name}'s Soul Archetype: ${archetype}`,
            description: tagline,
            url: `${baseUrl}/result/${id}`,
            siteName: 'OHANG',
            images: [
                {
                    url: ogImage,
                    width: 1080,
                    height: 1920,
                    alt: `${archetype} Soul Blueprint Card`,
                },
            ],
            locale: 'en_US',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${name} is ${archetype}`,
            description: tagline,
            images: [ogImage],
        },
        // 🤖 Robots settings for SEO visibility
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

// ═══════════════════════════════════════════════════════
// 2. Main Page Component (Hybrid Rendering)
// ═══════════════════════════════════════════════════════
export default async function ResultPage({ params }: Props) {
    const id = params.id;
    const data = await getCachedResultById(id);

    if (!data) {
        notFound(); // Triggers standard 404 page
    }

    // Extract data for JSON-LD
    const archetype = data.user_identity?.core_archetype || 'The Mystery';
    const element = data.internal_blueprint?.the_core || 'Water';
    const name = data.user_identity?.name;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ohang.app';
    const pageUrl = `${baseUrl}/result/${id}`;

    const jsonLdItems = resultJsonLd({ archetype, element, name, url: pageUrl });

    return (
        <>
            {/* JSON-LD for Google Discover & Rich Results */}
            {jsonLdItems.map((item, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
                />
            ))}
            <ResultView data={data} />
        </>
    );
}
