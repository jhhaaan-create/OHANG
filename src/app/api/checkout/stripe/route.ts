import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession, PRICE_IDS } from "@/lib/stripe";
import { getAuthenticatedUser, resolveUserId } from "@/lib/ai/cache";

// ═══════════════════════════════════════════════════════
// OHANG — Stripe Checkout API
//
// POST /api/checkout/stripe
// Body: { plan: "basic" | "pro" | "destiny" | "red_flag" | "couple_scan" | "retro_mode" }
//
// Returns: { url: "https://checkout.stripe.com/..." }
// ═══════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

const CheckoutSchema = z.object({
    plan: z.enum(["basic", "pro", "destiny", "red_flag", "couple_scan", "retro_mode"]),
});

// Plan → { priceId, mode }
const PLAN_CONFIG: Record<string, { priceKey: keyof typeof PRICE_IDS; mode: "subscription" | "payment"; tier: string }> = {
    basic:       { priceKey: "basic_onetime",    mode: "payment",      tier: "basic" },
    pro:         { priceKey: "pro_monthly",      mode: "subscription", tier: "pro" },
    destiny:     { priceKey: "destiny_lifetime", mode: "payment",      tier: "destiny" },
    red_flag:    { priceKey: "red_flag",         mode: "payment",      tier: "basic" },
    couple_scan: { priceKey: "couple_scan",      mode: "payment",      tier: "basic" },
    retro_mode:  { priceKey: "retro_mode",       mode: "payment",      tier: "basic" },
};

export async function POST(req: NextRequest) {
    try {
        const auth = await getAuthenticatedUser(req);
        const userId = resolveUserId(auth, req);

        const json = await req.json();
        const { plan } = CheckoutSchema.parse(json);

        const config = PLAN_CONFIG[plan];
        if (!config) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        const priceId = PRICE_IDS[config.priceKey];
        if (!priceId) {
            return NextResponse.json(
                { error: `Stripe Price ID not configured for plan: ${plan}. Set STRIPE_PRICE_* in .env` },
                { status: 500 }
            );
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const url = await createCheckoutSession({
            priceId,
            userId,
            mode: config.mode,
            successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${appUrl}/checkout/cancel`,
            metadata: {
                plan,
                tier: config.tier,
            },
        });

        if (!url) {
            return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
        }

        return NextResponse.json({ url });
    } catch (error) {
        console.error("[Checkout API]", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid request. Provide { plan: 'basic' | 'pro' | 'destiny' | ... }" }, { status: 400 });
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Checkout failed" },
            { status: 500 }
        );
    }
}
