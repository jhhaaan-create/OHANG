import type { Metadata } from "next";

// ── Base URL ─────────────────────────────────────────────
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://ohang.app";

// ── Default Metadata ─────────────────────────────────────
export const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "OHANG — Five Element Intelligence",
    template: "%s | OHANG",
  },
  description:
    "Discover your elemental identity through Cosmic Blueprint analysis and AI-powered Face Frequency Scan. 518,400 unique profiles. Find your missing piece.",
  keywords: [
    "cosmic blueprint",
    "korean astrology",
    "five forces",
    "personality test",
    "chemistry equation",
    "face frequency scan",
    "gwansang",
    "relationship",
    "ohang",
  ],
  authors: [{ name: "OHANG" }],
  creator: "OHANG",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "OHANG",
    title: "OHANG — Five Element Intelligence",
    description:
      "Discover your elemental identity through Cosmic Blueprint analysis and AI-powered Face Frequency Scan.",
    images: [
      {
        url: `${BASE_URL}/api/og?mode=default`,
        width: 1200,
        height: 630,
        alt: "OHANG — Five Element Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OHANG — Five Element Intelligence",
    description:
      "Discover your elemental identity. 518,400 unique profiles via Cosmic Blueprint.",
    images: [`${BASE_URL}/api/og?mode=default`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

// ── Dynamic Metadata Generators ──────────────────────────

/** Generate metadata for a profile/result page */
export function profileMetadata({
  archetype,
  element,
  name,
  voidElement,
  balance,
}: {
  archetype: string;
  element: string;
  name?: string;
  voidElement?: string;
  balance?: number[];
}): Metadata {
  const title = name
    ? `${name} is ${archetype}`
    : `You are ${archetype}`;
  const description = `${element} Energy · Discover what your Cosmic Blueprint reveals about your deepest patterns, blind spots, and superpowers.`;
  const ogParams = new URLSearchParams({
    mode: "profile",
    archetype,
    element,
    ...(name && { name }),
    ...(voidElement && { void: voidElement }),
    ...(balance && { balance: balance.join(",") }),
  });
  const ogUrl = `${BASE_URL}/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | OHANG`,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | OHANG`,
      description,
      images: [ogUrl],
    },
  };
}

/** Generate metadata for a chemistry/compatibility page */
export function chemistryMetadata({
  archetypeA,
  archetypeB,
  element,
  score,
}: {
  archetypeA: string;
  archetypeB: string;
  element: string;
  score: number;
}): Metadata {
  const title = `${archetypeA} × ${archetypeB}: ${score}% Chemistry`;
  const description = `Elemental chemistry equation. See how ${archetypeA} and ${archetypeB} interact through the Five Forces.`;
  const ogUrl = `${BASE_URL}/api/og?mode=chemistry&archetype=${encodeURIComponent(archetypeA)}&partner=${encodeURIComponent(archetypeB)}&element=${encodeURIComponent(element)}&score=${score}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | OHANG`,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | OHANG`,
      description,
      images: [ogUrl],
    },
  };
}

/** JSON-LD structured data for the main app */
export function appJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OHANG",
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web",
    description:
      "AI-powered personality analysis based on Cosmic Blueprint theory. Discover your archetype, chemistry equation, and daily energy.",
    url: BASE_URL,
    inLanguage: ["en", "ko"],
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier — basic analysis",
      },
      {
        "@type": "Offer",
        price: "7.99",
        priceCurrency: "USD",
        description: "OHANG Pro — 3 tone modes, unlimited chemistry equations, Face Frequency Scan",
      },
      {
        "@type": "Offer",
        price: "39.99",
        priceCurrency: "USD",
        description: "OHANG Destiny — lifetime access, all features forever",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1024",
      bestRating: "5",
    },
  };
}

/** JSON-LD for individual result pages — drives Google Discover */
export function resultJsonLd({
  archetype,
  element,
  name,
  url,
}: {
  archetype: string;
  element: string;
  name?: string;
  url: string;
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${name || "Someone"} is ${archetype} — ${element} Element`,
      description: `Soul Blueprint analysis: ${archetype} archetype powered by ${element} energy. Discover personality patterns, blind spots, and hidden strengths.`,
      url,
      publisher: {
        "@type": "Organization",
        name: "OHANG",
        url: BASE_URL,
      },
      mainEntityOfPage: url,
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: `${archetype} Soul Blueprint`,
      description: `${element} Energy personality profile generated through AI-powered Cosmic Blueprint analysis`,
      creator: { "@type": "Organization", name: "OHANG" },
      genre: "Entertainment",
      inLanguage: "en",
    },
  ];
}
