/**
 * OHANG — Stripe Payment Module v2.0
 *
 * Supports:
 *  - Subscription checkout (Pro, Destiny)
 *  - One-time IAP checkout (Basic, Red Flag, Couple Face Scan, Retro)
 *  - Webhook signature verification
 *  - Subscription management helpers
 */

import Stripe from "stripe";

// ── Stripe Client (lazy init) ──────────────────────────
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2026-01-28.clover",
            typescript: true,
        });
    }
    return _stripe;
}

export { getStripe };

// ── Pricing Configuration ──────────────────────────────
// Map Stripe Price IDs from env vars for flexibility.
// In Stripe Dashboard: create Products → copy Price IDs → set in .env
export const PRICE_IDS = {
    // Subscriptions
    pro_monthly:      process.env.STRIPE_PRICE_PRO_MONTHLY       || '',
    ohang_pro_monthly: process.env.STRIPE_PRICE_OHANG_PRO_MONTHLY || '',
    destiny_lifetime: process.env.STRIPE_PRICE_DESTINY_LIFETIME  || '',
    // One-time IAPs
    basic_onetime:  process.env.STRIPE_PRICE_BASIC_ONETIME  || '',
    red_flag:       process.env.STRIPE_PRICE_RED_FLAG       || '',
    couple_scan:    process.env.STRIPE_PRICE_COUPLE_SCAN    || '',
    retro_mode:     process.env.STRIPE_PRICE_RETRO_MODE     || '',
} as const;

// Tier resolved from Stripe product metadata
export type StripeTier = 'free' | 'basic' | 'pro' | 'destiny';

// ── Checkout Session Creation ──────────────────────────

interface CheckoutParams {
    priceId: string;
    userId: string;
    userEmail?: string;
    successUrl: string;
    cancelUrl: string;
    mode: 'subscription' | 'payment';  // subscription for pro/destiny, payment for IAP
    metadata?: Record<string, string>;
}

export async function createCheckoutSession(params: CheckoutParams): Promise<string> {
    const stripe = getStripe();

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        mode: params.mode,
        payment_method_types: ["card"],
        line_items: [{ price: params.priceId, quantity: 1 }],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
            userId: params.userId,
            ...params.metadata,
        },
    };

    // Attach customer email if available
    if (params.userEmail) {
        sessionConfig.customer_email = params.userEmail;
    }

    // For subscriptions, allow promotion codes (launch discount)
    if (params.mode === 'subscription') {
        sessionConfig.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return session.url ?? "";
}

// ── Webhook Event Verification ─────────────────────────

export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string
): Stripe.Event {
    return getStripe().webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
    );
}

// ── Subscription Management Helpers ────────────────────

export async function getCustomerSubscriptions(customerId: string) {
    const stripe = getStripe();
    return stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 5,
    });
}

export async function cancelSubscription(subscriptionId: string) {
    const stripe = getStripe();
    return stripe.subscriptions.cancel(subscriptionId);
}
