import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// ═══════════════════════════════════════════════════════
// OHANG — Stripe Webhook Handler v3.0 (Idempotent)
//
// Idempotency: INSERT event ID with ON CONFLICT DO NOTHING.
//   - 0 rows affected = duplicate → return 200 immediately.
//   - If business logic fails, DELETE event ID → Stripe retries.
//
// Events:
//   checkout.session.completed    → Upgrade user tier
//   customer.subscription.updated → Tier change
//   customer.subscription.deleted → Downgrade to free
//   invoice.payment_failed        → Log warning
// ═══════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

// ── Idempotency Guard ──────────────────────────────────
// Returns true if this event is NEW (should be processed).
// Returns false if this event was already processed (skip).
async function claimEvent(eventId: string, eventType: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    // Atomic INSERT + ON CONFLICT DO NOTHING
    // If event ID already exists, the insert silently does nothing.
    const { data, error } = await supabase
        .from('stripe_events')
        .insert({ id: eventId, event_type: eventType })
        .select('id')
        .single();

    // PostgreSQL 23505 = unique_violation → already processed
    if (error) {
        if (error.code === '23505') return false;
        // For Supabase PostgREST: conflict returns null data, no error
        // If it's a genuine error, log and still return false (fail-safe)
        console.error('[Webhook] claimEvent error:', error);
        return false;
    }

    return !!data;
}

// Rollback: allow retry if business logic fails
async function releaseEvent(eventId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.from('stripe_events').delete().eq('id', eventId);
}

// ── Tier Resolution ────────────────────────────────────
function resolveTierFromMetadata(metadata: Record<string, string> | null): string {
    if (!metadata) return 'basic';
    return metadata.tier || metadata.plan || 'basic';
}

// ── User Tier Upsert ───────────────────────────────────
async function updateUserTier(
    userId: string,
    tier: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
) {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('user_subscriptions')
        .upsert(
            {
                user_id: userId,
                subscription_tier: tier,
                stripe_customer_id: stripeCustomerId || null,
                stripe_subscription_id: stripeSubscriptionId || null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );

    if (error) {
        console.error(`[Webhook] Failed to update tier for ${userId}:`, error);
        throw error;
    }

    console.log(`[Webhook] User ${userId} → tier: ${tier}`);
}

// ── Main Handler ───────────────────────────────────────
export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = constructWebhookEvent(body, signature);
    } catch (err) {
        console.error("[Webhook] Signature verification failed:", err);
        return NextResponse.json(
            { error: "Webhook verification failed" },
            { status: 400 }
        );
    }

    // ── Idempotency check ──
    const isNew = await claimEvent(event.id, event.type);
    if (!isNew) {
        console.log(`[Webhook] Duplicate event skipped: ${event.id}`);
        return NextResponse.json({ received: true, duplicate: true });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;

                if (!userId) {
                    console.error("[Webhook] No userId in checkout metadata");
                    break;
                }

                const tier = resolveTierFromMetadata(session.metadata as Record<string, string>);
                const customerId = typeof session.customer === 'string'
                    ? session.customer
                    : session.customer?.id;
                const subscriptionId = typeof session.subscription === 'string'
                    ? session.subscription
                    : session.subscription?.id;

                await updateUserTier(userId, tier, customerId, subscriptionId);

                if (session.mode === 'payment') {
                    const plan = session.metadata?.plan;
                    if (plan && ['red_flag', 'couple_scan', 'retro_mode'].includes(plan)) {
                        const supabase = getSupabaseAdmin();
                        await supabase
                            .from('user_iap_purchases')
                            .insert({
                                user_id: userId,
                                feature: plan,
                                stripe_payment_id: session.payment_intent as string,
                                purchased_at: new Date().toISOString(),
                            });
                        console.log(`[Webhook] IAP granted: ${userId} → ${plan}`);
                    }
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;
                if (!userId) break;

                const priceId = subscription.items.data[0]?.price.id;
                let newTier = 'pro';
                if (priceId === process.env.STRIPE_PRICE_DESTINY_LIFETIME) {
                    newTier = 'destiny';
                }

                const customerId = typeof subscription.customer === 'string'
                    ? subscription.customer
                    : subscription.customer.id;

                await updateUserTier(userId, newTier, customerId, subscription.id);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;

                if (!userId) {
                    const supabase = getSupabaseAdmin();
                    const { data } = await supabase
                        .from('user_subscriptions')
                        .select('user_id')
                        .eq('stripe_subscription_id', subscription.id)
                        .single();

                    if (data?.user_id) {
                        await updateUserTier(data.user_id, 'free');
                    }
                    break;
                }

                await updateUserTier(userId, 'free');
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = typeof invoice.customer === 'string'
                    ? invoice.customer
                    : invoice.customer?.id;
                console.warn(`[Webhook] Payment failed for customer: ${customerId}`);
                break;
            }

            default:
                console.log(`[Webhook] Unhandled event: ${event.type}`);
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[Webhook] Processing error:", error);
        // ── Rollback: allow Stripe to retry ──
        await releaseEvent(event.id);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
